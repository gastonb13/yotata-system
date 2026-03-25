<template>
  <div class="client-dashboard">
    <div class="dashboard-header">
      <h1>Welcome, {{ clientName || 'User' }}</h1>
      <p>Here's what's happening with your account today</p>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <span>📦</span>
        </div>
        <div class="stat-info">
          <h3>Active Orders</h3>
          <p class="stat-value">{{ stats.activeOrders || 0 }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <span>💰</span>
        </div>
        <div class="stat-info">
          <h3>Total Spent</h3>
          <p class="stat-value">${{ formatPrice(stats.totalSpent || 0) }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <span>⏳</span>
        </div>
        <div class="stat-info">
          <h3>Pending Requests</h3>
          <p class="stat-value">{{ stats.pendingRequests || 0 }}</p>
        </div>
      </div>
    </div>
    
    <div class="recent-section">
      <div class="section-header">
        <h2>Recent Orders</h2>
        <router-link to="/client/orders" class="view-all">View All</router-link>
      </div>
      
      <div class="orders-table" v-if="recentOrders && recentOrders.length > 0">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in recentOrders" :key="order.id">
              <td>{{ order.order_number }}</td>
              <td>{{ formatDate(order.order_date) }}</td>
              <td>${{ formatPrice(order.final_amount) }}</td>
              <td>
                <span :class="['status-badge', order.status]">
                  {{ getStatusText(order.status) }}
                </span>
              </td>
              <td>
                <router-link :to="`/client/orders/${order.id}`" class="view-link">
                  View Details
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <p>No orders yet. Start shopping with us!</p>
      </div>
    </div>
    
    <div class="quick-actions">
      <div class="section-header">
        <h2>Quick Actions</h2>
      </div>
      <div class="actions-grid">
        <div class="action-card" @click="navigateTo('/client/orders')">
          <span class="action-icon">🛒</span>
          <h4>New Order</h4>
          <p>Place a new order</p>
        </div>
        <div class="action-card" @click="navigateTo('/client/documents')">
          <span class="action-icon">📄</span>
          <h4>Documents</h4>
          <p>View your documents</p>
        </div>
        <div class="action-card" @click="navigateTo('/client/profile')">
          <span class="action-icon">👤</span>
          <h4>Profile</h4>
          <p>Update your profile</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const clientName = ref('')
const stats = ref({
  activeOrders: 0,
  totalSpent: 0,
  pendingRequests: 0
})
const recentOrders = ref([])

const formatPrice = (price) => {
  if (!price && price !== 0) return '0.00'
  return Number(price).toFixed(2)
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

const getStatusText = (status) => {
  const statusMap = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  }
  return statusMap[status] || status || 'Unknown'
}

const navigateTo = (path) => {
  router.push(path)
}

onMounted(async () => {
  try {
    // Fetch client profile
    const profileResponse = await api.get('/clients/profile')
    if (profileResponse && profileResponse.success) {
      clientName.value = profileResponse.client?.company_name || 'User'
    }
    
    // Fetch stats
    const statsResponse = await api.get('/clients/stats')
    if (statsResponse && statsResponse.success) {
      stats.value = {
        activeOrders: statsResponse.stats?.activeOrders || 0,
        totalSpent: statsResponse.stats?.totalSpent || 0,
        pendingRequests: statsResponse.stats?.pendingRequests || 0
      }
      recentOrders.value = statsResponse.recentOrders || []
    }
  } catch (error) {
    console.error('Error loading dashboard:', error)
    // Set default values on error
    clientName.value = authStore.userName || 'User'
    stats.value = {
      activeOrders: 0,
      totalSpent: 0,
      pendingRequests: 0
    }
    recentOrders.value = []
  }
})
</script>

<style scoped>
.client-dashboard {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 30px;
}

.dashboard-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.dashboard-header p {
  color: #666;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-info h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.recent-section {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 40px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 20px;
  color: #333;
}

.view-all {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
}

.orders-table {
  overflow-x: auto;
}

.orders-table table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th,
.orders-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.orders-table th {
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.processing {
  background: #cce5ff;
  color: #004085;
}

.status-badge.shipped {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.delivered {
  background: #d4edda;
  color: #155724;
}

.status-badge.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.view-link {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.action-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 10px;
}

.action-card h4 {
  font-size: 16px;
  margin-bottom: 5px;
  color: #333;
}

.action-card p {
  font-size: 12px;
  color: #666;
}

@media (max-width: 768px) {
  .client-dashboard {
    padding: 20px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>