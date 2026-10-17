import api from './axios'

/**
 * Fetch student dashboard analytics and recent activity.
 * @returns {Promise<Object>} { stats, recent_activity, unreviewed_sessions }
 */
export const fetchStudentDashboard = async () => {
  const response = await api.get('/dashboard/student')
  return response.data.data
}

/**
 * Fetch tutor dashboard analytics, available slots, and recent activity.
 * @returns {Promise<Object>} { stats, recent_activity }
 */
export const fetchTutorDashboard = async () => {
  const response = await api.get('/dashboard/tutor')
  return response.data.data
}
