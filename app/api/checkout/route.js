// API Route: POST /api/checkout
// Handles creation of Stripe checkout sessions for 357NETWORK products
// Phase 1: Test configuration with placeholder credentials

import { NextResponse } from 'next/server';
import { getStripeInstance, isStripeConfigured, getProductConfig } from '@/lib/stripeConfig';

/**
 * POST /api/checkout
 * Creates a Stripe checkout session
 * 
 * Request body:
 * {
 *   productType: "job-listing" | "featured-job" | "advertising",
 *   userId: string,
 *   jobId?: string (for job-listing and featured-job),
 *   advertisingOrderId?: string (for advertising)
 * }
 * 
 * Response:
 * Success: { sessionId: string, sessionUrl: string }
 * Error: { error: string }
 */
export async function POST(request) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      return NextResponse.json(
        { error: 'Stripe configuration is incomplete' },
        { status: 503 }
      );
    }

    // Parse request body
    const { productType, userId, jobId, advertisingOrderId } = await request.json();

    // Validate inputs
    if (!productType || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: productType and userId' },
        { status: 400 }
      );
    }

    // Validate productType
    const validProductTypes = ['job-listing', 'featured-job', 'advertising'];
    if (!validProductTypes.includes(productType)) {
      return NextResponse.json(
        { error: 'Invalid productType. Must be: job-listing, featured-job, or advertising' },
        { status: 400 }
      );
    }

    // Validate job-listing and featured-job require jobId
    if ((productType === 'job-listing' || productType === 'featured-job') && !jobId) {
      return NextResponse.json(
        { error: 'jobId is required for job listings' },
        { status: 400 }
      );
    }

    // Get product configuration
    const productConfig = getProductConfig(productType);
    if (!productConfig) {
      return NextResponse.json(
        { error: 'Product configuration not found' },
        { status: 400 }
      );
    }

    // Get Stripe instance
    const stripe = getStripeInstance();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe initialization failed' },
        { status: 503 }
      );
    }

    // Prepare checkout session parameters
    const sessionParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: undefined, // Phase 2: Add user email lookup
      client_reference_id: productType === 'advertising' ? advertisingOrderId : jobId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/cancel`,
      line_items: [
        {
          price_data: {
            currency: productConfig.currency,
            product_data: {
              name: productConfig.name,
              description: productConfig.description,
              // Phase 2: Add product metadata
              // metadata: {
              //   userId,
              //   jobId: jobId || null,
              //   advertisingOrderId: advertisingOrderId || null
              // }
            },
            unit_amount: productConfig.amount
          },
          quantity: 1
        }
      ],
      // Phase 2: Add metadata for order tracking and fulfillment
      // metadata: {
      //   userId,
      //   productType,
      //   jobId: jobId || null,
      //   advertisingOrderId: advertisingOrderId || null
      // }
    };

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Return session information to client
    // The sessionId is safe to expose; STRIPE_SECRET_KEY is never exposed
    return NextResponse.json(
      {
        sessionId: session.id,
        sessionUrl: session.url
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Checkout session creation error:', error);

    // Return error without exposing sensitive details
    const errorMessage = error.message || 'Failed to create checkout session';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
