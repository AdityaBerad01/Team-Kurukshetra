import api from './axios'

/**
 * Register a new user (STUDENT or TUTOR).
 * @param {Object} payload - { name, email, password, role, university, subjects, bio }
 * @returns {Promise<Object>} Safe user profile with access_token
 */
export const registerUser = async (payload) => {
  const response = await api.post('/auth/register', payload)
  return response.data?.data
}

/**
 * Log in an existing user with email and password.
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} { user, access_token }
 */
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials)
  return response.data?.data
}

/**
 * Fetch the authenticated user's profile using the current JWT.
 * @returns {Promise<Object>} Safe user profile
 */
export const fetchCurrentUser = async () => {
  const response = await api.get('/auth/me')
  return response.data?.data
}

/**
 * Update authenticated user's profile details.
 * @param {Object} data - { name, university, campus, languages, bio, learning_goals, skill_level }
 * @returns {Promise<Object>} Updated user profile
 */
export const updateCurrentUser = async (data) => {
  const response = await api.put('/auth/me', data)
  return response.data?.data
}

