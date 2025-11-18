import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor with enhanced error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
      const networkError = new Error(
        'Network error: Unable to connect to the server. Please check your internet connection and try again.'
      )
      networkError.name = 'NetworkError'
      return Promise.reject(networkError)
    }

    const status = error.response?.status
    const data = error.response?.data

    // Handle 401 unauthorized
    if (status === 401) {
      localStorage.removeItem('authToken')
      // Only redirect if not already on login/register page
      const currentPath = window.location.pathname
      const publicPaths = ['/login', '/register']
      if (!publicPaths.some(path => currentPath.includes(path))) {
        window.location.href = '/login'
      }
      const authError = new Error(data?.error || 'Session expired. Please login again.')
      authError.name = 'AuthenticationError'
      return Promise.reject(authError)
    }

    // Handle 403 forbidden
    if (status === 403) {
      const forbiddenError = new Error(data?.error || 'You do not have permission to perform this action.')
      forbiddenError.name = 'ForbiddenError'
      return Promise.reject(forbiddenError)
    }

    // Handle 404 not found
    if (status === 404) {
      const notFoundError = new Error(data?.error || 'The requested resource was not found.')
      notFoundError.name = 'NotFoundError'
      return Promise.reject(notFoundError)
    }

    // Handle 422 validation errors
    if (status === 422) {
      const validationError = new Error(
        data?.error || data?.message || 'Validation failed. Please check your input.'
      )
      validationError.name = 'ValidationError'
      return Promise.reject(validationError)
    }

    // Handle 500+ server errors
    if (status >= 500) {
      const serverError = new Error(
        data?.error || 'Server error. Please try again later or contact support if the problem persists.'
      )
      serverError.name = 'ServerError'
      return Promise.reject(serverError)
    }

    // Handle other errors
    const genericError = new Error(
      data?.error || data?.message || `Request failed with status ${status}`
    )
    genericError.name = 'APIError'
    return Promise.reject(genericError)
  }
)

export default apiClient

