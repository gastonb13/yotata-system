import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - ALWAYS return the data directly
api.interceptors.response.use(
  (response) => {
    // Return the data directly so we don't need to access response.data
    return response.data
  },
  (error) => {
    // For errors, return the error response data if available
    if (error.response) {
      return Promise.reject(error)
    }
    return Promise.reject(error)
  }
)

export { api }