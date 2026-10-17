import api from './axios'

/**
 * Health-check API call – hits GET /api/health
 * @returns {Promise<Object>} health payload
 */
export const fetchHealth = () => api.get('/health').then((res) => res.data)
