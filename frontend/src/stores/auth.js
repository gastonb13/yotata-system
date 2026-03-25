import { defineStore } from 'pinia'
import { api } from '../api'
import { useToast } from 'vue-toastification'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isClient: (state) => state.user?.role === 'client',
    userName: (state) => {
      if (state.user?.email) {
        return state.user.email.split('@')[0]
      }
      return 'User'
    }
  },

  actions: {

    async login(email, password) {
      const toast = useToast()
      this.loading = true

      try {
        // ✅ use api (not axios)
        const res = await api.post('/auth/login', { email, password })

        console.log("LOGIN RESPONSE:", res)

        // ❗ important: depending on your api wrapper
        const data = res.data || res

        if (!data.success) {
          toast.error(data.message || "Login failed")
          return { success: false }
        }

        // ✅ store in state
        this.token = data.token
        this.user = data.user

        // ✅ store in localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        toast.success("Login successful!")

        return {
          success: true,
          role: data.user.role
        }

      } catch (err) {
        console.error("LOGIN ERROR:", err)

        const msg = err.response?.data?.message || "Login failed"
        toast.error(msg)

        return { success: false }
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      const toast = useToast()
      this.loading = true
      
      try {
        const res = await api.post('/auth/register', userData)
        const data = res.data || res

        if (data.success) {
          this.token = data.token
          this.user = data.user

          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))

          toast.success('Registration successful!')
          return { success: true, role: data.user.role }
        } else {
          toast.error(data.message || 'Registration failed')
          return { success: false }
        }

      } catch (error) {
        console.error('Registration error:', error)
        toast.error(error.response?.data?.message || 'Registration failed')
        return { success: false }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      const toast = useToast()
      try {
        if (this.token) {
          await api.post('/auth/logout')
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.token = null
        this.user = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        toast.info('Logged out successfully')
      }
    },

    async checkAuth() {
      if (!this.token) return false
      
      try {
        const res = await api.get('/auth/profile')
        const data = res.data || res

        if (data.success) {
          this.user = data.user
          localStorage.setItem('user', JSON.stringify(data.user))
          return true
        } else {
          this.token = null
          this.user = null
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          return false
        }

      } catch (error) {
        this.token = null
        this.user = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return false
      }
    }

  }
})