<template>
  <div class="requests-page">
    <div class="page-header">
      <h1>Service Requests</h1>
      <button class="btn-new-request" @click="showNewRequestModal = true">+ New Request</button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="statusFilter" class="filter-select">
        <option value="">All Requests</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
      
      <select v-model="typeFilter" class="filter-select">
        <option value="">All Types</option>
        <option value="technical">Technical Support</option>
        <option value="billing">Billing Issue</option>
        <option value="return">Return/Refund</option>
        <option value="inquiry">General Inquiry</option>
        <option value="complaint">Complaint</option>
      </select>
      
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Search by subject..." 
        class="search-input"
      />
    </div>

    <!-- Requests List -->
    <div class="requests-list">
      <div v-for="request in paginatedRequests" :key="request.id" class="request-card">
        <div class="request-header">
          <div class="request-info">
            <span class="request-id">#{{ request.id }}</span>
            <span :class="['status-badge', request.status]">
              {{ getStatusText(request.status) }}
            </span>
            <span :class="['type-badge', request.type]">
              {{ getTypeText(request.type) }}
            </span>
          </div>
          <div class="request-date">
            {{ formatDate(request.created_at) }}
          </div>
        </div>
        
        <div class="request-subject">
          <h3>{{ request.subject }}</h3>
        </div>
        
        <div class="request-description">
          <p>{{ request.description }}</p>
        </div>
        
        <div class="request-footer">
          <div class="request-attachments" v-if="request.attachments && request.attachments.length">
            <span class="attachment-icon">📎</span>
            <span>{{ request.attachments.length }} attachment(s)</span>
          </div>
          <button @click="viewRequest(request.id)" class="btn-view">View Details</button>
        </div>
      </div>
      
      <div v-if="filteredRequests.length === 0" class="empty-state">
        <p>No requests found</p>
        <button @click="showNewRequestModal = true" class="btn-primary">Create Your First Request</button>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">Previous</button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">Next</button>
    </div>

    <!-- New Request Modal -->
    <div v-if="showNewRequestModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Create New Request</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Request Type *</label>
            <select v-model="newRequest.type" class="form-control" required>
              <option value="">Select request type</option>
              <option value="technical">Technical Support</option>
              <option value="billing">Billing Issue</option>
              <option value="return">Return/Refund</option>
              <option value="inquiry">General Inquiry</option>
              <option value="complaint">Complaint</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Subject *</label>
            <input 
              type="text" 
              v-model="newRequest.subject" 
              class="form-control"
              placeholder="Brief summary of your request"
              required
            />
          </div>
          
          <div class="form-group">
            <label>Description *</label>
            <textarea 
              v-model="newRequest.description" 
              rows="5" 
              class="form-control"
              placeholder="Please provide detailed information about your request"
              required
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>Order Reference (Optional)</label>
            <select v-model="newRequest.order_id" class="form-control">
              <option value="">No order reference</option>
              <option v-for="order in orders" :key="order.id" :value="order.id">
                {{ order.order_number }} - ${{ formatPrice(order.final_amount) }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Attachments (Optional)</label>
            <input type="file" multiple @change="handleFileUpload" class="form-control" />
            <div v-if="attachments.length" class="attachments-list">
              <div v-for="(file, index) in attachments" :key="index" class="attachment-item">
                <span>📄 {{ file.name }}</span>
                <button @click="removeAttachment(index)" class="remove-attachment">&times;</button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>Priority</label>
            <select v-model="newRequest.priority" class="form-control">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">Cancel</button>
          <button @click="submitRequest" class="btn-primary" :disabled="!canSubmit">Submit Request</button>
        </div>
      </div>
    </div>

    <!-- Request Detail Modal -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Request Details</h2>
          <button @click="closeDetailModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body" v-if="selectedRequest">
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">Request ID:</span>
              <span class="detail-value">#{{ selectedRequest.id }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span :class="['status-badge', selectedRequest.status]">
                {{ getStatusText(selectedRequest.status) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span :class="['type-badge', selectedRequest.type]">
                {{ getTypeText(selectedRequest.type) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Priority:</span>
              <span :class="['priority-badge', selectedRequest.priority]">
                {{ getPriorityText(selectedRequest.priority) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Created:</span>
              <span class="detail-value">{{ formatDate(selectedRequest.created_at) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Subject:</span>
              <span class="detail-value">{{ selectedRequest.subject }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Description:</span>
              <span class="detail-value">{{ selectedRequest.description }}</span>
            </div>
          </div>
          
          <div v-if="selectedRequest.responses && selectedRequest.responses.length" class="responses-section">
            <h3>Responses</h3>
            <div v-for="response in selectedRequest.responses" :key="response.id" class="response-item">
              <div class="response-header">
                <strong>{{ response.from_user }}</strong>
                <span class="response-date">{{ formatDate(response.created_at) }}</span>
              </div>
              <div class="response-message">{{ response.message }}</div>
            </div>
          </div>
          
          <div class="add-response-section">
            <h3>Add Response</h3>
            <textarea v-model="newResponse" rows="3" class="form-control" placeholder="Type your response..."></textarea>
            <button @click="addResponse" class="btn-primary" style="margin-top: 10px;">Send Response</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../../api';

const requests = ref([]);
const orders = ref([]);
const statusFilter = ref('');
const typeFilter = ref('');
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showNewRequestModal = ref(false);
const showDetailModal = ref(false);
const selectedRequest = ref(null);
const newResponse = ref('');

const newRequest = ref({
  type: '',
  subject: '',
  description: '',
  order_id: '',
  priority: 'medium'
});

const attachments = ref([]);

const filteredRequests = computed(() => {
  let filtered = requests.value;
  
  if (statusFilter.value) {
    filtered = filtered.filter(req => req.status === statusFilter.value);
  }
  
  if (typeFilter.value) {
    filtered = filtered.filter(req => req.type === typeFilter.value);
  }
  
  if (searchQuery.value) {
    filtered = filtered.filter(req => 
      req.subject.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  return filtered;
});

const totalPages = computed(() => {
  return Math.ceil(filteredRequests.value.length / itemsPerPage.value);
});

const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredRequests.value.slice(start, end);
});

const canSubmit = computed(() => {
  return newRequest.value.type && newRequest.value.subject && newRequest.value.description;
});

const formatPrice = (price) => {
  return Number(price).toFixed(2);
};

const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

const getStatusText = (status) => {
  const statusMap = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed'
  };
  return statusMap[status] || status;
};

const getTypeText = (type) => {
  const typeMap = {
    technical: 'Technical Support',
    billing: 'Billing Issue',
    return: 'Return/Refund',
    inquiry: 'General Inquiry',
    complaint: 'Complaint'
  };
  return typeMap[type] || type;
};

const getPriorityText = (priority) => {
  const priorityMap = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent'
  };
  return priorityMap[priority] || priority;
};

const loadRequests = async () => {
  try {
    const response = await api.get('/clients/requests');
    if (response.success) {
      requests.value = response.requests;
    } else {
      // Demo data if API not ready
      requests.value = [
        {
          id: 1,
          type: 'technical',
          status: 'pending',
          subject: 'Cannot connect to WiFi',
          description: 'My device is not connecting to the WiFi network. I have tried restarting but still not working.',
          priority: 'high',
          created_at: new Date().toISOString(),
          responses: []
        },
        {
          id: 2,
          type: 'billing',
          status: 'in-progress',
          subject: 'Incorrect charge on invoice',
          description: 'I was charged $100 extra on my last invoice. Please check and adjust.',
          priority: 'medium',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          responses: [
            {
              id: 1,
              from_user: 'Support Team',
              message: 'We are looking into this issue. Will get back to you shortly.',
              created_at: new Date(Date.now() - 43200000).toISOString()
            }
          ]
        }
      ];
    }
  } catch (error) {
    console.error('Error loading requests:', error);
    // Fallback demo data
    requests.value = [
      {
        id: 1,
        type: 'technical',
        status: 'pending',
        subject: 'Cannot connect to WiFi',
        description: 'My device is not connecting to the WiFi network.',
        priority: 'high',
        created_at: new Date().toISOString(),
        responses: []
      }
    ];
  }
};

const loadOrders = async () => {
  try {
    const response = await api.get('/clients/orders');
    if (response.success) {
      orders.value = response.orders;
    }
  } catch (error) {
    console.error('Error loading orders:', error);
  }
};

const submitRequest = async () => {
  try {
    const formData = new FormData();
    formData.append('type', newRequest.value.type);
    formData.append('subject', newRequest.value.subject);
    formData.append('description', newRequest.value.description);
    formData.append('priority', newRequest.value.priority);
    if (newRequest.value.order_id) {
      formData.append('order_id', newRequest.value.order_id);
    }
    
    attachments.value.forEach(file => {
      formData.append('attachments', file);
    });
    
    const response = await api.post('/clients/requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    if (response.success) {
      alert('Request submitted successfully!');
      closeModal();
      await loadRequests();
    }
  } catch (error) {
    console.error('Error submitting request:', error);
    alert('Failed to submit request');
  }
};

const viewRequest = (id) => {
  selectedRequest.value = requests.value.find(req => req.id === id);
  showDetailModal.value = true;
};

const addResponse = async () => {
  if (!newResponse.value.trim()) return;
  
  try {
    const response = await api.post(`/clients/requests/${selectedRequest.value.id}/respond`, {
      message: newResponse.value
    });
    
    if (response.success) {
      newResponse.value = '';
      await loadRequests();
      selectedRequest.value = requests.value.find(req => req.id === selectedRequest.value.id);
    }
  } catch (error) {
    console.error('Error adding response:', error);
    alert('Failed to add response');
  }
};

const handleFileUpload = (event) => {
  const files = Array.from(event.target.files);
  attachments.value.push(...files);
};

const removeAttachment = (index) => {
  attachments.value.splice(index, 1);
};

const closeModal = () => {
  showNewRequestModal.value = false;
  newRequest.value = {
    type: '',
    subject: '',
    description: '',
    order_id: '',
    priority: 'medium'
  };
  attachments.value = [];
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedRequest.value = null;
  newResponse.value = '';
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

onMounted(() => {
  loadRequests();
  loadOrders();
});
</script>

<style scoped>
.requests-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
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

.btn-new-request {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.2s;
}

.btn-new-request:hover {
  transform: translateY(-2px);
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.filter-select,
.search-input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.filter-select {
  width: 150px;
}

.search-input {
  flex: 1;
  max-width: 300px;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.request-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.request-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.request-info {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.request-id {
  font-weight: bold;
  color: #667eea;
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

.status-badge.in-progress {
  background: #cce5ff;
  color: #004085;
}

.status-badge.resolved {
  background: #d4edda;
  color: #155724;
}

.status-badge.closed {
  background: #e9ecef;
  color: #6c757d;
}

.type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.type-badge.technical {
  background: #d1ecf1;
  color: #0c5460;
}

.type-badge.billing {
  background: #fff3cd;
  color: #856404;
}

.type-badge.return {
  background: #f8d7da;
  color: #721c24;
}

.type-badge.inquiry {
  background: #d4edda;
  color: #155724;
}

.type-badge.complaint {
  background: #f8d7da;
  color: #721c24;
}

.priority-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.priority-badge.low {
  background: #e9ecef;
  color: #6c757d;
}

.priority-badge.medium {
  background: #cce5ff;
  color: #004085;
}

.priority-badge.high {
  background: #fff3cd;
  color: #856404;
}

.priority-badge.urgent {
  background: #f8d7da;
  color: #721c24;
}

.request-date {
  font-size: 12px;
  color: #999;
}

.request-subject h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #333;
}

.request-description {
  color: #666;
  margin-bottom: 15px;
  line-height: 1.5;
}

.request-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
}

.request-attachments {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #666;
}

.btn-view {
  padding: 5px 15px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 10px;
  color: #999;
}

.empty-state p {
  margin-bottom: 20px;
  font-size: 16px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

.modal-large {
  max-width: 700px;
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.attachments-list {
  margin-top: 10px;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background: #f8f9fa;
  border-radius: 5px;
  margin-bottom: 5px;
}

.remove-attachment {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 18px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e9ecef;
}

.btn-secondary {
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Detail Modal Styles */
.detail-section {
  margin-bottom: 30px;
}

.detail-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-label {
  width: 120px;
  font-weight: 600;
  color: #666;
}

.detail-value {
  flex: 1;
  color: #333;
}

.responses-section {
  margin-bottom: 30px;
}

.responses-section h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
}

.response-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 10px;
}

.response-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}

.response-date {
  color: #999;
  font-size: 12px;
}

.response-message {
  color: #666;
  line-height: 1.5;
}

.add-response-section h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }
  
  .filter-select,
  .search-input {
    width: 100%;
    max-width: 100%;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .request-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .detail-row {
    flex-direction: column;
  }
  
  .detail-label {
    width: auto;
    margin-bottom: 5px;
  }
}
</style>