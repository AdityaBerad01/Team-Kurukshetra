import api from './axios'

/**
 * Fetch authenticated user's portfolio with platform-verified achievements.
 * @returns {Promise<Object>} portfolio
 */
export const fetchMyPortfolio = async () => {
  const response = await api.get('/portfolio/me')
  return response.data.data
}

/**
 * Update authenticated user's projects, skills, headline, and visibility.
 * @param {Object} data - { headline, bio_summary, skills, projects, is_public }
 * @returns {Promise<Object>} updated portfolio
 */
export const updateMyPortfolio = async (data) => {
  const response = await api.put('/portfolio/me', data)
  return response.data.data
}

/**
 * View a scholar's public portfolio.
 * @param {string} userId
 * @returns {Promise<Object>} public portfolio
 */
export const fetchPublicPortfolio = async (userId) => {
  const response = await api.get(`/portfolio/${userId}`)
  return response.data.data
}
