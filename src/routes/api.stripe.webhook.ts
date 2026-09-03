import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        try {
          const { verifyStripeWebhook, subscriptionSnapshot } = await import("@/lib/billing/stripe.server");
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const event = await verifyStripeWebhook(rawBody, request.headers.get("stripe-signature"));
          const eventId = typeof event.id === "string" ? event.id : null;
          if (!eventId) return Response.json({ error: "Invalid event." }, { status: 400 });

          const { data: already } = await supabaseAdmin.from("stripe_webhook_events").select("event_id").eq("event_id", eventId).maybeSingle();
          if (already) return Response.json({ received: true, duplicate: true });

          const type = typeof event.type === "string" ? event.type : "";
          if (type.startsWith("customer.subscription.")) {
            const object = event?.data?.object as Record<string, any>;
            const snapshot = subscriptionSnapshot(object);
            if (snapshot) {
              const { error } = await supabaseAdmin.from("subscriptions").upsert({
                user_id: snapshot.userId,
                stripe_customer_id: snapshot.customerId,
                stripe_subscription_id: snapshot.subscriptionId,
                plan: snapshot.plan,
                status: snapshot.status,
                trial_ends_at: snapshot.trialEndsAt,
                current_period_end: snapshot.currentPeriodEnd,
                cancel_at_period_end: snapshot.cancelAtPeriodEnd,
                updated_at: new Date().toISOString(),
              }, { onConflict: "user_id" });
              if (error) throw new Error(error.message);
            }
          }

          const { error: logError } = await supabaseAdmin.from("stripe_webhook_events").insert({ event_id: eventId, event_type: type });
          if (logError && !String(logError.message).toLowerCase().includes("duplicate")) throw new Error(logError.message);
          return Response.json({ received: true });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Webhook processing failed." }, { status: 400 });
        }
      },
    },
  },
});
