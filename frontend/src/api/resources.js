import api from './axios'

/**
 * Fetch community study resources with optional filters.
 * @param {Object} params - { q, subject, language, resource_type, sort_by, page, per_page }
 * @returns {Promise<Object>} { resources, total, page, total_pages }
 */
export const fetchResources = async (params = {}) => {
  const queryParams = new URLSearchParams()
  if (params.q) queryParams.append('q', params.q)
  if (params.subject) queryParams.append('subject', params.subject)
  if (params.language) queryParams.append('language', params.language)
  if (params.resource_type) queryParams.append('resource_type', params.resource_type)
  if (params.sort_by) queryParams.append('sort_by', params.sort_by)
  if (params.page) queryParams.append('page', params.page)
  if (params.per_page) queryParams.append('per_page', params.per_page)

  const url = `/resources${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  const response = await api.get(url)
  return response.data.data
}

/**
 * Publish a new study resource or note link.
 * @param {Object} data - { title, description, subject, topic, language, resource_type, url, tags }
 * @returns {Promise<Object>} created resource
 */
export const createResource = async (data) => {
  const response = await api.post('/resources', data)
  return response.data.data
}

/**
 * Toggle upvote on a community resource.
 * @param {string} resourceId
 * @returns {Promise<Object>} updated resource
 */
export const toggleUpvoteResource = async (resourceId) => {
  const response = await api.post(`/resources/${resourceId}/upvote`)
  return response.data.data
}

/**
 * Delete a resource owned by the author.
 * @param {string} resourceId
 */
export const deleteResource = async (resourceId) => {
  const response = await api.delete(`/resources/${resourceId}`)
  return response.data
}
