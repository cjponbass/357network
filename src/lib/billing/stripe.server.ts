import { isCandidatePlan, type CandidatePlan } from "./plans";

const STRIPE_API = "https://api.stripe.com/v1";
type StripeObject = Record<string, unknown>;

function requireStripeSecret(): string {
  const value = process.env["STRIPE_SECRET_KEY"];
  if (!value) throw new Error("Stripe is not configured: STRIPE_SECRET_KEY is missing.");
  return value;
}

function priceIdFor(plan: CandidatePlan): string {
  const names: Record<CandidatePlan, string> = { basic: "STRIPE_PRICE_BASIC", pro: "STRIPE_PRICE_PRO", auto: "STRIPE_PRICE_AUTO" };
  const value = process.env[names[plan]];
  if (!value) throw new Error(`Stripe price is not configured for ${plan}.`);
  return value;
}

function getErrorMessage(json: StripeObject): string | null {
  const error = json["error"];
  if (!error || typeof error !== "object") return null;
  const message = (error as Record<string, unknown>)["message"];
  return typeof message === "string" ? message : null;
}

async function stripePost(path: string, body: URLSearchParams): Promise<StripeObject> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${requireStripeSecret()}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await response.json()) as StripeObject;
  if (!response.ok) throw new Error(getErrorMessage(json) ?? `Stripe request failed (${response.status}).`);
  return json;
}

export async function createSubscriptionCheckout(args: {
  plan: CandidatePlan;
  userId: string;
  email?: string | null;
  customerId?: string | null;
  trialDays: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("success_url", args.successUrl);
  body.set("cancel_url", args.cancelUrl);
  body.set("client_reference_id", args.userId);
  if (args.customerId) body.set("customer", args.customerId);
  else if (args.email) body.set("customer_email", args.email);
  body.set("line_items[0][price]", priceIdFor(args.plan));
  body.set("line_items[0][quantity]", "1");
  if (args.trialDays > 0) body.set("subscription_data[trial_period_days]", String(args.trialDays));
  body.set("subscription_data[metadata][user_id]", args.userId);
  body.set("subscription_data[metadata][plan]", args.plan);
  body.set("metadata[user_id]", args.userId);
  body.set("metadata[plan]", args.plan);
  body.set("allow_promotion_codes", "true");

  const session = await stripePost("/checkout/sessions", body);
  const url = session["url"];
  if (typeof url !== "string") throw new Error("Stripe did not return a checkout URL.");
  return url;
}

export async function createCustomerPortal(args: { customerId: string; returnUrl: string }): Promise<string> {
  const body = new URLSearchParams();
  body.set("customer", args.customerId);
  body.set("return_url", args.returnUrl);
  const session = await stripePost("/billing_portal/sessions", body);
  const url = session["url"];
  if (typeof url !== "string") throw new Error("Stripe did not return a billing portal URL.");
  return url;
}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function verifyStripeWebhook(rawBody: string, signatureHeader: string | null): Promise<StripeObject> {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) throw new Error("Stripe webhook secret is not configured.");
  if (!signatureHeader) throw new Error("Missing Stripe-Signature header.");
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length) throw new Error("Invalid Stripe signature header.");
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) throw new Error("Stripe webhook timestamp outside tolerance.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
  const expected = hex(digest);
  if (!signatures.some((candidate) => constantTimeEqual(candidate, expected))) throw new Error("Invalid Stripe webhook signature.");
  return JSON.parse(rawBody) as StripeObject;
}

export function subscriptionSnapshot(object: StripeObject): {
  userId: string;
  plan: CandidatePlan;
  customerId: string | null;
  subscriptionId: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
} | null {
  const metadataValue = object["metadata"];
  const metadata = metadataValue && typeof metadataValue === "object" ? metadataValue as Record<string, unknown> : {};
  const userId = metadata["user_id"];
  const plan = metadata["plan"];
  const subscriptionId = object["id"];
  if (typeof userId !== "string" || !isCandidatePlan(plan) || typeof subscriptionId !== "string") return null;
  const unixToIso = (value: unknown) => typeof value === "number" ? new Date(value * 1000).toISOString() : null;
  const customer = object["customer"];
  const status = object["status"];
  return {
    userId,
    plan,
    customerId: typeof customer === "string" ? customer : null,
    subscriptionId,
    status: typeof status === "string" ? status : "incomplete",
    trialEndsAt: unixToIso(object["trial_end"]),
    currentPeriodEnd: unixToIso(object["current_period_end"]),
    cancelAtPeriodEnd: object["cancel_at_period_end"] === true,
  };
}
