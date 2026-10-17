import axios from 'axios'

/**
 * Pre-configured Axios instance for PeerConnect API.
 * Base URL is read from the Vite environment variable VITE_API_BASE_URL.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor: attach JWT token if present ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor: global error handling ───────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired – clear storage (auth context will redirect to login)
      localStorage.removeItem('access_token')
    }
    return Promise.reject(error)
  },
)

export default api
