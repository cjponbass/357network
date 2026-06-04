// Admin Service Layer
//
// Handles all admin-related operations including job approvals, advertising order approvals,
// and other administrative functions.
//
// PLACEHOLDER: Currently structured for integration with mock data fallback.
// Phase 2 will connect these functions to the actual Supabase backend.

import { supabase } from './supabase'

/**
 * Generates mock pending jobs data
 * Used when Supabase is not configured
 * @returns {array} Array of mock pending job objects
 */
function generateMockPendingJobs() {
  return [
    {
      id: 'job-mock-001',
      title: 'Senior Software Engineer',
      company_name: 'TechCorp Solutions',
      category: 'Technology',
      city: 'San Francisco',
      state: 'CA',
      posted_by: 'john.employer@example.com',
      posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING APPROVAL'
    },
    {
      id: 'job-mock-002',
      title: 'Project Manager',
      company_name: 'BuildCo Construction',
      category: 'Construction',
      city: 'Denver',
      state: 'CO',
      posted_by: 'bob.manager@example.com',
      posted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING APPROVAL'
    },
    {
      id: 'job-mock-003',
      title: 'Electrician',
      company_name: 'ElectroServe LLC',
      category: 'Trades',
      city: 'Austin',
      state: 'TX',
      posted_by: 'sarah.trade@example.com',
      posted_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING APPROVAL'
    }
  ]
}

/**
 * Generates mock pending advertising orders data
 * Used when Supabase is not configured
 * @returns {array} Array of mock pending advertising order objects
 */
function generateMockPendingAdvertisingOrders() {
  return [
    {
      id: 'order-mock-001',
      order_type: 'standard',
      created_by: 'advertiser1@example.com',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      price: 99.99,
      status: 'PENDING APPROVAL'
    },
    {
      id: 'order-mock-002',
      order_type: 'featured',
      created_by: 'advertiser2@example.com',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      price: 299.99,
      status: 'PENDING APPROVAL'
    },
    {
      id: 'order-mock-003',
      order_type: 'placement',
      created_by: 'advertiser3@example.com',
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      price: 599.99,
      status: 'PENDING APPROVAL'
    }
  ]
}

/**
 * getPendingJobs - Retrieve pending job postings requiring admin approval
 *
 * @param {number} limit - Maximum number of jobs to return (default: 10)
 * @returns {Promise<{jobs, error}>} Returns { jobs: [...], error: null } on success,
 *          or { jobs: [], error: "message" } on failure
 *
 * Process:
 * 1. Checks if Supabase is configured via NEXT_PUBLIC_SUPABASE_URL env var
 * 2. If configured: Prepares query for pending jobs (approved = false), sorted by posted_at DESC
 * 3. If not configured: Returns mock pending jobs
 * 4. Returns array of pending job objects with metadata
 */
export async function getPendingJobs(limit = 10) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (supabaseUrl) {
      // Supabase is configured - prepare for query
      console.log('Supabase environment detected. Pending jobs ready for database query.')

      // TODO Phase 2: Execute the Supabase query
      // Replace placeholder with actual query:
      // const { data: jobs, error: queryError } = await supabase
      //   .from('job_postings')
      //   .select('id, title, company_name, category, city, state, posted_by, posted_at')
      //   .eq('approved', false)
      //   .order('posted_at', { ascending: false })
      //   .limit(limit)
      //
      // if (queryError) {
      //   return {
      //     jobs: [],
      //     error: `Failed to fetch pending jobs: ${queryError.message}`
      //   }
      // }
      //
      // return {
      //   jobs: jobs || [],
      //   error: null
      // }

      // Phase 1: Return mock data
      return {
        jobs: generateMockPendingJobs().slice(0, limit),
        error: null
      }
    } else {
      // Supabase not configured - return mock data
      console.log('Pending jobs (Phase 1 placeholder)')

      return {
        jobs: generateMockPendingJobs().slice(0, limit),
        error: null
      }
    }
  } catch (error) {
    console.error('Get pending jobs error:', error)
    return {
      jobs: [],
      error: 'admin.error_unexpected_pending_jobs'
    }
  }
}

/**
 * approveJob - Approve a pending job posting
 *
 * @param {string} jobId - The ID of the job to approve
 * @returns {Promise<{success, error}>} Returns { success: true } on success,
 *          or { success: false, error: "message" } on failure
 *
 * Process:
 * 1. Validates jobId is provided
 * 2. Checks if Supabase is configured
 * 3. If configured: Prepares update to set approved = true and approved_at = current timestamp
 * 4. If not configured: Logs placeholder message
 * 5. Returns success status
 */
export async function approveJob(jobId) {
  try {
    // Input validation
    if (!jobId) {
      return {
        success: false,
        error: 'admin.error_job_id_required'
      }
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (supabaseUrl) {
      // Supabase is configured - prepare for update
      console.log('Supabase environment detected. Job approval ready for database update.')

      // TODO Phase 2: Execute the Supabase update
      // Replace placeholder with actual update:
      // const { error: updateError } = await supabase
      //   .from('job_postings')
      //   .update({
      //     approved: true,
      //     approved_at: new Date().toISOString()
      //   })
      //   .eq('id', jobId)
      //
      // if (updateError) {
      //   return {
      //     success: false,
      //     error: `Failed to approve job: ${updateError.message}`
      //   }
      // }

      return {
        success: true
      }
    } else {
      // Supabase not configured - log placeholder
      console.log('Job approval (Phase 1 placeholder)')

      return {
        success: true
      }
    }
  } catch (error) {
    console.error('Approve job error:', error)
    return {
      success: false,
      error: 'admin.error_unexpected_approve_job'
    }
  }
}

/**
 * markJobFeatured - Mark a job posting as featured or remove featured status
 *
 * @param {string} jobId - The ID of the job to update
 * @param {boolean} featured - Whether to mark as featured (default: true)
 * @returns {Promise<{success, error}>} Returns { success: true } on success,
 *          or { success: false, error: "message" } on failure
 *
 * Process:
 * 1. Validates jobId is provided
 * 2. Checks if Supabase is configured
 * 3. If configured: Prepares update to set featured flag
 * 4. If not configured: Logs placeholder message
 * 5. Returns success status
 */
export async function markJobFeatured(jobId, featured = true) {
  try {
    // Input validation
    if (!jobId) {
      return {
        success: false,
        error: 'admin.error_job_id_required'
      }
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (supabaseUrl) {
      // Supabase is configured - prepare for update
      console.log('Supabase environment detected. Featured status update ready for database.')

      // TODO Phase 2: Execute the Supabase update
      // Replace placeholder with actual update:
      // const { error: updateError } = await supabase
      //   .from('job_postings')
      //   .update({
      //     featured: featured
      //   })
      //   .eq('id', jobId)
      //
      // if (updateError) {
      //   return {
      //     success: false,
      //     error: `Failed to update featured status: ${updateError.message}`
      //   }
      // }

      return {
        success: true
      }
    } else {
      // Supabase not configured - log placeholder
      console.log('Mark job featured (Phase 1 placeholder)')

      return {
        success: true
      }
    }
  } catch (error) {
    console.error('Mark job featured error:', error)
    return {
      success: false,
      error: 'admin.error_unexpected_featured_status'
    }
  }
}

/**
 * getPendingAdvertisingOrders - Retrieve pending advertising orders requiring admin approval
 *
 * @param {number} limit - Maximum number of orders to return (default: 10)
 * @returns {Promise<{orders, error}>} Returns { orders: [...], error: null } on success,
 *          or { orders: [], error: "message" } on failure
 *
 * Process:
 * 1. Checks if Supabase is configured via NEXT_PUBLIC_SUPABASE_URL env var
 * 2. If configured: Prepares query for pending orders (approved = false), sorted by created_at DESC
 * 3. If not configured: Returns mock pending orders
 * 4. Returns array of pending order objects with metadata
 */
export async function getPendingAdvertisingOrders(limit = 10) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (supabaseUrl) {
      // Supabase is configured - prepare for query
      console.log('Supabase environment detected. Pending advertising orders ready for database query.')

      // TODO Phase 2: Execute the Supabase query
      // Replace placeholder with actual query:
      // const { data: orders, error: queryError } = await supabase
      //   .from('advertising_orders')
      //   .select('id, order_type, created_by, created_at, price')
      //   .eq('approved', false)
      //   .order('created_at', { ascending: false })
      //   .limit(limit)
      //
      // if (queryError) {
      //   return {
      //     orders: [],
      //     error: `Failed to fetch pending advertising orders: ${queryError.message}`
      //   }
      // }
      //
      // return {
      //   orders: orders || [],
      //   error: null
      // }

      // Phase 1: Return mock data
      return {
        orders: generateMockPendingAdvertisingOrders().slice(0, limit),
        error: null
      }
    } else {
      // Supabase not configured - return mock data
      console.log('Pending advertising orders (Phase 1 placeholder)')

      return {
        orders: generateMockPendingAdvertisingOrders().slice(0, limit),
        error: null
      }
    }
  } catch (error) {
    console.error('Get pending advertising orders error:', error)
    return {
      orders: [],
      error: 'admin.error_unexpected_pending_orders'
    }
  }
}

/**
 * approveAdvertisingOrder - Approve a pending advertising order
 *
 * @param {string} orderId - The ID of the order to approve
 * @returns {Promise<{success, error}>} Returns { success: true } on success,
 *          or { success: false, error: "message" } on failure
 *
 * Process:
 * 1. Validates orderId is provided
 * 2. Checks if Supabase is configured
 * 3. If configured: Prepares update to set approved = true and approved_at = current timestamp
 * 4. If not configured: Logs placeholder message
 * 5. Returns success status
 */
export async function approveAdvertisingOrder(orderId) {
  try {
    // Input validation
    if (!orderId) {
      return {
        success: false,
        error: 'admin.error_order_id_required'
      }
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (supabaseUrl) {
      // Supabase is configured - prepare for update
      console.log('Supabase environment detected. Advertising order approval ready for database update.')

      // TODO Phase 2: Execute the Supabase update
      // Replace placeholder with actual update:
      // const { error: updateError } = await supabase
      //   .from('advertising_orders')
      //   .update({
      //     approved: true,
      //     approved_at: new Date().toISOString()
      //   })
      //   .eq('id', orderId)
      //
      // if (updateError) {
      //   return {
      //     success: false,
      //     error: `Failed to approve advertising order: ${updateError.message}`
      //   }
      // }

      return {
        success: true
      }
    } else {
      // Supabase not configured - log placeholder
      console.log('Advertising approval (Phase 1 placeholder)')

      return {
        success: true
      }
    }
  } catch (error) {
    console.error('Approve advertising order error:', error)
    return {
      success: false,
      error: 'admin.error_unexpected_approve_order'
    }
  }
}

export default {
  getPendingJobs,
  approveJob,
  markJobFeatured,
  getPendingAdvertisingOrders,
  approveAdvertisingOrder
}
