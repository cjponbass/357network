// Job Posting Service Layer
//
// Handles all job posting operations including validation, submission, and storage.
// Integrates with Supabase for data persistence.
//
// PLACEHOLDER: Currently structured for integration but without live Supabase connection.
// Phase 2 will connect these functions to the actual Supabase backend.

import { supabase } from './supabase'

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates US state abbreviation
 * @param {string} state - State code to validate
 * @returns {boolean} True if valid US state abbreviation
 */
function isValidState(state) {
  const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ]
  return validStates.includes(state.toUpperCase())
}

/**
 * Validates compensation range format
 * @param {string} compensationRange - Compensation range to validate
 * @returns {boolean} True if valid format (e.g., "$50,000 - $75,000" or "50000-75000")
 */
function isValidCompensationRange(compensationRange) {
  // Allow flexible formats: "$50,000 - $75,000" or "50000-75000" or similar
  const compensationRegex = /^\$?[\d,]+\s*-\s*\$?[\d,]+$/
  return compensationRegex.test(compensationRange)
}

/**
 * Validates job posting data
 * @param {object} jobData - Job posting data to validate
 * @returns {object} { isValid: boolean, errors: array of error messages }
 */
function validateJobData(jobData) {
  const errors = []

  // Required fields validation
  if (!jobData.title || typeof jobData.title !== 'string' || jobData.title.trim().length < 3) {
    errors.push('jobPosting.error_title_required')
  }

  if (!jobData.company_name || typeof jobData.company_name !== 'string' || jobData.company_name.trim().length === 0) {
    errors.push('jobPosting.error_company_required')
  }

  if (!jobData.category || typeof jobData.category !== 'string' || jobData.category.trim().length === 0) {
    errors.push('jobPosting.error_category_required')
  }

  if (!jobData.city || typeof jobData.city !== 'string' || jobData.city.trim().length === 0) {
    errors.push('jobPosting.error_city_required')
  }

  if (!jobData.state || typeof jobData.state !== 'string') {
    errors.push('jobPosting.error_state_required')
  } else if (!isValidState(jobData.state)) {
    errors.push('jobPosting.error_state_invalid')
  }

  if (!jobData.description || typeof jobData.description !== 'string' || jobData.description.trim().length < 20) {
    errors.push('jobPosting.error_description_required')
  }

  if (!jobData.contact_email || typeof jobData.contact_email !== 'string') {
    errors.push('jobPosting.error_email_required')
  } else if (!isValidEmail(jobData.contact_email)) {
    errors.push('jobPosting.error_email_invalid')
  }

  if (jobData.mason_attestation !== true) {
    errors.push('jobPosting.error_mason_attestation_required')
  }

  // Optional field validation (only validate if provided)
  if (jobData.compensation_range && jobData.compensation_range.trim().length > 0) {
    if (!isValidCompensationRange(jobData.compensation_range)) {
      errors.push('jobPosting.error_compensation_format')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * submitJobPosting - Submit a new job posting
 *
 * @param {object} jobData - Job posting data object
 * @param {string} jobData.title - Job title (required, min 3 chars)
 * @param {string} jobData.company_name - Company name (required)
 * @param {string} jobData.category - Job category (required)
 * @param {string} jobData.city - City (required)
 * @param {string} jobData.state - State abbreviation (required, valid US state)
 * @param {boolean} jobData.remote - Remote position flag (default: false)
 * @param {boolean} jobData.traveling_man - Traveling Man eligible flag (default: false)
 * @param {string} jobData.description - Job description (required, min 20 chars)
 * @param {string} jobData.requirements - Job requirements (optional)
 * @param {string} jobData.compensation_range - Compensation range (optional, valid format)
 * @param {string} jobData.contact_email - Contact email (required, valid format)
 * @param {boolean} jobData.mason_friendly - Mason-friendly flag (from checkbox)
 * @param {boolean} jobData.mason_attestation - Mason attestation (required, must be true)
 * @param {string} userId - ID of user posting the job (required)
 * @returns {Promise<{success, jobId, error}>} Result object with success status and jobId or error message
 *
 * Process:
 * 1. Validates all job posting data
 * 2. Sets defaults for approved, paid_status, and featured flags
 * 3. Sets posted_by and posted_at timestamps
 * 4. Checks if Supabase environment is configured
 * 5. If configured: Prepares insert statement (Phase 2 will execute)
 * 6. If not configured: Returns success with placeholder ID
 * 7. Returns success with jobId on success, or error message on failure
 */
export async function submitJobPosting(jobData, userId) {
  try {
    // Validate input parameters
    if (!jobData) {
      return {
        success: false,
        jobId: null,
        error: 'jobPosting.error_job_data_required'
      }
    }

    if (!userId) {
      return {
        success: false,
        jobId: null,
        error: 'jobPosting.error_user_id_required'
      }
    }

    // Validate job data
    const validation = validateJobData(jobData)
    if (!validation.isValid) {
      return {
        success: false,
        jobId: null,
        error: validation.errors.join('; '),
        errorKeys: validation.errors
      }
    }

    // Prepare job posting object with defaults
    const jobPosting = {
      title: jobData.title.trim(),
      company_name: jobData.company_name.trim(),
      category: jobData.category.trim(),
      city: jobData.city.trim(),
      state: jobData.state.toUpperCase(),
      remote: Boolean(jobData.remote) || false,
      traveling_man: Boolean(jobData.traveling_man) || false,
      description: jobData.description.trim(),
      requirements: jobData.requirements ? jobData.requirements.trim() : null,
      compensation_range: jobData.compensation_range ? jobData.compensation_range.trim() : null,
      contact_email: jobData.contact_email.trim(),
      mason_friendly: Boolean(jobData.mason_friendly) || false,
      mason_attestation: Boolean(jobData.mason_attestation),
      // Default values for Phase 1
      approved: false,
      paid_status: 'unpaid',
      featured: false,
      posted_by: userId,
      posted_at: new Date().toISOString()
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (supabaseUrl) {
      // Supabase is configured - prepare for insert
      console.log('Supabase environment detected. Job posting ready for database insertion.')

      // TODO Phase 2: Execute the Supabase insert
      // Replace placeholder with actual insert:
      // const { data: insertedJob, error: insertError } = await supabase
      //   .from('job_postings')
      //   .insert([jobPosting])
      //   .select('id')
      //   .single()
      //
      // if (insertError) {
      //   return {
      //     success: false,
      //     jobId: null,
      //     error: `Failed to post job: ${insertError.message}`
      //   }
      // }
      //
      // return {
      //   success: true,
      //   jobId: insertedJob.id,
      //   error: null
      // }

      // Phase 1: Generate placeholder ID
      const placeholderId = 'job-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)

      return {
        success: true,
        jobId: placeholderId,
        error: null
      }
    } else {
      // Supabase not configured - return success with placeholder
      const placeholderId = 'job-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)

      console.log('Job posting created (Phase 1 placeholder)')

      return {
        success: true,
        jobId: placeholderId,
        error: null
      }
    }
  } catch (error) {
    console.error('Job posting error:', error)
    return {
      success: false,
      jobId: null,
      error: 'jobPosting.error_unexpected'
    }
  }
}

export default {
  submitJobPosting,
  validateJobData
}
