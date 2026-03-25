<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <router-link to="/" class="logo">
        <span class="logo-text">Yotata</span>
      </router-link>
    </div>
    
    <div class="navbar-menu" :class="{ 'is-active': isMenuOpen }">
      <div class="navbar-start">
        <router-link v-if="isAuthenticated && isClient" to="/client/dashboard" class="navbar-item">
          Dashboard
        </router-link>
        <router-link v-if="isAuthenticated && isClient" to="/client/orders" class="navbar-item">
          Orders
        </router-link>
        <router-link v-if="isAuthenticated && isClient" to="/client/documents" class="navbar-item">
          Documents
        </router-link>
        
        <router-link v-if="isAuthenticated && isAdmin" to="/admin/dashboard" class="navbar-item">
          Dashboard
        </router-link>
        <router-link v-if="isAuthenticated && isAdmin" to="/admin/clients" class="navbar-item">
          Clients
        </router-link>
        <router-link v-if="isAuthenticated && isAdmin" to="/admin/employees" class="navbar-item">
          Employees
        </router-link>
        <router-link v-if="isAuthenticated && isAdmin" to="/admin/orders" class="navbar-item">
          Orders
        </router-link>
        <router-link v-if="isAuthenticated && isAdmin" to="/admin/payments" class="navbar-item">
          Payments
        </router-link>
        <router-link v-if="isAuthenticated && isAdmin" to="/admin/salary" class="navbar-item">
          Salary
        </router-link>
      </div>
      
      <div class="navbar-end">
        <div v-if="isAuthenticated" class="navbar-item has-dropdown">
          <div class="user-info">
            <span class="user-avatar">{{ userInitial }}</span>
            <span class="user-name">{{ userName }}</span>
            <span class="dropdown-icon">▼</span>
          </div>
          
          <div class="dropdown-menu">
            <router-link to="/profile" class="dropdown-item">
              <span>👤</span> Profile
            </router-link>
            <router-link to="/settings" class="dropdown-item">
              <span>⚙️</span> Settings
            </router-link>
            <div class="dropdown-divider"></div>
            <a href="#" @click.prevent="handleLogout" class="dropdown-item">
              <span>🚪</span> Logout
            </a>
          </div>
        </div>
        
        <div v-else class="navbar-buttons">
          <router-link to="/login" class="btn-login">Login</router-link>
          <router-link to="/register" class="btn-register">Register</router-link>
        </div>
        
        <button class="navbar-burger" @click="toggleMenu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isMenuOpen = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const isClient = computed(() => authStore.isClient)
const userName = computed(() => authStore.userName)
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-brand {
  display: flex;
  align-items: center;
}

.logo {
  text-decoration: none;
  font-size: 24px;
  font-weight: bold;
}

.logo-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navbar-menu {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-start,
.navbar-end {
  display: flex;
  align-items: center;
  gap: 20px;
}

.navbar-item {
  text-decoration: none;
  color: #333;
  padding: 20px 0;
  transition: color 0.3s;
}

.navbar-item:hover {
  color: #667eea;
}

.navbar-item.router-link-active {
  color: #667eea;
  border-bottom: 2px solid #667eea;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px;
  border-radius: 5px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f5f5;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.user-name {
  font-size: 14px;
  color: #333;
}

.dropdown-icon {
  font-size: 10px;
  color: #999;
}

.has-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 5px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  display: none;
  z-index: 1000;
}

.has-dropdown:hover .dropdown-menu {
  display: block;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  text-decoration: none;
  color: #333;
  transition: background 0.3s;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-divider {
  height: 1px;
  background: #eee;
  margin: 5px 0;
}

.navbar-buttons {
  display: flex;
  gap: 10px;
}

.btn-login,
.btn-register {
  padding: 8px 20px;
  border-radius: 5px;
  text-decoration: none;
  transition: all 0.3s;
}

.btn-login {
  color: #667eea;
  border: 1px solid #667eea;
}

.btn-login:hover {
  background: #667eea;
  color: white;
}

.btn-register {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-register:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.navbar-burger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
}

.navbar-burger span {
  display: block;
  width: 25px;
  height: 2px;
  background: #333;
  margin: 5px 0;
  transition: 0.3s;
}

@media (max-width: 768px) {
  .navbar-menu {
    display: none;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    padding: 20px;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  }
  
  .navbar-menu.is-active {
    display: flex;
  }
  
  .navbar-start,
  .navbar-end {
    flex-direction: column;
    width: 100%;
  }
  
  .navbar-item {
    width: 100%;
    text-align: center;
  }
  
  .navbar-burger {
    display: block;
  }
  
  .has-dropdown:hover .dropdown-menu {
    display: none;
  }
  
  .dropdown-menu {
    position: static;
    box-shadow: none;
    padding-left: 20px;
  }
}
</style>