import api from './axios'

/**
 * Fetch tutors with optional search and filters.
 * @param {Object} params - { q, subject, mode, date, page, per_page }
 * @returns {Promise<Object>} { tutors, total, page, per_page, total_pages }
 */
export const fetchTutors = async (params = {}) => {
  const queryParams = new URLSearchParams()
  if (params.q) queryParams.append('q', params.q)
  if (params.subject) queryParams.append('subject', params.subject)
  if (params.mode) queryParams.append('mode', params.mode)
  if (params.date) queryParams.append('date', params.date)
  if (params.page) queryParams.append('page', params.page)
  if (params.per_page) queryParams.append('per_page', params.per_page)

  const url = `/tutors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  const response = await api.get(url)
  return response.data.data
}

/**
 * Fetch a single tutor's details by ID.
 * @param {string} id
 * @returns {Promise<Object>} tutor details
 */
export const fetchTutorById = async (id) => {
  const response = await api.get(`/tutors/${id}`)
  return response.data.data
}

/**
 * Fetch the authenticated tutor's own profile.
 * @returns {Promise<Object>} tutor profile
 */
export const fetchMyTutorProfile = async () => {
  const response = await api.get('/tutors/profile/me')
  return response.data.data
}

/**
 * Create a new tutor profile for the authenticated tutor.
 * @param {Object} data - { subjects, introduction, department, year_of_study, teaching_modes, hourly_rate, availability }
 * @returns {Promise<Object>} created profile
 */
export const createTutorProfile = async (data) => {
  const response = await api.post('/tutors/profile', data)
  return response.data.data
}

/**
 * Update the authenticated tutor's existing profile.
 * @param {Object} data - { subjects, introduction, department, year_of_study, teaching_modes, hourly_rate, availability }
 * @returns {Promise<Object>} updated profile
 */
export const updateTutorProfile = async (data) => {
  const response = await api.put('/tutors/profile/me', data)
  return response.data.data
}
