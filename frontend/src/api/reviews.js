import api from './axios'

/**
 * Submit a review for a completed tutoring session.
 * @param {Object} data - { request_id, rating, comment }
 * @returns {Promise<Object>} created review
 */
export const submitReview = async (data) => {
  const response = await api.post('/reviews', data)
  return response.data.data
}

/**
 * Fetch reviews and computed rating metrics for a tutor.
 * @param {string} tutorId
 * @returns {Promise<Object>} { tutor_id, average_rating, total_reviews, breakdown, reviews }
 */
export const fetchTutorReviews = async (tutorId) => {
  const response = await api.get(`/tutors/${tutorId}/reviews`)
  return response.data.data
}
