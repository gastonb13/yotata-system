<template>
  <div class="payments-page">
    <div class="page-header">
      <h1>Payments Management</h1>
      <button class="btn-primary" @click="showCreateModal = true">+ Record Payment</button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <h3>Total Collected</h3>
          <p class="stat-value">${{ formatPrice(stats.totalCollected) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <h3>Pending Payments</h3>
          <p class="stat-value">${{ formatPrice(stats.pendingPayments) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔄</div>
        <div class="stat-info">
          <h3>Refunded Amount</h3>
          <p class="stat-value">${{ formatPrice(stats.refundedAmount) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <h3>Transactions</h3>
          <p class="stat-value">{{ stats.transactions }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Search by order #, transaction ID..." 
        class="search-input"
      />
      <select v-model="statusFilter" class="filter-select">
        <option value="">All Status</option>
        <option value="completed">Completed</option>
        <option value="pending">Pending</option>
        <option value="failed">Failed</option>
        <option value="refunded">Refunded</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <select v-model="methodFilter" class="filter-select">
        <option value="">All Methods</option>
        <option value="cash">Cash</option>
        <option value="bank_transfer">Bank Transfer</option>
        <option value="credit_card">Credit Card</option>
        <option value="check">Check</option>
        <option value="online">Online</option>
      </select>
      <div class="date-range">
        <input type="date" v-model="dateRange.start" placeholder="Start Date" />
        <span>to</span>
        <input type="date" v-model="dateRange.end" placeholder="End Date" />
      </div>
      <button @click="applyFilters" class="btn-filter">Apply Filters</button>
    </div>

    <!-- Payments Table -->
    <div class="table-container">
       <table>
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Order #</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in paginatedPayments" :key="payment.id">
            <td class="transaction-id">{{ payment.transaction_id || '-' }}</td>
            <td class="order-number">{{ payment.order?.order_number || '-' }}</td>
            <td>{{ payment.order?.client?.company_name || '-' }}</td>
            <td class="amount">${{ formatPrice(payment.amount) }}</td>
            <td>
              <span class="method-badge">{{ getMethodText(payment.payment_method) }}</span>
            </td>
            <td>{{ formatDate(payment.payment_date) }}</td>
            <td>
              <span :class="['status-badge', payment.status]">
                {{ getStatusText(payment.status) }}
              </span>
            </td>
            <td class="actions">
              <button @click="viewPayment(payment)" class="btn-icon" title="View">👁️</button>
              <button 
                v-if="payment.status === 'completed'" 
                @click="refundPayment(payment)" 
                class="btn-icon" 
                title="Refund"
              >🔄</button>
              <button 
                v-if="payment.status === 'pending'" 
                @click="voidPayment(payment)" 
                class="btn-icon" 
                title="Void"
              >❌</button>
            </td>
          </tr>
          <tr v-if="filteredPayments.length === 0">
            <td colspan="8" class="empty-state">No payments found</td>
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

    <!-- Create Payment Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Record Payment</h2>
          <button @click="closeCreateModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="createPayment">
            <div class="form-group">
              <label>Select Order *</label>
              <select v-model="paymentForm.order_id" class="form-control" required @change="loadOrderDetails">
                <option value="">Select an order</option>
                <option v-for="order in pendingOrders" :key="order.id" :value="order.id">
                  {{ order.order_number }} - ${{ formatPrice(order.final_amount) }} - {{ order.client?.company_name }}
                </option>
              </select>
            </div>

            <div v-if="selectedOrder" class="order-summary">
              <h3>Order Summary</h3>
              <div class="summary-row">
                <span>Order Total:</span>
                <strong>${{ formatPrice(selectedOrder.final_amount) }}</strong>
              </div>
              <div class="summary-row">
                <span>Amount Paid:</span>
                <strong>${{ formatPrice(selectedOrder.paid_amount || 0) }}</strong>
              </div>
              <div class="summary-row total">
                <span>Remaining Balance:</span>
                <strong>${{ formatPrice(remainingBalance) }}</strong>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Payment Amount *</label>
                <input 
                  type="number" 
                  v-model="paymentForm.amount" 
                  class="form-control" 
                  step="0.01"
                  :max="remainingBalance"
                  required
                />
              </div>
              <div class="form-group">
                <label>Payment Method *</label>
                <select v-model="paymentForm.method" class="form-control" required>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="check">Check</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Reference Number</label>
                <input type="text" v-model="paymentForm.reference" class="form-control" placeholder="Check #, Transaction ID..." />
              </div>
              <div class="form-group" v-if="paymentForm.method === 'bank_transfer'">
                <label>Bank Name</label>
                <input type="text" v-model="paymentForm.bank_name" class="form-control" />
              </div>
            </div>

            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="paymentForm.notes" rows="2" class="form-control" placeholder="Additional notes..."></textarea>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeCreateModal" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="!canSubmitPayment">
                Record Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View Payment Modal -->
    <div v-if="showViewModal && selectedPayment" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Payment Details</h2>
          <button @click="closeViewModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="payment-details">
            <div class="detail-section">
              <h3>Payment Information</h3>
              <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">{{ selectedPayment.transaction_id || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value amount">${{ formatPrice(selectedPayment.amount) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Method:</span>
                <span class="detail-value">{{ getMethodText(selectedPayment.payment_method) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">{{ formatDateTime(selectedPayment.payment_date) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span :class="['status-badge', selectedPayment.status]">
                  {{ getStatusText(selectedPayment.status) }}
                </span>
              </div>
              <div class="detail-row" v-if="selectedPayment.reference_number">
                <span class="detail-label">Reference:</span>
                <span class="detail-value">{{ selectedPayment.reference_number }}</span>
              </div>
              <div class="detail-row" v-if="selectedPayment.bank_name">
                <span class="detail-label">Bank:</span>
                <span class="detail-value">{{ selectedPayment.bank_name }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Order Information</h3>
              <div class="detail-row">
                <span class="detail-label">Order Number:</span>
                <span class="detail-value">{{ selectedPayment.order?.order_number }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Client:</span>
                <span class="detail-value">{{ selectedPayment.order?.client?.company_name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Order Total:</span>
                <span class="detail-value">${{ formatPrice(selectedPayment.order?.final_amount) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Order Status:</span>
                <span :class="['status-badge', selectedPayment.order?.status]">
                  {{ getOrderStatusText(selectedPayment.order?.status) }}
                </span>
              </div>
            </div>

            <div class="detail-section" v-if="selectedPayment.notes">
              <h3>Notes</h3>
              <p class="notes-text">{{ selectedPayment.notes }}</p>
            </div>

            <div class="detail-section" v-if="selectedPayment.status === 'refunded'">
              <h3>Refund Information</h3>
              <div class="detail-row">
                <span class="detail-label">Refund Date:</span>
                <span class="detail-value">{{ formatDateTime(selectedPayment.updated_at) }}</span>
              </div>
              <div class="detail-row" v-if="selectedPayment.refund_reason">
                <span class="detail-label">Reason:</span>
                <span class="detail-value">{{ selectedPayment.refund_reason }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeViewModal" class="btn-secondary">Close</button>
          <button 
            v-if="selectedPayment.status === 'completed'" 
            @click="refundPayment(selectedPayment)" 
            class="btn-danger"
          >
            Refund Payment
          </button>
          <button 
            v-if="selectedPayment.status === 'pending'" 
            @click="voidPayment(selectedPayment)" 
            class="btn-danger"
          >
            Void Payment
          </button>
          <button @click="downloadReceipt(selectedPayment)" class="btn-primary">Download Receipt</button>
        </div>
      </div>
    </div>

    <!-- Refund Modal -->
    <div v-if="showRefundModal && selectedPayment" class="modal-overlay" @click.self="closeRefundModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Refund Payment</h2>
          <button @click="closeRefundModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="refund-summary">
            <div class="summary-row">
              <span>Original Payment:</span>
              <strong>${{ formatPrice(selectedPayment.amount) }}</strong>
            </div>
            <div class="summary-row">
              <span>Transaction ID:</span>
              <strong>{{ selectedPayment.transaction_id || '-' }}</strong>
            </div>
          </div>

          <div class="form-group">
            <label>Refund Amount *</label>
            <input 
              type="number" 
              v-model="refundForm.amount" 
              class="form-control" 
              step="0.01"
              :max="selectedPayment.amount"
              required
            />
          </div>

          <div class="form-group">
            <label>Refund Reason *</label>
            <textarea v-model="refundForm.reason" rows="3" class="form-control" required></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeRefundModal" class="btn-secondary">Cancel</button>
          <button @click="submitRefund" class="btn-danger" :disabled="processingRefund">
            {{ processingRefund ? 'Processing...' : 'Process Refund' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../../api';

const payments = ref([]);
const orders = ref([]);
const searchQuery = ref('');
const statusFilter = ref('');
const methodFilter = ref('');
const dateRange = ref({ start: '', end: '' });
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showCreateModal = ref(false);
const showViewModal = ref(false);
const showRefundModal = ref(false);
const selectedPayment = ref(null);
const selectedOrder = ref(null);
const processingRefund = ref(false);

const stats = ref({
  totalCollected: 0,
  pendingPayments: 0,
  refundedAmount: 0,
  transactions: 0
});

const paymentForm = ref({
  order_id: '',
  amount: '',
  method: 'cash',
  reference: '',
  bank_name: '',
  notes: ''
});

const refundForm = ref({
  amount: '',
  reason: ''
});

const pendingOrders = computed(() => {
  return orders.value.filter(order => 
    order.payment_status !== 'paid' && order.final_amount > (order.paid_amount || 0)
  );
});

const remainingBalance = computed(() => {
  if (!selectedOrder.value) return 0;
  const total = parseFloat(selectedOrder.value.final_amount);
  const paid = parseFloat(selectedOrder.value.paid_amount || 0);
  return total - paid;
});

const canSubmitPayment = computed(() => {
  return paymentForm.value.order_id && 
         paymentForm.value.amount && 
         paymentForm.value.amount > 0 && 
         paymentForm.value.amount <= remainingBalance.value;
});

const filteredPayments = computed(() => {
  let filtered = payments.value;
  
  if (searchQuery.value) {
    filtered = filtered.filter(payment => 
      payment.transaction_id?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      payment.order?.order_number?.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  if (statusFilter.value) {
    filtered = filtered.filter(payment => payment.status === statusFilter.value);
  }
  
  if (methodFilter.value) {
    filtered = filtered.filter(payment => payment.payment_method === methodFilter.value);
  }
  
  if (dateRange.value.start) {
    filtered = filtered.filter(payment => new Date(payment.payment_date) >= new Date(dateRange.value.start));
  }
  
  if (dateRange.value.end) {
    filtered = filtered.filter(payment => new Date(payment.payment_date) <= new Date(dateRange.value.end));
  }
  
  return filtered;
});

const totalPages = computed(() => {
  return Math.ceil(filteredPayments.value.length / itemsPerPage.value);
});

const paginatedPayments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredPayments.value.slice(start, end);
});

const formatPrice = (price) => {
  return Number(price).toFixed(2);
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
};

const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString();
};

const getStatusText = (status) => {
  const statusMap = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    refunded: 'Refunded',
    cancelled: 'Cancelled'
  };
  return statusMap[status] || status;
};

const getMethodText = (method) => {
  const methodMap = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    credit_card: 'Credit Card',
    check: 'Check',
    online: 'Online'
  };
  return methodMap[method] || method;
};

const getOrderStatusText = (status) => {
  const statusMap = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return statusMap[status] || status;
};

const loadPayments = async () => {
  try {
    const response = await api.get('/payments');
    if (response.success) {
      payments.value = response.payments;
      calculateStats();
    } else {
      // Demo data
      payments.value = [
        {
          id: 1,
          transaction_id: 'TXN123456789',
          order: {
            order_number: 'ORD-20240301-001',
            client: { company_name: 'Tech Solutions SARL' },
            final_amount: 1299.99,
            status: 'delivered',
            paid_amount: 1299.99
          },
          amount: 1299.99,
          payment_method: 'online',
          payment_date: '2024-03-01T10:30:00',
          status: 'completed',
          reference_number: 'PAY-001',
          notes: 'Full payment received'
        },
        {
          id: 2,
          transaction_id: 'TXN987654321',
          order: {
            order_number: 'ORD-20240315-002',
            client: { company_name: 'Digital Services' },
            final_amount: 849.99,
            status: 'shipped',
            paid_amount: 849.99
          },
          amount: 849.99,
          payment_method: 'credit_card',
          payment_date: '2024-03-15T14:45:00',
          status: 'completed',
          reference_number: 'CC-2024-001',
          notes: ''
        },
        {
          id: 3,
          transaction_id: null,
          order: {
            order_number: 'ORD-20240320-003',
            client: { company_name: 'Innovation Hub' },
            final_amount: 599.99,
            status: 'pending',
            paid_amount: 0
          },
          amount: 599.99,
          payment_method: 'cash',
          payment_date: '2024-03-20T09:15:00',
          status: 'pending',
          reference_number: null,
          notes: 'Awaiting confirmation'
        }
      ];
      calculateStats();
    }
  } catch (error) {
    console.error('Error loading payments:', error);
  }
};

const loadOrders = async () => {
  try {
    const response = await api.get('/orders');
    if (response.success) {
      orders.value = response.orders;
    } else {
      orders.value = [
        { id: 1, order_number: 'ORD-20240301-001', client: { company_name: 'Tech Solutions SARL' }, final_amount: 1299.99, payment_status: 'paid', paid_amount: 1299.99 },
        { id: 2, order_number: 'ORD-20240315-002', client: { company_name: 'Digital Services' }, final_amount: 849.99, payment_status: 'paid', paid_amount: 849.99 },
        { id: 3, order_number: 'ORD-20240320-003', client: { company_name: 'Innovation Hub' }, final_amount: 599.99, payment_status: 'pending', paid_amount: 0 }
      ];
    }
  } catch (error) {
    console.error('Error loading orders:', error);
  }
};

const calculateStats = () => {
  stats.value.totalCollected = payments.value
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  stats.value.pendingPayments = payments.value
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  stats.value.refundedAmount = payments.value
    .filter(p => p.status === 'refunded')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  stats.value.transactions = payments.value.length;
};

const loadOrderDetails = () => {
  if (paymentForm.value.order_id) {
    selectedOrder.value = orders.value.find(o => o.id === parseInt(paymentForm.value.order_id));
    paymentForm.value.amount = remainingBalance.value;
  } else {
    selectedOrder.value = null;
  }
};

const createPayment = async () => {
  try {
    const response = await api.post('/payments', {
      order_id: paymentForm.value.order_id,
      amount: paymentForm.value.amount,
      payment_method: paymentForm.value.method,
      reference_number: paymentForm.value.reference,
      bank_name: paymentForm.value.bank_name,
      notes: paymentForm.value.notes
    });
    
    if (response.success) {
      alert('Payment recorded successfully');
      closeCreateModal();
      await loadPayments();
      await loadOrders();
    }
  } catch (error) {
    console.error('Error creating payment:', error);
    alert('Failed to record payment');
  }
};

const viewPayment = (payment) => {
  selectedPayment.value = payment;
  showViewModal.value = true;
};

const refundPayment = (payment) => {
  selectedPayment.value = payment;
  refundForm.value = {
    amount: payment.amount,
    reason: ''
  };
  showRefundModal.value = true;
  showViewModal.value = false;
};

const submitRefund = async () => {
  if (!refundForm.value.amount || refundForm.value.amount <= 0) {
    alert('Please enter a valid refund amount');
    return;
  }
  
  if (!refundForm.value.reason) {
    alert('Please provide a reason for the refund');
    return;
  }
  
  processingRefund.value = true;
  try {
    const response = await api.post(`/payments/${selectedPayment.value.id}/refund`, {
      amount: refundForm.value.amount,
      reason: refundForm.value.reason
    });
    
    if (response.success) {
      alert('Payment refunded successfully');
      closeRefundModal();
      await loadPayments();
      await loadOrders();
    }
  } catch (error) {
    console.error('Error refunding payment:', error);
    alert('Failed to process refund');
  } finally {
    processingRefund.value = false;
  }
};

const voidPayment = async (payment) => {
  if (confirm('Are you sure you want to void this payment? This action cannot be undone.')) {
    try {
      const response = await api.put(`/payments/${payment.id}/void`);
      if (response.success) {
        alert('Payment voided successfully');
        await loadPayments();
        await loadOrders();
      }
    } catch (error) {
      console.error('Error voiding payment:', error);
      alert('Failed to void payment');
    }
  }
};

const downloadReceipt = (payment) => {
  const receipt = {
    transaction_id: payment.transaction_id || 'N/A',
    order_number: payment.order?.order_number,
    client: payment.order?.client?.company_name,
    amount: payment.amount,
    method: getMethodText(payment.payment_method),
    date: formatDateTime(payment.payment_date),
    status: getStatusText(payment.status),
    reference: payment.reference_number || 'N/A'
  };
  
  const receiptText = `
    =================================
           PAYMENT RECEIPT
    =================================
    Transaction ID: ${receipt.transaction_id}
    Order Number: ${receipt.order_number}
    Client: ${receipt.client}
    Amount: $${formatPrice(receipt.amount)}
    Payment Method: ${receipt.method}
    Date: ${receipt.date}
    Status: ${receipt.status}
    Reference: ${receipt.reference}
    =================================
    Thank you for your business!
    =================================
  `;
  
  const blob = new Blob([receiptText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `receipt_${payment.transaction_id || payment.id}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

const applyFilters = () => {
  currentPage.value = 1;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  paymentForm.value = {
    order_id: '',
    amount: '',
    method: 'cash',
    reference: '',
    bank_name: '',
    notes: ''
  };
  selectedOrder.value = null;
};

const closeViewModal = () => {
  showViewModal.value = false;
  selectedPayment.value = null;
};

const closeRefundModal = () => {
  showRefundModal.value = false;
  selectedPayment.value = null;
  refundForm.value = { amount: '', reason: '' };
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

onMounted(() => {
  loadPayments();
  loadOrders();
});
</script>

<style scoped>
.payments-page {
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
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  max-width: 250px;
}

.filter-select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  width: 150px;
}

.date-range {
  display: flex;
  gap: 10px;
  align-items: center;
}

.date-range input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.btn-filter {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
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
  min-width: 800px;
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

.transaction-id {
  font-family: monospace;
  font-size: 12px;
  color: #667eea;
}

.order-number {
  font-weight: 500;
  color: #667eea;
}

.amount {
  font-weight: 600;
  color: #28a745;
}

.method-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: #e9ecef;
  color: #495057;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.failed {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.refunded {
  background: #cce5ff;
  color: #004085;
}

.status-badge.cancelled {
  background: #e9ecef;
  color: #6c757d;
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
}

.page-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e9ecef;
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
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
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
}

.btn-danger {
  padding: 10px 24px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.order-summary {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #dee2e6;
}

.summary-row.total {
  border-top: 2px solid #dee2e6;
  border-bottom: none;
  margin-top: 8px;
  padding-top: 12px;
  font-size: 16px;
  font-weight: bold;
}

.payment-details {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.detail-section h3 {
  font-size: 16px;
  margin-bottom: 15px;
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

.detail-value.amount {
  font-weight: bold;
  color: #28a745;
  font-size: 18px;
}

.notes-text {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 5px;
  color: #666;
}

.refund-summary {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .search-input, .filter-select {
    max-width: 100%;
    width: 100%;
  }
  
  .date-range {
    flex-direction: column;
    width: 100%;
  }
  
  .date-range input {
    width: 100%;
  }
  
  .form-row {
    grid-template-columns: 1fr;
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
}
</style>