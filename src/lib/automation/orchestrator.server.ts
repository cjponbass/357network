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
  shouldMarkApplicationSubmitted,
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
const MAX_FORM_STEPS = 12;

async function loadContext(supabase: Client, userId: string, applicationId: string) {
  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (appError) throw new Error(appError.message);
  if (!application) throw new Error("Application not found.");

  const [jobRes, profileRes, answersRes, resumeRes, coverRes] = await Promise.all([
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
    application.cover_letter_document_id
      ? supabase
          .from("documents")
          .select("id, name, mime_type, size_bytes")
          .eq("id", application.cover_letter_document_id)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (jobRes.error) throw new Error(jobRes.error.message);
  if (!jobRes.data) throw new Error("Job not found.");
  if (profileRes.error) throw new Error(profileRes.error.message);
  if (answersRes.error) throw new Error(answersRes.error.message);
  if (resumeRes.error) throw new Error(resumeRes.error.message);
  if (coverRes.error) throw new Error(coverRes.error.message);

  const { data: materials, error: materialsError } = await supabase
    .from("application_materials")
    .select("cover_letter_text")
    .eq("user_id", userId)
    .eq("job_id", jobRes.data.id)
    .maybeSingle();
  if (materialsError) throw new Error(materialsError.message);

  const toDocumentFact = (document: typeof resumeRes.data) =>
    document
      ? {
          id: document.id,
          fileName: document.name,
          mimeType: document.mime_type,
          sizeBytes: document.size_bytes,
        }
      : null;

  const profile = profileRes.data;
  const candidate: CandidateContext = {
    fullName: profile?.full_name?.trim() || null,
    email: profile?.email ?? null,
    phone: profile?.phone ?? null,
    location: profile?.location ?? null,
    linkedinUrl: profile?.linkedin_url ?? null,
    githubUrl: profile?.github_url ?? null,
    websiteUrl: profile?.website_url ?? null,
    resumeDocument: toDocumentFact(resumeRes.data),
    coverLetterDocument: toDocumentFact(coverRes.data),
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
      notes.push(
        `Static ATS template suggests ${requiredMissing.length} possible required question(s): ${requiredMissing
          .map((field) => field.label)
          .join(", ")}. These are advisory only; the live employer form determines what actually requires your input.`,
      );
    }
    notes.push(
      "Static readiness only. A real run re-inspects every live form step and stops only on actual unresolved required questions.",
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
  const { application, job, candidate } = await loadContext(supabase, userId, applicationId);
  const targetUrl = job.source_url;
  const detection = detectAts(targetUrl);
  const adapter = getAdapter(detection.provider);
  const config = detectProviderConfig();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const base = { automationConfigured: config.configured, automationProvider: config.provider };

  const markVerifiedSubmissionInTracker = async () => {
    if (!shouldMarkApplicationSubmitted(application.status)) return;
    const submittedAt = new Date().toISOString();
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("applications")
      .update({ status: "submitted", submitted_at: submittedAt })
      .eq("id", applicationId)
      .eq("user_id", userId)
      .eq("status", "draft")
      .select("id")
      .maybeSingle();
    if (updateError || !updated) return;
    await supabaseAdmin.from("application_status_events").insert({
      application_id: applicationId,
      from_status: "draft",
      to_status: "submitted",
      note: "Verified ATS submission receipt recorded.",
      occurred_at: submittedAt,
    });
  };

  const { data: existingReceipt } = await supabaseAdmin
    .from("submission_receipts")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (existingReceipt) {
    return { ...base, attemptId: null, state: "succeeded", errorCategory: "already_submitted", receiptId: existingReceipt.id, message: "This application already has a verified receipt. Nothing was re-sent." };
  }

  const idempotencyKey = buildIdempotencyKey({ applicationId, targetUrl, requestKey });
  const { data: priorAttempt } = await supabaseAdmin
    .from("submission_attempts")
    .select("id, state, error_category, error_message, receipt_id")
    .eq("application_id", applicationId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (priorAttempt && (priorAttempt.state === "queued" || priorAttempt.state === "running" || priorAttempt.state === "succeeded" || priorAttempt.error_category === "verification_failed")) {
    const verificationUncertain = priorAttempt.error_category === "verification_failed";
    return {
      ...base,
      attemptId: priorAttempt.id,
      state: priorAttempt.state,
      errorCategory: (priorAttempt.error_category as AutomationErrorCategory | null) ?? null,
      receiptId: priorAttempt.receipt_id,
      message: verificationUncertain
        ? "A prior attempt may have reached the employer, but durable receipt verification is incomplete. Automatic retry is blocked to prevent a duplicate application."
        : priorAttempt.state === "succeeded" ? "This submission already completed." : "A submission attempt for this application is already in progress.",
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
    const { data: updatedAttempt, error: updateError } = await supabaseAdmin
      .from("submission_attempts")
      .update({ ...insertPayload, completed_at: null, error_category: null, error_message: null })
      .eq("id", currentAttemptId)
      .select("id")
      .maybeSingle();
    if (updateError || !updatedAttempt?.id) return { ...base, attemptId: currentAttemptId, state: "failed", errorCategory: "provider_error", receiptId: null, message: "The submission attempt could not be re-queued safely, so nothing was sent." };
    currentAttemptId = updatedAttempt.id;
  } else {
    const { data: created, error: insertError } = await supabaseAdmin.from("submission_attempts").insert(insertPayload).select("id").maybeSingle();
    if (insertError) {
      const duplicateAttempt = insertError.code === "23505";
      return { ...base, attemptId: null, state: "failed", errorCategory: duplicateAttempt ? "already_submitted" : "provider_error", receiptId: null, message: duplicateAttempt ? "Another submission attempt is already active." : "The submission attempt could not be recorded safely, so nothing was sent." };
    }
    if (!created?.id) return { ...base, attemptId: null, state: "failed", errorCategory: "provider_error", receiptId: null, message: "The submission attempt could not be confirmed in storage, so nothing was sent." };
    currentAttemptId = created.id;
  }

  const finish = async (
    state: SubmissionState,
    errorCategory: AutomationErrorCategory | null,
    message: string,
    extra: { evidence?: Record<string, unknown>; receiptId?: string | null } = {},
  ): Promise<ExecutionResult> => {
    if (currentAttemptId) {
      await supabaseAdmin.from("submission_attempts").update({
        state,
        error_category: errorCategory,
        error_message: state === "succeeded" ? null : message,
        completed_at: new Date().toISOString(),
        evidence: (extra.evidence ?? {}) as never,
        receipt_id: extra.receiptId ?? null,
      }).eq("id", currentAttemptId);
    }
    return { ...base, attemptId: currentAttemptId, state, errorCategory, receiptId: extra.receiptId ?? null, message };
  };

  if (currentAttemptId) await supabaseAdmin.from("submission_attempts").update({ state: "running" }).eq("id", currentAttemptId);
  if (!targetUrl) return finish("needs_user_input", "missing_url", "This job has no application URL.");
  if (!adapter) return finish("failed", "unsupported_ats", "No implemented adapter matches this URL.");

  const stopOnUnresolved = async (fields: ResolvedField[]) => {
    const blocking = requiresUserInput(fields);
    if (blocking.length === 0) return null;
    if (currentAttemptId) {
      await supabaseAdmin.from("submission_attempts").update({
        unresolved_questions: blocking.map((field) => ({ key: field.key, label: field.label, required: field.required, sensitive: field.sensitive })) as never,
      }).eq("id", currentAttemptId);
    }
    return finish("needs_user_input", "missing_facts", `Waiting on your answers: ${blocking.map((field) => field.label).join(", ")}. Sensitive, legal, demographic, compensation and work-authorization questions are never guessed.`);
  };

  const provider = await resolveBrowserProvider({ userId });
  if (!provider) {
    return finish("failed", config.configured ? "provider_unavailable" : "no_automation_provider", config.configured ? "The browser provider could not be started; nothing was submitted." : "Automation is not configured; nothing was submitted.");
  }

  let session: ProviderSession | null = null;
  try {
    session = await provider.openSession(targetUrl);
    const allMapped: ResolvedField[] = [];
    let submitResult: Awaited<ReturnType<typeof provider.submit>> | null = null;

    for (let step = 1; step <= MAX_FORM_STEPS; step += 1) {
      const inspection = await provider.inspect(session);
      const inspectOutcome = outcomeForBlockers(inspection.blockers);
      if (inspectOutcome) return finish(inspectOutcome.state, inspectOutcome.errorCategory, inspectOutcome.message ?? "The live form could not be inspected.");

      const liveMapped = adapter.mapFacts(normalizeLiveFields(inspection.fields), candidate);
      allMapped.push(...liveMapped);
      const liveStop = await stopOnUnresolved(liveMapped);
      if (liveStop) return liveStop;

      const fillResult = await provider.fill(session, buildFillInputs(liveMapped));
      const fillOutcome = outcomeForBlockers(fillResult.blockers);
      if (fillOutcome) return finish(fillOutcome.state, fillOutcome.errorCategory, fillOutcome.message ?? "The form could not be completed.");
      if (fillResult.failed.length > 0) return finish("needs_user_input", "missing_facts", `Could not complete: ${fillResult.failed.map((field) => field.key).join(", ")}.`);

      submitResult = await provider.submit(session);
      if (submitResult.submitted) break;

      const onlyNoFinalSubmit = submitResult.blockers.length === 1 && submitResult.blockers[0]?.kind === "unsupported_widget";
      if (onlyNoFinalSubmit && provider.advance && step < MAX_FORM_STEPS) {
        const advanceResult = await provider.advance(session);
        const advanceOutcome = outcomeForBlockers(advanceResult.blockers);
        if (!advanceOutcome && advanceResult.advanced) continue;
        if (advanceOutcome) return finish(advanceOutcome.state, advanceOutcome.errorCategory, advanceOutcome.message ?? "The next application step could not be opened.");
      }

      const submitOutcome = outcomeForBlockers(submitResult.blockers);
      if (submitOutcome) return finish(submitOutcome.state, submitOutcome.errorCategory, submitOutcome.message ?? "Submission stopped before completion.");
      return finish("failed", "provider_error", "The employer form did not submit and could not advance safely.");
    }

    if (!submitResult?.submitted) return finish("failed", "unsupported_ats", `The application exceeded the ${MAX_FORM_STEPS}-step safety limit without reaching an unambiguous final submit control.`);

    const verifyResult = await provider.verify(session);
    const evidence = await provider.captureEvidence(session);
    if (!canCreateReceipt({ verified: verifyResult.verified, confirmationText: verifyResult.confirmationText, confirmationUrl: verifyResult.confirmationUrl, submitted: submitResult.submitted })) {
      return finish("failed", "verification_failed", "No concrete confirmation evidence was returned, so no verified receipt was created.", { evidence: { ...evidence, verify: verifyResult } });
    }

    const { data: receipt, error: receiptError } = await supabaseAdmin.from("submission_receipts").insert({
      application_id: applicationId,
      ats_name: adapter.displayName,
      application_url: verifyResult.confirmationUrl ?? targetUrl,
      confirmation_text: verifyResult.confirmationText,
      screenshot_path: evidence.screenshotPath,
      submitted_at: new Date().toISOString(),
      verified: true,
      answers: buildSubmittedAnswers(allMapped) as never,
    }).select("id").maybeSingle();

    if (receiptError || !receipt) {
      const { data: existing } = await supabaseAdmin.from("submission_receipts").select("id").eq("application_id", applicationId).maybeSingle();
      if (existing) {
        await markVerifiedSubmissionInTracker();
        return finish("succeeded", null, "Submission verified; receipt already recorded.", { evidence, receiptId: existing.id });
      }
      return finish("failed", "verification_failed", "Submission was verified at the employer, but receipt storage failed. Automatic retry is blocked to prevent a duplicate application.", { evidence: { ...evidence, verify: verifyResult } });
    }

    await markVerifiedSubmissionInTracker();
    return finish("succeeded", null, "Submission verified and receipt recorded.", { evidence: { ...evidence, verify: verifyResult }, receiptId: receipt.id });
  } catch (error) {
    return finish("failed", "provider_error", error instanceof Error ? error.message : "The automation provider failed unexpectedly.");
  } finally {
    if (session) await provider.closeSession(session);
  }
}
