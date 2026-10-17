import api from './axios'

/**
 * Create a new availability slot.
 * @param {Object} data - { date, start_time, end_time, teaching_mode }
 * @returns {Promise<Object>} created slot
 */
export const createSlot = async (data) => {
  const response = await api.post('/slots', data)
  return response.data.data
}

/**
 * Fetch slots for a specific tutor.
 * @param {string} tutorId
 * @param {Object} params - { status, date }
 * @returns {Promise<Array>} list of slots
 */
export const fetchTutorSlots = async (tutorId, params = {}) => {
  const queryParams = new URLSearchParams()
  if (params.status) queryParams.append('status', params.status)
  if (params.date) queryParams.append('date', params.date)

  const url = `/slots/tutor/${tutorId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  const response = await api.get(url)
  return response.data.data
}

/**
 * Fetch available slots across all tutors.
 * @param {Object} params - { tutor_id, date, teaching_mode }
 * @returns {Promise<Array>} list of available slots
 */
export const fetchAvailableSlots = async (params = {}) => {
  const queryParams = new URLSearchParams()
  if (params.tutor_id) queryParams.append('tutor_id', params.tutor_id)
  if (params.date) queryParams.append('date', params.date)
  if (params.teaching_mode) queryParams.append('teaching_mode', params.teaching_mode)

  const url = `/slots/available${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  const response = await api.get(url)
  return response.data.data
}

/**
 * Update an availability slot.
 * @param {string} slotId
 * @param {Object} data - { date, start_time, end_time, teaching_mode, status }
 * @returns {Promise<Object>} updated slot
 */
export const updateSlot = async (slotId, data) => {
  const response = await api.put(`/slots/${slotId}`, data)
  return response.data.data
}

/**
 * Delete an availability slot.
 * @param {string} slotId
 * @returns {Promise<Object>}
 */
export const deleteSlot = async (slotId) => {
  const response = await api.delete(`/slots/${slotId}`)
  return response.data
}
