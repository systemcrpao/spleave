/**
 * api.js — Generic utility for calling Google Apps Script (GAS) Web App endpoints.
 *
 * GAS endpoints accept both GET (with query params) and POST (with JSON body).
 * All responses follow the envelope:  { status: 'success'|'error', data: any, message: string }
 *
 * Usage:
 *   import { gasGet, gasPost } from '@/utils/api'
 *
 *   const data  = await gasGet('getLeaveQuota', { uid: 'U123' })
 *   const saved = await gasPost('submitLeaveRequest', { uid, type, dates, reason })
 */

// ---------------------------------------------------------------------------
// Configuration — replace GAS_URL with your deployed GAS Web App URL
// ---------------------------------------------------------------------------
export const GAS_URL = import.meta.env.VITE_GAS_URL || ''

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Parse the GAS response envelope and throw on error status */
async function parseResponse(res) {
  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status} ${res.statusText}`)
  }
  const json = await res.json()
  if (json.status === 'error') {
    throw new Error(json.message || 'GAS returned an error')
  }
  return json.data ?? json
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sends a GET request to GAS with `action` and optional `params`.
 * @param {string} action   - The GAS handler action name
 * @param {Record<string,string|number>} [params] - Additional query parameters
 * @returns {Promise<any>}
 */
export async function gasGet(action, params = {}) {
  const url = new URL(GAS_URL)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  return parseResponse(res)
}

/**
 * Sends a POST request to GAS with `action` in query and `payload` as JSON body.
 * @param {string} action   - The GAS handler action name
 * @param {Record<string,any>} [payload] - JSON body payload
 * @returns {Promise<any>}
 */
export async function gasPost(action, payload = {}) {
  const url = new URL(GAS_URL)
  url.searchParams.set('action', action)

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return parseResponse(res)
}

// ---------------------------------------------------------------------------
// Domain-specific wrappers (keeps page components clean)
// ---------------------------------------------------------------------------

/** Fetch user profile by LINE UID */
export const fetchUserProfile = (uid) => gasGet('getUserProfile', { uid })

/** Fetch leave quotas for a user in the current fiscal year */
export const fetchLeaveQuota = (uid) => gasGet('getLeaveQuota', { uid })

/** Fetch leave history for a user, optionally filtered by year */
export const fetchLeaveHistory = (uid, fiscalYear) =>
  gasGet('getLeaveHistory', { uid, fiscalYear })

/** Submit a new leave request */
export const submitLeaveRequest = (payload) => gasPost('submitLeaveRequest', payload)

/** Fetch pending registration requests (Officer) */
export const fetchPendingRegistrations = () => gasGet('getPendingRegistrations')

/** Approve/reject a user registration (Officer) */
export const processRegistration = (payload) => gasPost('processRegistration', payload)

/** Fetch leave requests pending verification (Officer) */
export const fetchPendingVerifications = () => gasGet('getPendingVerifications')

/** Pre-approve / reject a leave request (Officer) */
export const verifyLeaveRequest = (payload) => gasPost('verifyLeaveRequest', payload)

/** Fetch organization-wide leave statistics report (Officer) */
export const fetchOrgReport = (fiscalYear) => gasGet('getOrgReport', { fiscalYear })

/** Fetch executive summary: who is absent today (Executive) */
export const fetchExecDashboard = () => gasGet('getExecDashboard')

/** Fetch leave requests pending final approval (Executive) */
export const fetchPendingApprovals = () => gasGet('getPendingApprovals')

/** Final approve / reject a leave request (Executive) */
export const approveLeaveRequest = (payload) => gasPost('approveLeaveRequest', payload)
