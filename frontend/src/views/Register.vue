<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1>Create Account</h1>
        <p>Join Yotata today</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="company_name">Company Name *</label>
          <input
            type="text"
            id="company_name"
            v-model="form.company_name"
            required
            placeholder="Enter your company name"
          />
        </div>
        
        <div class="form-group">
          <label for="email">Email Address *</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            required
            placeholder="Enter your email"
          />
        </div>
        
        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            v-model="form.phone"
            placeholder="Enter your phone number"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password *</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            required
            placeholder="Create a password (min 6 characters)"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirm Password *</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            placeholder="Confirm your password"
          />
          <p v-if="passwordMismatch" class="error-message">
            Passwords do not match
          </p>
        </div>
        
        <div class="form-group">
          <label for="address">Address</label>
          <textarea
            id="address"
            v-model="form.address"
            rows="3"
            placeholder="Enter your business address"
          ></textarea>
        </div>
        
        <button type="submit" class="btn-register" :disabled="loading || passwordMismatch">
          {{ loading ? 'Creating Account...' : 'Register' }}
        </button>
        
        <div class="login-link">
          Already have an account?
          <router-link to="/login">Login here</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  company_name: '',
  email: '',
  phone: '',
  password: '',
  address: ''
})
const confirmPassword = ref('')
const loading = ref(false)

const passwordMismatch = computed(() => {
  return form.value.password && confirmPassword.value && 
         form.value.password !== confirmPassword.value
})

const handleRegister = async () => {
  if (passwordMismatch.value) return
  
  loading.value = true
  const result = await authStore.register(form.value)
  
  if (result.success) {
    router.push('/client/dashboard')
  }
  
  loading.value = false
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  padding: 40px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h1 {
  color: #333;
  font-size: 28px;
  margin-bottom: 10px;
}

.register-header p {
  color: #666;
  font-size: 14px;
}

.register-form .form-group {
  margin-bottom: 20px;
}

.register-form label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.register-form input,
.register-form textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.register-form input:focus,
.register-form textarea:focus {
  outline: none;
  border-color: #667eea;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
}

.btn-register {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-register:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-register:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>