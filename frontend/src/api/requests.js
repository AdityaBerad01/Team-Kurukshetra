import api from './axios'

/**
 * Submit a new tutoring session request.
 * @param {Object} data - { slot_id, subject, message }
 * @returns {Promise<Object>} created session request
 */
export const createSessionRequest = async (data) => {
  const response = await api.post('/requests', data)
  return response.data.data
}

/**
 * Retrieve session requests submitted by the authenticated student.
 * @returns {Promise<Array>} list of student requests
 */
export const fetchMyRequests = async () => {
  const response = await api.get('/requests/my')
  return response.data.data
}

/**
 * Retrieve incoming session requests for the authenticated tutor.
 * @returns {Promise<Array>} list of incoming requests
 */
export const fetchIncomingRequests = async () => {
  const response = await api.get('/requests/incoming')
  return response.data.data
}

/**
 * Tutor accepts a pending request.
 * @param {string} requestId
 * @returns {Promise<Object>} accepted request
 */
export const acceptRequest = async (requestId) => {
  const response = await api.patch(`/requests/${requestId}/accept`)
  return response.data.data
}

/**
 * Tutor declines a pending request.
 * @param {string} requestId
 * @returns {Promise<Object>} declined request
 */
export const declineRequest = async (requestId) => {
  const response = await api.patch(`/requests/${requestId}/decline`)
  return response.data.data
}

/**
 * Student cancels their own request.
 * @param {string} requestId
 * @returns {Promise<Object>} cancelled request
 */
export const cancelRequest = async (requestId) => {
  const response = await api.patch(`/requests/${requestId}/cancel`)
  return response.data.data
}
