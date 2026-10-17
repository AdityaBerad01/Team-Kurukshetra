import api from './axios'

/**
 * Fetch aggregated campus skill demand vs tutor supply data.
 * @param {string} campus - optional campus filter
 * @returns {Promise<Object>} campus skill analytics
 */
export const fetchCampusSkillMap = async (campus = '') => {
  const url = campus ? `/campus-skill-map?campus=${encodeURIComponent(campus)}` : '/campus-skill-map'
  const response = await api.get(url)
  return response.data.data
}
