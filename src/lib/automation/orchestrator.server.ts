/** Server-only ATS submission orchestration. */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import { detectAts } from "./ats-detect";
import type { CandidateContext } from "./adapters/contract";
import { getAdapter } from "./adapters/registry";
import {
  buildFillInputs,
  buildIdempotencyKey,
  buildSubmittedAnswers,
  canCreateReceipt,
  outcomeForBlockers,
  requiresUserInput,
} from "./execution";
import { normalizeLiveFields } from "./live-fields";
import type { ProviderSession } from "./provider/contract";
import { detectProviderConfig, resolveBrowserProvider } from "./provider/resolve.server";
import type {
  AutomationErrorCategory,
  ReadinessReport,
  ResolvedField,
  SubmissionState,
} from "./types";

type Client = SupabaseClient<Database>;

export interface ExecutionResult {
  attemptId: string | null;
  state: SubmissionState;
  errorCategory: AutomationErrorCategory | null;
  receiptId: string | null;
  message: string;
  automationConfigured: boolean;
  automationProvider: string | null;
}

const DISCLAIMER =
  "Dry run only. Nothing was sent to the employer or ATS, no confirmation was captured and no receipt was created.";

async function loadContext(supabase: Client, userId: string, applicationId: string) {
  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (appError) throw new Error(appError.message);
  if (!application) throw new Error("Application not found.");

  const [jobRes, profileRes, answersRes, resumeRes] = await Promise.all([
    supabase
      .from("jobs")
      .select("*")
      .eq("id", application.job_id)
      .eq("created_by", userId)
      .maybeSingle(),
    supabase.from("candidate_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("saved_answers").select("question, answer").eq("user_id", userId),
    application.resume_document_id
      ? supabase
          .from("documents")
          .select("id, name, mime_type, size_bytes")
          .eq("id", application.resume_document_id)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (jobRes.error) throw new Error(jobRes.error.message);
  if (!jobRes.data) throw new Error("Job not found.");

  const { data: materials } = await supabase
    .from("application_materials")
    .select("cover_letter_text")
    .eq("user_id", userId)
    .eq("job_id", jobRes.data.id)
    .maybeSingle();

  const profile = profileRes.data;
  const resumeDoc = resumeRes.data;
  const candidate: CandidateContext = {
    fullName: profile?.full_name?.trim() || null,
    email: profile?.email ?? null,
    phone: profile?.phone ?? null,
    location: profile?.location ?? null,
    linkedinUrl: profile?.linkedin_url ?? null,
    githubUrl: profile?.github_url ?? null,
    websiteUrl: profile?.website_url ?? null,
    resumeDocument: resumeDoc
      ? {
          id: resumeDoc.id,
          fileName: resumeDoc.name,
          mimeType: resumeDoc.mime_type,
          sizeBytes: resumeDoc.size_bytes,
        }
      : null,
    coverLetterText: materials?.cover_letter_text || null,
    savedAnswers: answersRes.data ?? [],
  };

  return { application, job: jobRes.data, candidate };
}

export async function runReadinessCheck(
  supabase: Client,
  userId: string,
  applicationId: string,
): Promise<ReadinessReport> {
  const { job, candidate } = await loadContext(supabase, userId, applicationId);
  const targetUrl = job.source_url;
  const detection = detectAts(targetUrl);
  const adapter = getAdapter(detection.provider);
  const browser = detectProviderConfig();
  const blockers: string[] = [];
  const notes: string[] = [];
  let resolved: ReadinessReport["resolved"] = [];
  let unresolved: ReadinessReport["unresolved"] = [];

  if (!targetUrl) blockers.push("This job has no application URL saved.");
  if (!adapter) {
    blockers.push(
      detection.provider === "unknown"
        ? "The application URL does not match a supported ATS."
        : `${detection.provider} is detected, but its submission adapter is not implemented yet.`,
    );
  } else {
    const inspection = adapter.inspectForm(targetUrl ?? "");
    notes.push(...inspection.notes);
    const mapped = adapter.mapFacts(inspection.fields, candidate);
    const sanitized = mapped.map((field) => ({ ...field, fill: null }));
    resolved = sanitized.filter((field) => field.source !== "unresolved");
    unresolved = sanitized.filter((field) => field.source === "unresolved");
    const requiredMissing = unresolved.filter((field) => field.required);
    if (requiredMissing.length > 0) {
      blockers.push(
        `${requiredMissing.length} required question(s) need your input: ${requiredMissing
          .map((field) => field.label)
          .join(", ")}.`,
      );
    }
    notes.push(
      "Static readiness only. A real run re-inspects the live form and stops on new required questions.",
    );
  }

  if (!browser.executable) {
    blockers.push(
      !browser.configured
        ? "No browser-automation provider is configured."
        : !browser.driverAvailable
          ? "A browser-automation credential is present, but its driver is unavailable."
          : `The ${browser.provider} driver still needs: ${browser.missingConfig.join(", ")}.`,
    );
  }

  const nextState: SubmissionState = blockers.length === 0 ? "queued" : "needs_user_input";
  const errorCategory: AutomationErrorCategory | null = !targetUrl
    ? "missing_url"
    : !adapter
      ? "unsupported_ats"
      : unresolved.some((field) => field.required)
        ? "missing_facts"
        : !browser.configured
          ? "no_automation_provider"
          : !browser.executable
            ? "provider_unavailable"
            : null;

  const checkedAt = new Date().toISOString();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: attempt } = await supabaseAdmin
    .from("submission_attempts")
    .insert({
      user_id: userId,
      application_id: applicationId,
      ats_provider: detection.provider,
      state: nextState,
      dry_run: true,
      target_url: targetUrl,
      automation_provider: browser.provider,
      started_at: checkedAt,
      completed_at: checkedAt,
      error_category: errorCategory,
      error_message: blockers[0] ?? null,
      unresolved_questions: unresolved.map((field) => ({
        key: field.key,
        label: field.label,
        required: field.required,
      })),
      available_facts: Object.fromEntries(resolved.map((field) => [field.key, field.source])),
      evidence: {},
    })
    .select("id")
    .maybeSingle();

  return {
    applicationId,
    jobTitle: job.title,
    company: job.company,
    targetUrl,
    detectedProvider: detection.provider,
    detectionReason: detection.reason,
    adapterImplemented: Boolean(adapter?.implemented),
    automationConfigured: browser.configured,
    automationDriverAvailable: browser.driverAvailable,
    automationExecutable: browser.executable,
    automationProvider: browser.provider,
    resolved,
    unresolved,
    blockers,
    notes,
    nextState,
    errorCategory,
    attemptId: attempt?.id ?? null,
    checkedAt,
    dryRun: true,
    disclaimer: DISCLAIMER,
  };
}

export async function runSubmission(
  supabase: Client,
  userId: string,
  applicationId: string,
  requestKey?: string | null,
): Promise<ExecutionResult> {
  const { job, candidate } = await loadContext(supabase, userId, applicationId);
  const targetUrl = job.source_url;
  const detection = detectAts(targetUrl);
  const adapter = getAdapter(detection.provider);
  const config = detectProviderConfig();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const base = { automationConfigured: config.configured, automationProvider: config.provider };

  const { data: existingReceipt } = await supabaseAdmin
    .from("submission_receipts")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (existingReceipt) {
    return {
      ...base,
      attemptId: null,
      state: "succeeded",
      errorCategory: "already_submitted",
      receiptId: existingReceipt.id,
      message: "This application already has a verified receipt. Nothing was re-sent.",
    };
  }

  const idempotencyKey = buildIdempotencyKey({ applicationId, targetUrl, requestKey });
  const { data: priorAttempt } = await supabaseAdmin
    .from("submission_attempts")
    .select("id, state, error_category, error_message, receipt_id")
    .eq("application_id", applicationId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (
    priorAttempt &&
    (priorAttempt.state === "queued" ||
      priorAttempt.state === "running" ||
      priorAttempt.state === "succeeded")
  ) {
    return {
      ...base,
      attemptId: priorAttempt.id,
      state: priorAttempt.state,
      errorCategory: (priorAttempt.error_category as AutomationErrorCategory | null) ?? null,
      receiptId: priorAttempt.receipt_id,
      message:
        priorAttempt.state === "succeeded"
          ? "This submission already completed."
          : "A submission attempt for this application is already in progress.",
    };
  }

  const now = new Date().toISOString();
  let currentAttemptId = priorAttempt?.id ?? null;
  const insertPayload = {
    user_id: userId,
    application_id: applicationId,
    ats_provider: detection.provider,
    state: "queued" as SubmissionState,
    dry_run: false,
    target_url: targetUrl,
    automation_provider: config.provider,
    idempotency_key: idempotencyKey,
    started_at: now,
    evidence: {},
  };

  if (currentAttemptId) {
    await supabaseAdmin
      .from("submission_attempts")
      .update({ ...insertPayload, completed_at: null, error_category: null, error_message: null })
      .eq("id", currentAttemptId);
  } else {
    const { data: created, error: insertError } = await supabaseAdmin
      .from("submission_attempts")
      .insert(insertPayload)
      .select("id")
      .maybeSingle();
    if (insertError) {
      return {
        ...base,
        attemptId: null,
        state: "queued",
        errorCategory: "already_submitted",
        receiptId: null,
        message: "Another submission attempt is already active.",
      };
    }
    currentAttemptId = created?.id ?? null;
  }

  const finish = async (
    state: SubmissionState,
    errorCategory: AutomationErrorCategory | null,
    message: string,
    extra: { evidence?: Record<string, unknown>; receiptId?: string | null } = {},
  ): Promise<ExecutionResult> => {
    if (currentAttemptId) {
      await supabaseAdmin
        .from("submission_attempts")
        .update({
          state,
          error_category: errorCategory,
          error_message: state === "succeeded" ? null : message,
          completed_at: new Date().toISOString(),
          evidence: (extra.evidence ?? {}) as never,
          receipt_id: extra.receiptId ?? null,
        })
        .eq("id", currentAttemptId);
    }
    return {
      ...base,
      attemptId: currentAttemptId,
      state,
      errorCategory,
      receiptId: extra.receiptId ?? null,
      message,
    };
  };

  if (currentAttemptId) {
    await supabaseAdmin.from("submission_attempts").update({ state: "running" }).eq("id", currentAttemptId);
  }
  if (!targetUrl) return finish("needs_user_input", "missing_url", "This job has no application URL.");
  if (!adapter) return finish("failed", "unsupported_ats", "No implemented adapter matches this URL.");

  const stopOnUnresolved = async (fields: ResolvedField[]) => {
    const blocking = requiresUserInput(fields);
    if (blocking.length === 0) return null;
    if (currentAttemptId) {
      await supabaseAdmin
        .from("submission_attempts")
        .update({
          unresolved_questions: blocking.map((field) => ({
            key: field.key,
            label: field.label,
            required: field.required,
            sensitive: field.sensitive,
          })) as never,
        })
        .eq("id", currentAttemptId);
    }
    return finish(
      "needs_user_input",
      "missing_facts",
      `Waiting on your answers: ${blocking.map((field) => field.label).join(", ")}. Sensitive, legal, demographic, compensation and work-authorization questions are never guessed.`,
    );
  };

  const staticMapped = adapter.mapFacts(adapter.inspectForm(targetUrl).fields, candidate);
  const staticStop = await stopOnUnresolved(staticMapped);
  if (staticStop) return staticStop;

  const provider = await resolveBrowserProvider({ userId });
  if (!provider) {
    return finish(
      "failed",
      config.configured ? "provider_unavailable" : "no_automation_provider",
      config.configured
        ? "The browser provider could not be started; nothing was submitted."
        : "Automation is not configured; nothing was submitted.",
    );
  }

  let session: ProviderSession | null = null;
  try {
    session = await provider.openSession(targetUrl);
    const inspection = await provider.inspect(session);
    const inspectOutcome = outcomeForBlockers(inspection.blockers);
    if (inspectOutcome) {
      return finish(
        inspectOutcome.state,
        inspectOutcome.errorCategory,
        inspectOutcome.message ?? "The live form could not be inspected.",
      );
    }

    const liveMapped = adapter.mapFacts(normalizeLiveFields(inspection.fields), candidate);
    const liveStop = await stopOnUnresolved(liveMapped);
    if (liveStop) return liveStop;

    const fillResult = await provider.fill(session, buildFillInputs(liveMapped));
    const fillOutcome = outcomeForBlockers(fillResult.blockers);
    if (fillOutcome) {
      return finish(
        fillOutcome.state,
        fillOutcome.errorCategory,
        fillOutcome.message ?? "The form could not be completed.",
      );
    }
    if (fillResult.failed.length > 0) {
      return finish(
        "needs_user_input",
        "missing_facts",
        `Could not complete: ${fillResult.failed.map((field) => field.key).join(", ")}.`,
      );
    }

    const submitResult = await provider.submit(session);
    const submitOutcome = outcomeForBlockers(submitResult.blockers);
    if (submitOutcome) {
      return finish(
        submitOutcome.state,
        submitOutcome.errorCategory,
        submitOutcome.message ?? "Submission stopped before completion.",
      );
    }

    const verifyResult = await provider.verify(session);
    const evidence = await provider.captureEvidence(session);
    if (
      !canCreateReceipt({
        verified: verifyResult.verified,
        confirmationText: verifyResult.confirmationText,
        confirmationUrl: verifyResult.confirmationUrl,
        submitted: submitResult.submitted,
      })
    ) {
      return finish(
        "failed",
        "verification_failed",
        "No concrete confirmation evidence was returned, so no verified receipt was created.",
        { evidence: { ...evidence, verify: verifyResult } },
      );
    }

    const { data: receipt, error: receiptError } = await supabaseAdmin
      .from("submission_receipts")
      .insert({
        application_id: applicationId,
        ats_name: adapter.displayName,
        application_url: verifyResult.confirmationUrl ?? targetUrl,
        confirmation_text: verifyResult.confirmationText,
        screenshot_path: evidence.screenshotPath,
        submitted_at: new Date().toISOString(),
        verified: true,
        answers: buildSubmittedAnswers(liveMapped) as never,
      })
      .select("id")
      .maybeSingle();

    if (receiptError || !receipt) {
      const { data: existing } = await supabaseAdmin
        .from("submission_receipts")
        .select("id")
        .eq("application_id", applicationId)
        .maybeSingle();
      if (existing) {
        return finish("succeeded", null, "Submission verified; receipt already recorded.", {
          evidence,
          receiptId: existing.id,
        });
      }
      return finish("failed", "provider_error", "Submission verified but receipt storage failed.", {
        evidence,
      });
    }

    return finish("succeeded", null, "Submission verified and receipt recorded.", {
      evidence: { ...evidence, verify: verifyResult },
      receiptId: receipt.id,
    });
  } catch (error) {
    return finish(
      "failed",
      "provider_error",
      error instanceof Error ? error.message : "The automation provider failed unexpectedly.",
    );
  } finally {
    if (session) await provider.closeSession(session).catch(() => undefined);
  }
}
