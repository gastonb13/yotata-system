<template>
  <div class="client-layout">
    <nav class="navbar">
      <div class="navbar-brand">
        <router-link to="/client/dashboard" class="logo">Yotata</router-link>
      </div>
      <div class="navbar-menu">
        <router-link to="/client/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/client/orders" class="nav-link">Orders</router-link>
        <router-link to="/client/documents" class="nav-link">Documents</router-link>
        <router-link to="/client/profile" class="nav-link">Profile</router-link>
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </div>
    </nav>
    <div class="layout-content">
      <aside class="sidebar">
        <div class="sidebar-menu">
          <router-link to="/client/dashboard" class="sidebar-link">
            <span>📊</span> Dashboard
          </router-link>
          <router-link to="/client/orders" class="sidebar-link">
            <span>📦</span> My Orders
          </router-link>
          <router-link to="/client/requests" class="sidebar-link">
            <span>📝</span> Requests
          </router-link>
          <router-link to="/client/documents" class="sidebar-link">
            <span>📄</span> Documents
          </router-link>
          <router-link to="/client/profile" class="sidebar-link">
            <span>👤</span> Profile
          </router-link>
        </div>
      </aside>
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.client-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.navbar-menu {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: #666;
  transition: color 0.3s;
}

.nav-link:hover {
  color: #667eea;
}

.logout-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
}

.logout-btn:hover {
  text-decoration: underline;
}

.layout-content {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e9ecef;
  padding: 2rem 0;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-link {
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s;
}

.sidebar-link:hover {
  background: #f8f9fa;
  color: #667eea;
}

.sidebar-link.router-link-active {
  background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%);
  color: #667eea;
  border-right: 3px solid #667eea;
}

.main-content {
  flex: 1;
  padding: 2rem;
  background: #f8f9fa;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
  
  .navbar-menu {
    gap: 1rem;
  }
  
  .main-content {
    padding: 1rem;
  }
}
</style>