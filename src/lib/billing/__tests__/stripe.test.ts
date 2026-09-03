import { afterEach, describe, expect, it } from "vitest";

import { subscriptionSnapshot, verifyStripeWebhook } from "../stripe.server";

const originalSecret = process.env["STRIPE_WEBHOOK_SECRET"];

afterEach(() => {
  if (originalSecret === undefined) delete process.env["STRIPE_WEBHOOK_SECRET"];
  else process.env["STRIPE_WEBHOOK_SECRET"] = originalSecret;
});

async function sign(secret: string, timestamp: number, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

describe("Stripe billing safety", () => {
  it("accepts a valid recent Stripe webhook signature", async () => {
    const secret = "whsec_test_357network";
    process.env["STRIPE_WEBHOOK_SECRET"] = secret;
    const body = JSON.stringify({ id: "evt_1", type: "customer.subscription.updated" });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await sign(secret, timestamp, body);

    await expect(verifyStripeWebhook(body, `t=${timestamp},v1=${signature}`)).resolves.toMatchObject({ id: "evt_1" });
  });

  it("rejects a bad webhook signature", async () => {
    process.env["STRIPE_WEBHOOK_SECRET"] = "whsec_test_357network";
    const body = JSON.stringify({ id: "evt_1" });
    const timestamp = Math.floor(Date.now() / 1000);

    await expect(verifyStripeWebhook(body, `t=${timestamp},v1=deadbeef`)).rejects.toThrow("Invalid Stripe webhook signature");
  });

  it("rejects stale webhook timestamps", async () => {
    const secret = "whsec_test_357network";
    process.env["STRIPE_WEBHOOK_SECRET"] = secret;
    const body = JSON.stringify({ id: "evt_1" });
    const timestamp = Math.floor(Date.now() / 1000) - 601;
    const signature = await sign(secret, timestamp, body);

    await expect(verifyStripeWebhook(body, `t=${timestamp},v1=${signature}`)).rejects.toThrow("timestamp outside tolerance");
  });

  it("normalizes a supported Stripe subscription into server state", () => {
    expect(subscriptionSnapshot({
      id: "sub_123",
      customer: "cus_123",
      status: "trialing",
      trial_end: 1_800_000_000,
      current_period_end: 1_800_100_000,
      cancel_at_period_end: false,
      metadata: { user_id: "user-123", plan: "auto" },
    })).toMatchObject({
      userId: "user-123",
      plan: "auto",
      customerId: "cus_123",
      subscriptionId: "sub_123",
      status: "trialing",
      cancelAtPeriodEnd: false,
    });
  });

  it("ignores subscriptions without valid user and plan metadata", () => {
    expect(subscriptionSnapshot({ id: "sub_1", metadata: { user_id: "u", plan: "invalid" } })).toBeNull();
    expect(subscriptionSnapshot({ id: "sub_1", metadata: { plan: "pro" } })).toBeNull();
  });
});
