import api from './axios'

/**
 * Retrieve or initialize the plan and confidence rating for a session.
 * @param {string} requestId
 * @returns {Promise<Object>} session plan
 */
export const fetchSessionPlan = async (requestId) => {
  const response = await api.get(`/requests/${requestId}/plan`)
  return response.data.data
}

/**
 * Update session objectives, difficult concepts, agenda items, and tasks.
 * @param {string} requestId
 * @param {Object} data - { objectives, difficult_concepts, agenda_items, follow_up_tasks }
 * @returns {Promise<Object>} updated plan
 */
export const updateSessionPlan = async (requestId, data) => {
  const response = await api.put(`/requests/${requestId}/plan`, data)
  return response.data.data
}

/**
 * Record student's pre- or post-session confidence score (1-5).
 * @param {string} requestId
 * @param {Object} data - { pre_confidence, post_confidence, confidence_notes }
 * @returns {Promise<Object>} updated plan
 */
export const recordSessionConfidence = async (requestId, data) => {
  const response = await api.post(`/requests/${requestId}/confidence`, data)
  return response.data.data
}

/**
 * Fetch student's cumulative confidence trends across completed sessions.
 * @returns {Promise<Array>} confidence trends
 */
export const fetchConfidenceTrends = async () => {
  const response = await api.get('/confidence/my-trends')
  return response.data.data
}
