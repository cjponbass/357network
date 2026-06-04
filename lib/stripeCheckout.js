// Client-Side Stripe Checkout Handler
// Phase 1: Handles checkout session initiation for 357NETWORK products
// DO NOT use STRIPE_SECRET_KEY in this file - this is client-side only

import { loadStripe } from '@stripe/stripe-js';

// Cache the Stripe promise to avoid reloading
let stripePromise = null;

/**
 * Load the Stripe instance
 * @returns {Promise<object|null>} Stripe instance or null if not configured
 */
async function getStripe() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured');
    return null;
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
}

/**
 * Initiate checkout for a 357NETWORK product
 * 
 * @param {string} productType - Type of product: "job-listing", "featured-job", or "advertising"
 * @param {string} userId - ID of the user making the purchase
 * @param {string} itemId - ID of the item (jobId or advertisingOrderId)
 * @returns {Promise<object>} { success: boolean, error?: string }
 */
export async function initiateCheckout(productType, userId, itemId) {
  try {
    // Validate inputs
    if (!productType || !userId || !itemId) {
      return {
        success: false,
        error: 'stripe.error_missing_parameters'
      };
    }

    // Check if Stripe is configured
    const stripe = await getStripe();
    if (!stripe) {
      return {
        success: false,
        error: 'stripe.error_not_configured'
      };
    }

    // Determine the request body based on product type
    let requestBody = {
      productType,
      userId,
      jobId: undefined,
      advertisingOrderId: undefined
    };

    if (productType === 'job-listing' || productType === 'featured-job') {
      requestBody.jobId = itemId;
    } else if (productType === 'advertising') {
      requestBody.advertisingOrderId = itemId;
    } else {
      return {
        success: false,
        error: 'stripe.error_invalid_product_type'
      };
    }

    // Call the checkout API endpoint
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'stripe.error_create_session_failed'
      };
    }

    const { sessionId, sessionUrl } = await response.json();

    if (!sessionId) {
      return {
        success: false,
        error: 'stripe.error_no_session_id'
      };
    }

    // Redirect to Stripe Checkout using sessionUrl if available
    // Otherwise, use redirectToCheckout with sessionId
    if (sessionUrl) {
      // Redirect to Stripe Checkout using the URL
      // This is the recommended approach in newer Stripe implementations
      window.location.href = sessionUrl;
      return {
        success: true
      };
    } else {
      // Fallback: Use Stripe redirectToCheckout (older approach)
      // This requires stripe.redirectToCheckout(sessionId)
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        return {
          success: false,
          error: error.message || 'stripe.error_redirect_failed'
        };
      }

      return {
        success: true
      };
    }

  } catch (error) {
    console.error('Checkout initiation error:', error);
    return {
      success: false,
      error: 'stripe.error_unexpected'
    };
  }
}

/**
 * Check if Stripe is configured on the client
 * @returns {boolean} True if NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set
 */
export function isStripeConfigured() {
  return !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}
