import api from './axios'

/**
 * Fetch all active focus rooms.
 * @returns {Promise<Array>} active rooms
 */
export const fetchActiveFocusRooms = async () => {
  const response = await api.get('/focus/rooms')
  return response.data.data
}

/**
 * Host creates a new focus sprint room.
 * @param {Object} data - { title, subject, goal, duration_minutes }
 * @returns {Promise<Object>} created room
 */
export const createFocusRoom = async (data) => {
  const response = await api.post('/focus/rooms', data)
  return response.data.data
}

/**
 * Join an active focus room.
 * @param {string} roomId
 * @returns {Promise<Object>} room details
 */
export const joinFocusRoom = async (roomId) => {
  const response = await api.post(`/focus/rooms/${roomId}/join`)
  return response.data.data
}

/**
 * Leave an active focus room.
 * @param {string} roomId
 * @returns {Promise<Object>} room details
 */
export const leaveFocusRoom = async (roomId) => {
  const response = await api.post(`/focus/rooms/${roomId}/leave`)
  return response.data.data
}

/**
 * Complete and log an accomplished study sprint.
 * @param {Object} data - { room_id, subject, goal, duration_minutes }
 * @returns {Promise<Object>} logged sprint response
 */
export const completeFocusSprint = async (data) => {
  const response = await api.post('/focus/complete-sprint', data)
  return response.data.data
}

/**
 * Fetch user's cumulative focus stats and sprint history.
 * @returns {Promise<Object>} { total_sprints, total_minutes, total_hours, recent_sprints }
 */
export const fetchMyFocusStats = async () => {
  const response = await api.get('/focus/my-stats')
  return response.data.data
}
