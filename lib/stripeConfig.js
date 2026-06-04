// Stripe Server-Side Configuration
// This file initializes the Stripe instance for server-side operations only
// DO NOT expose the Stripe secret key to the client

const Stripe = require('stripe');

// Phase 1: Test Configuration
// Using environment variable STRIPE_SECRET_KEY
// In Phase 2, this will be replaced with live Stripe credentials and product IDs

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripeInstance = null;
let isConfigured = false;

// Initialize Stripe if credentials are available
if (stripeSecretKey) {
  try {
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' // Use a stable API version
    });
    isConfigured = true;
  } catch (error) {
    console.error('Failed to initialize Stripe:', error.message);
    isConfigured = false;
  }
} else {
  console.warn(
    'STRIPE_SECRET_KEY environment variable is not set. ' +
    'Stripe payments are not configured. ' +
    'Phase 2 will add live Stripe configuration.'
  );
}

/**
 * Get the initialized Stripe instance
 * Returns null if Stripe is not configured
 */
function getStripeInstance() {
  return stripeInstance;
}

/**
 * Check if Stripe is properly configured
 * @returns {boolean} True if Stripe is ready to use
 */
function isStripeConfigured() {
  return isConfigured && stripeInstance !== null;
}

/**
 * Stripe Product Pricing Configuration
 * Phase 1: Test prices
 * Phase 2: Will use live Stripe product IDs instead of hardcoded prices
 */
const stripeProducts = {
  'job-listing': {
    name: 'Standard Job Listing',
    description: 'Post a job for 30 days with standard visibility',
    amount: 2900, // $29.00 in cents
    currency: 'usd',
    duration: '30 days',
    // Phase 2: Add live product ID
    // productId: 'prod_xxxxxxxxxxxxx'
  },
  'featured-job': {
    name: 'Featured Job Listing',
    description: 'Featured placement for 30 days with premium visibility',
    amount: 7900, // $79.00 in cents
    currency: 'usd',
    duration: '30 days',
    // Phase 2: Add live product ID
    // productId: 'prod_xxxxxxxxxxxxx'
  },
  'advertising': {
    name: 'Advertising Placement',
    description: 'Advertising placement on 357NETWORK',
    amount: 19900, // $199.00 in cents
    currency: 'usd',
    duration: 'Variable',
    // Phase 2: Add live product ID
    // productId: 'prod_xxxxxxxxxxxxx'
  }
};

/**
 * Get product configuration by type
 * @param {string} productType - Type of product (job-listing, featured-job, advertising)
 * @returns {object|null} Product configuration or null if not found
 */
function getProductConfig(productType) {
  return stripeProducts[productType] || null;
}

module.exports = {
  getStripeInstance,
  isStripeConfigured,
  getProductConfig,
  stripeProducts
};
