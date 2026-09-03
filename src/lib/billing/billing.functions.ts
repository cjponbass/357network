import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { BILLABLE_STATUSES, PLAN_ENTITLEMENTS, isCandidatePlan, planAllows, type CandidatePlan } from "./plans";

export type BillingStatus = {
  configured: boolean;
  plan: CandidatePlan | null;
  status: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  active: boolean;
  entitlements: typeof PLAN_ENTITLEMENTS.basic | null;
};

function validatePlan(input: { plan: CandidatePlan }) {
  if (!isCandidatePlan(input?.plan)) throw new Error("Invalid plan.");
  return input;
}

function appBaseUrl(): string {
  const request = getRequest();
  const requestOrigin = request ? new URL(request.url).origin : null;
  return process.env["PUBLIC_APP_URL"] || requestOrigin || "http://localhost:3000";
}

export const getBillingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BillingStatus> => {
    const { data, error } = await context.supabase.from("subscriptions").select("plan,status,trial_ends_at,current_period_end,cancel_at_period_end").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    const plan = isCandidatePlan(data?.plan) ? data.plan : null;
    const status = typeof data?.status === "string" ? data.status : null;
    const active = Boolean(plan && status && BILLABLE_STATUSES.has(status));
    return {
      configured: Boolean(process.env["STRIPE_SECRET_KEY"] && process.env["STRIPE_PRICE_BASIC"] && process.env["STRIPE_PRICE_PRO"] && process.env["STRIPE_PRICE_AUTO"] && process.env["STRIPE_WEBHOOK_SECRET"]),
      plan,
      status,
      trialEndsAt: data?.trial_ends_at ?? null,
      currentPeriodEnd: data?.current_period_end ?? null,
      cancelAtPeriodEnd: data?.cancel_at_period_end === true,
      active,
      entitlements: active && plan ? PLAN_ENTITLEMENTS[plan] : null,
    };
  });

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validatePlan)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id,status")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);

    const baseUrl = appBaseUrl();
    const customerId = existing?.stripe_customer_id ?? null;
    const currentStatus = existing?.status ?? null;
    if (customerId && currentStatus && currentStatus !== "canceled" && currentStatus !== "unpaid" && currentStatus !== "incomplete") {
      const { createCustomerPortal } = await import("./stripe.server");
      return { url: await createCustomerPortal({ customerId, returnUrl: `${baseUrl}/billing` }) };
    }

    const { createSubscriptionCheckout } = await import("./stripe.server");
    const email = typeof context.claims?.email === "string" ? context.claims.email : null;
    const url = await createSubscriptionCheckout({
      plan: data.plan,
      userId: context.userId,
      email,
      customerId,
      trialDays: customerId ? 0 : 5,
      successUrl: `${baseUrl}/billing?checkout=success`,
      cancelUrl: `${baseUrl}/pricing?checkout=cancelled`,
    });
    return { url };
  });

export const createBillingPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("subscriptions").select("stripe_customer_id").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.stripe_customer_id) throw new Error("No Stripe customer is linked to this account yet.");
    const { createCustomerPortal } = await import("./stripe.server");
    return { url: await createCustomerPortal({ customerId: data.stripe_customer_id, returnUrl: `${appBaseUrl()}/billing` }) };
  });

export async function requirePaidPlan(
  supabase: SupabaseClient<Database>,
  userId: string,
  required: CandidatePlan,
): Promise<CandidatePlan> {
  const { data, error } = await supabase.from("subscriptions").select("plan,status").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!isCandidatePlan(data?.plan) || !BILLABLE_STATUSES.has(data?.status ?? "")) throw new Error("An active 357Network subscription is required.");
  if (!planAllows(data.plan, required)) throw new Error(`${required.toUpperCase()} plan or higher is required for this feature.`);
  return data.plan;
}
