<template>
  <aside class="sidebar">
    <div class="sidebar-menu">
      <div v-if="isAdmin" class="menu-section">
        <h3>Management</h3>
        <router-link to="/admin/dashboard" class="menu-item">
          <span class="menu-icon">📊</span>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/admin/clients" class="menu-item">
          <span class="menu-icon">👥</span>
          <span>Clients</span>
        </router-link>
        <router-link to="/admin/employees" class="menu-item">
          <span class="menu-icon">👔</span>
          <span>Employees</span>
        </router-link>
        <router-link to="/admin/orders" class="menu-item">
          <span class="menu-icon">📦</span>
          <span>Orders</span>
        </router-link>
        <router-link to="/admin/products" class="menu-item">
          <span class="menu-icon">🛍️</span>
          <span>Products</span>
        </router-link>
        <router-link to="/admin/payments" class="menu-item">
          <span class="menu-icon">💰</span>
          <span>Payments</span>
        </router-link>
        <router-link to="/admin/salary" class="menu-item">
          <span class="menu-icon">💵</span>
          <span>Salary</span>
        </router-link>
        <router-link to="/admin/reports" class="menu-item">
          <span class="menu-icon">📈</span>
          <span>Reports</span>
        </router-link>
      </div>
      
      <div v-if="isClient" class="menu-section">
        <h3>My Account</h3>
        <router-link to="/client/dashboard" class="menu-item">
          <span class="menu-icon">📊</span>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/client/orders" class="menu-item">
          <span class="menu-icon">📦</span>
          <span>My Orders</span>
        </router-link>
        <router-link to="/client/requests" class="menu-item">
          <span class="menu-icon">📝</span>
          <span>Requests</span>
        </router-link>
        <router-link to="/client/documents" class="menu-item">
          <span class="menu-icon">📄</span>
          <span>Documents</span>
        </router-link>
        <router-link to="/client/profile" class="menu-item">
          <span class="menu-icon">👤</span>
          <span>Profile</span>
        </router-link>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin)
const isClient = computed(() => authStore.isClient)
</script>

<style scoped>
.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e9ecef;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

.sidebar-menu {
  padding: 20px 0;
}

.menu-section {
  margin-bottom: 30px;
}

.menu-section h3 {
  padding: 0 20px;
  font-size: 12px;
  text-transform: uppercase;
  color: #999;
  margin-bottom: 15px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  color: #666;
  text-decoration: none;
  transition: all 0.3s;
}

.menu-item:hover {
  background: #f5f5f5;
  color: #667eea;
}

.menu-item.router-link-active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
  border-right: 3px solid #667eea;
}

.menu-icon {
  font-size: 20px;
  width: 24px;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -280px;
    transition: left 0.3s;
    z-index: 1000;
  }
  
  .sidebar.open {
    left: 0;
  }
}
</style>