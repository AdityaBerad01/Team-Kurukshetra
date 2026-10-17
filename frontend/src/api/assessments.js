import api from './axios'

/**
 * Fetch assessments assigned to or authored by the user.
 * @returns {Promise<Array>}
 */
export const fetchMyAssessments = async () => {
  const response = await api.get('/assessments/my')
  return response.data.data
}

/**
 * Fetch learning progress metrics, topic proficiencies, and milestones.
 * @returns {Promise<Object>}
 */
export const fetchProgressSummary = async () => {
  const response = await api.get('/assessments/progress')
  return response.data.data
}

/**
 * Create a new assessment (tutor only).
 * @param {Object} data - { title, subject, student_id, assessment_type, questions, session_id }
 * @returns {Promise<Object>}
 */
export const createAssessment = async (data) => {
  const response = await api.post('/assessments', data)
  return response.data.data
}

/**
 * Submit answers for an assigned assessment (student).
 * @param {string} id - assessment ID
 * @param {Object} answers - { q_id: optionIndex }
 * @returns {Promise<Object>}
 */
export const submitAssessment = async (id, answers) => {
  const response = await api.post(`/assessments/${id}/submit`, { answers })
  return response.data.data
}
