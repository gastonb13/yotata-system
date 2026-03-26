<template>
  <div class="clients-page">
    <div class="page-header">
      <h1>Clients Management</h1>
      <button class="btn-primary" @click="showCreateModal = true">+ Add New Client</button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <h3>Total Clients</h3>
          <p class="stat-value">{{ stats.total }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <h3>Active Clients</h3>
          <p class="stat-value">{{ stats.active }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <h3>Total Orders</h3>
          <p class="stat-value">{{ stats.totalOrders }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <h3>Total Revenue</h3>
          <p class="stat-value">${{ formatPrice(stats.totalRevenue) }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Search by company name, email, phone..." 
        class="search-input"
      />
      <select v-model="statusFilter" class="filter-select">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>

    <!-- Clients Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Company Name</th>
            <th>Contact Person</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Orders</th>
            <th>Total Spent</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="client in paginatedClients" :key="client.id">
            <td>#{{ client.id }}</td>
            <td class="company-name">{{ client.company_name }}</td>
            <td>{{ client.contact_person || '-' }}</td>
            <td>{{ client.user?.email || '-' }}</td>
            <td>{{ client.phone || '-' }}</td>
            <td>{{ client.order_count || 0 }}</td>
            <td class="amount">${{ formatPrice(client.total_spent || 0) }}</td>
            <td>
              <span :class="['status-badge', client.user?.is_active ? 'active' : 'inactive']">
                {{ client.user?.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="actions">
              <button @click="viewClient(client)" class="btn-icon" title="View">👁️</button>
              <button @click="editClient(client)" class="btn-icon" title="Edit">✏️</button>
              <button @click="toggleClientStatus(client)" class="btn-icon" :title="client.user?.is_active ? 'Deactivate' : 'Activate'">
                {{ client.user?.is_active ? '🔴' : '🟢' }}
              </button>
            </td>
          </tr>
          <tr v-if="filteredClients.length === 0">
            <td colspan="9" class="empty-state">No clients found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">Previous</button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">Next</button>
    </div>

    <!-- Create/Edit Client Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>{{ showEditModal ? 'Edit Client' : 'Add New Client' }}</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveClient">
            <div class="form-row">
              <div class="form-group">
                <label>Company Name *</label>
                <input type="text" v-model="form.company_name" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Contact Person</label>
                <input type="text" v-model="form.contact_person" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Email *</label>
                <input type="email" v-model="form.email" class="form-control" required :disabled="showEditModal" />
              </div>
              <div class="form-group">
                <label>Password *</label>
                <input type="password" v-model="form.password" class="form-control" :required="!showEditModal" />
                <small v-if="showEditModal" class="form-hint">Leave blank to keep current password</small>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Phone</label>
                <input type="tel" v-model="form.phone" class="form-control" />
              </div>
              <div class="form-group">
                <label>Mobile</label>
                <input type="tel" v-model="form.mobile" class="form-control" />
              </div>
            </div>

            <div class="form-group">
              <label>Address</label>
              <textarea v-model="form.address" rows="2" class="form-control"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>City</label>
                <input type="text" v-model="form.city" class="form-control" />
              </div>
              <div class="form-group">
                <label>Country</label>
                <select v-model="form.country" class="form-control">
                  <option value="Tunisia">Tunisia</option>
                  <option value="Algeria">Algeria</option>
                  <option value="Morocco">Morocco</option>
                  <option value="Egypt">Egypt</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Tax Number / VAT</label>
                <input type="text" v-model="form.tax_number" class="form-control" />
              </div>
              <div class="form-group">
                <label>Credit Limit</label>
                <input type="number" v-model="form.credit_limit" class="form-control" step="0.01" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Payment Terms (days)</label>
                <input type="number" v-model="form.payment_terms" class="form-control" />
              </div>
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.status" class="form-control">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="form.notes" rows="2" class="form-control"></textarea>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeModal" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : (showEditModal ? 'Update Client' : 'Create Client') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View Client Modal -->
    <div v-if="showViewModal && selectedClient" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Client Details</h2>
          <button @click="closeViewModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="client-details">
            <div class="detail-section">
              <h3>Company Information</h3>
              <div class="detail-row">
                <span class="detail-label">Company Name:</span>
                <span class="detail-value">{{ selectedClient.company_name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Contact Person:</span>
                <span class="detail-value">{{ selectedClient.contact_person || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ selectedClient.user?.email || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">{{ selectedClient.phone || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Mobile:</span>
                <span class="detail-value">{{ selectedClient.mobile || '-' }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Address</h3>
              <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">{{ selectedClient.address || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">City:</span>
                <span class="detail-value">{{ selectedClient.city || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Country:</span>
                <span class="detail-value">{{ selectedClient.country || '-' }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Financial Information</h3>
              <div class="detail-row">
                <span class="detail-label">Tax Number:</span>
                <span class="detail-value">{{ selectedClient.tax_number || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Credit Limit:</span>
                <span class="detail-value">${{ formatPrice(selectedClient.credit_limit || 0) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Terms:</span>
                <span class="detail-value">{{ selectedClient.payment_terms || 30 }} days</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Orders:</span>
                <span class="detail-value">{{ selectedClient.order_count || 0 }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Spent:</span>
                <span class="detail-value">${{ formatPrice(selectedClient.total_spent || 0) }}</span>
              </div>
            </div>

            <div class="detail-section" v-if="selectedClient.notes">
              <h3>Notes</h3>
              <p class="notes-text">{{ selectedClient.notes }}</p>
            </div>

            <div class="detail-section" v-if="selectedClient.recent_orders?.length">
              <h3>Recent Orders</h3>
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="order in selectedClient.recent_orders" :key="order.id">
                    <td>{{ order.order_number }}</td>
                    <td>{{ formatDate(order.order_date) }}</td>
                    <td>${{ formatPrice(order.final_amount) }}</td>
                    <td><span :class="['status-badge', order.status]">{{ order.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeViewModal" class="btn-secondary">Close</button>
          <button @click="editClient(selectedClient)" class="btn-primary">Edit Client</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../../api'

const clients = ref([])
const loading = ref(false)

const form = ref({
  company_name: '',
  phone: ''
})

const loadClients = async () => {
  loading.value = true
  try {
    const res = await api.get('/clients')

    if (res.data.success) {
      clients.value = res.data.clients
    }

  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const createClient = async () => {
  try {
    const res = await api.post('/clients', form.value)

    if (res.data.success) {
      form.value.company_name = ''
      form.value.phone = ''

      await loadClients() // 🔥 reload list
    }

  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  loadClients()
})
</script>

<style scoped>
.clients-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
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

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  max-width: 300px;
}

.filter-select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  width: 150px;
}

.table-container {
  background: white;
  border-radius: 10px;
  overflow-x: auto;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

td {
  padding: 12px 15px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
}

.company-name {
  font-weight: 600;
  color: #667eea;
}

.amount {
  font-weight: 600;
  color: #28a745;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 5px;
  transition: transform 0.2s;
}

.btn-icon:hover {
  transform: scale(1.1);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding: 20px;
}

.page-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

.modal-large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  font-size: 20px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
}

.form-hint {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  display: block;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.btn-primary {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 24px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary:hover {
  background: #5a6268;
}

/* Client Details */
.client-details {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.detail-section h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #333;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
}

.detail-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-label {
  width: 140px;
  font-weight: 600;
  color: #666;
}

.detail-value {
  flex: 1;
  color: #333;
}

.notes-text {
  color: #666;
  line-height: 1.5;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 5px;
}

.mini-table {
  width: 100%;
  margin-top: 10px;
}

.mini-table th,
.mini-table td {
  padding: 8px;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e9ecef;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .search-input,
  .filter-select {
    max-width: 100%;
    width: 100%;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .detail-row {
    flex-direction: column;
  }
  
  .detail-label {
    width: auto;
    margin-bottom: 5px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .actions {
    flex-direction: column;
    gap: 5px;
  }
}
</style>