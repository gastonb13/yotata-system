<template>
  <div class="orders-page">
    <div class="page-header">
      <h1>Orders Management</h1>
      <button class="btn-primary" @click="showCreateModal = true">+ Create New Order</button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <h3>Total Orders</h3>
          <p class="stat-value">{{ stats.total }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <h3>Pending</h3>
          <p class="stat-value">{{ stats.pending }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🚚</div>
        <div class="stat-info">
          <h3>Processing</h3>
          <p class="stat-value">{{ stats.processing }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <h3>Completed</h3>
          <p class="stat-value">{{ stats.completed }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <h3>Total Revenue</h3>
          <p class="stat-value">${{ formatPrice(stats.revenue) }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Search by order #, client name..." 
        class="search-input"
      />
      <select v-model="statusFilter" class="filter-select">
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="processing">Processing</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <select v-model="paymentFilter" class="filter-select">
        <option value="">All Payment Status</option>
        <option value="pending">Pending</option>
        <option value="partial">Partial</option>
        <option value="paid">Paid</option>
        <option value="overdue">Overdue</option>
      </select>
      <div class="date-range">
        <input type="date" v-model="dateRange.start" placeholder="Start Date" />
        <span>to</span>
        <input type="date" v-model="dateRange.end" placeholder="End Date" />
      </div>
      <button @click="applyFilters" class="btn-filter">Apply Filters</button>
    </div>

    <!-- Orders Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Client</th>
            <th>Date</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in paginatedOrders" :key="order.id">
            <td class="order-number">{{ order.order_number }}</td>
            <td>{{ order.client?.company_name || '-' }}</td>
            <td>{{ formatDate(order.order_date) }}</td>
            <td class="amount">${{ formatPrice(order.final_amount) }}</td>
            <td>
              <span :class="['status-badge', order.status]">
                {{ getStatusText(order.status) }}
              </span>
            </td>
            <td>
              <span :class="['payment-badge', order.payment_status]">
                {{ getPaymentStatusText(order.payment_status) }}
              </span>
            </td>
            <td class="actions">
              <button @click="viewOrder(order)" class="btn-icon" title="View">👁️</button>
              <button @click="editOrder(order)" class="btn-icon" title="Edit">✏️</button>
              <button @click="updateStatus(order)" class="btn-icon" title="Update Status">📝</button>
              <button @click="processPayment(order)" class="btn-icon" title="Process Payment">💰</button>
            </td>
          </tr>
          <tr v-if="filteredOrders.length === 0">
            <td colspan="7" class="empty-state">No orders found</td>
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

    <!-- View Order Modal -->
    <div v-if="showViewModal && selectedOrder" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Order Details - {{ selectedOrder.order_number }}</h2>
          <button @click="closeViewModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="order-details">
            <div class="detail-section">
              <h3>Order Information</h3>
              <div class="detail-row">
                <span class="detail-label">Order Number:</span>
                <span class="detail-value">{{ selectedOrder.order_number }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Order Date:</span>
                <span class="detail-value">{{ formatDate(selectedOrder.order_date) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span :class="['status-badge', selectedOrder.status]">{{ getStatusText(selectedOrder.status) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Status:</span>
                <span :class="['payment-badge', selectedOrder.payment_status]">{{ getPaymentStatusText(selectedOrder.payment_status) }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Client Information</h3>
              <div class="detail-row">
                <span class="detail-label">Company:</span>
                <span class="detail-value">{{ selectedOrder.client?.company_name || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Contact:</span>
                <span class="detail-value">{{ selectedOrder.client?.contact_person || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ selectedOrder.client?.user?.email || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">{{ selectedOrder.client?.phone || '-' }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Order Items</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Discount</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in selectedOrder.items || []" :key="item.id">
                    <td>{{ item.product?.name || '-' }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>${{ formatPrice(item.unit_price) }}</td>
                    <td>${{ formatPrice(item.discount) }}</td>
                    <td class="amount">${{ formatPrice(item.total_price) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" class="text-right"><strong>Subtotal:</strong></td>
                    <td class="amount">${{ formatPrice(selectedOrder.total_amount) }}</td>
                  </tr>
                  <tr v-if="selectedOrder.discount > 0">
                    <td colspan="4" class="text-right"><strong>Discount:</strong></td>
                    <td class="amount text-success">-${{ formatPrice(selectedOrder.discount) }}</td>
                  </tr>
                  <tr v-if="selectedOrder.tax_amount > 0">
                    <td colspan="4" class="text-right"><strong>Tax:</strong></td>
                    <td class="amount">${{ formatPrice(selectedOrder.tax_amount) }}</td>
                  </tr>
                  <tr>
                    <td colspan="4" class="text-right"><strong>Total:</strong></td>
                    <td class="amount total">${{ formatPrice(selectedOrder.final_amount) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div class="detail-section" v-if="selectedOrder.payment">
              <h3>Payment Information</h3>
              <div class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">{{ selectedOrder.payment.payment_method || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span class="detail-value">${{ formatPrice(selectedOrder.payment.amount || 0) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Date:</span>
                <span class="detail-value">{{ formatDate(selectedOrder.payment.payment_date) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">{{ selectedOrder.payment.transaction_id || '-' }}</span>
              </div>
            </div>

            <div class="detail-section" v-if="selectedOrder.notes">
              <h3>Notes</h3>
              <p class="notes-text">{{ selectedOrder.notes }}</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeViewModal" class="btn-secondary">Close</button>
          <button @click="editOrder(selectedOrder)" class="btn-primary">Edit Order</button>
          <button @click="updateStatus(selectedOrder)" class="btn-primary">Update Status</button>
          <button @click="processPayment(selectedOrder)" class="btn-primary">Process Payment</button>
        </div>
      </div>
    </div>

    <!-- Edit Order Modal -->
    <div v-if="showEditModal && selectedOrder" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Edit Order - {{ selectedOrder.order_number }}</h2>
          <button @click="closeEditModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="updateOrder">
            <div class="form-row">
              <div class="form-group">
                <label>Status</label>
                <select v-model="editForm.status" class="form-control">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div class="form-group">
                <label>Payment Status</label>
                <select v-model="editForm.payment_status" class="form-control">
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Discount</label>
                <input type="number" v-model="editForm.discount" class="form-control" step="0.01" />
              </div>
              <div class="form-group">
                <label>Tax Amount</label>
                <input type="number" v-model="editForm.tax_amount" class="form-control" step="0.01" />
              </div>
            </div>

            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="editForm.notes" rows="3" class="form-control"></textarea>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeEditModal" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="updating">Update Order</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Update Status Modal -->
    <div v-if="showStatusModal && selectedOrder" class="modal-overlay" @click.self="closeStatusModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Update Order Status</h2>
          <button @click="closeStatusModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Current Status: <strong>{{ getStatusText(selectedOrder.status) }}</strong></label>
            <select v-model="statusForm.status" class="form-control">
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div class="form-group">
            <label>Notes (Optional)</label>
            <textarea v-model="statusForm.notes" rows="3" class="form-control" placeholder="Add notes about status change..."></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeStatusModal" class="btn-secondary">Cancel</button>
          <button @click="submitStatusUpdate" class="btn-primary">Update Status</button>
        </div>
      </div>
    </div>

    <!-- Process Payment Modal -->
    <div v-if="showPaymentModal && selectedOrder" class="modal-overlay" @click.self="closePaymentModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Process Payment - {{ selectedOrder.order_number }}</h2>
          <button @click="closePaymentModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="payment-summary">
            <div class="summary-row">
              <span>Order Total:</span>
              <strong>${{ formatPrice(selectedOrder.final_amount) }}</strong>
            </div>
            <div class="summary-row">
              <span>Amount Paid:</span>
              <strong>${{ formatPrice(selectedOrder.payment?.amount || 0) }}</strong>
            </div>
            <div class="summary-row total">
              <span>Remaining Balance:</span>
              <strong>${{ formatPrice(remainingBalance) }}</strong>
            </div>
          </div>

          <div class="form-group">
            <label>Payment Amount</label>
            <input type="number" v-model="paymentForm.amount" class="form-control" step="0.01" :max="remainingBalance" required />
          </div>

          <div class="form-group">
            <label>Payment Method</label>
            <select v-model="paymentForm.method" class="form-control">
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit_card">Credit Card</option>
              <option value="check">Check</option>
              <option value="online">Online Payment</option>
            </select>
          </div>

          <div class="form-group">
            <label>Reference Number (Optional)</label>
            <input type="text" v-model="paymentForm.reference" class="form-control" />
          </div>

          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="paymentForm.notes" rows="2" class="form-control"></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closePaymentModal" class="btn-secondary">Cancel</button>
          <button @click="submitPayment" class="btn-primary" :disabled="processingPayment || !paymentForm.amount || paymentForm.amount <= 0">
            {{ processingPayment ? 'Processing...' : 'Process Payment' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create Order Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Create New Order</h2>
          <button @click="closeCreateModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="createOrder">
            <div class="form-group">
              <label>Select Client *</label>
              <select v-model="createForm.client_id" class="form-control" required>
                <option value="">Select a client</option>
                <option v-for="client in clients" :key="client.id" :value="client.id">
                  {{ client.company_name }} ({{ client.user?.email }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Order Items</label>
              <div class="items-editor">
                <div v-for="(item, index) in createForm.items" :key="index" class="item-row">
                  <select v-model="item.product_id" class="item-product" required>
                    <option value="">Select product</option>
                    <option v-for="product in products" :key="product.id" :value="product.id">
                      {{ product.name }} - ${{ formatPrice(product.unit_price) }}
                    </option>
                  </select>
                  <input type="number" v-model="item.quantity" class="item-quantity" placeholder="Qty" min="1" required />
                  <input type="number" v-model="item.discount" class="item-discount" placeholder="Discount" step="0.01" />
                  <button type="button" @click="removeItem(index)" class="btn-remove">🗑️</button>
                </div>
                <button type="button" @click="addItem" class="btn-add-item">+ Add Item</button>
              </div>
            </div>

            <div class="order-summary-preview">
              <h3>Order Summary</h3>
              <div class="summary-row">
                <span>Subtotal:</span>
                <strong>${{ formatPrice(createFormSubtotal) }}</strong>
              </div>
              <div class="summary-row">
                <span>Total Discount:</span>
                <strong>${{ formatPrice(createFormTotalDiscount) }}</strong>
              </div>
              <div class="summary-row total">
                <span>Total Amount:</span>
                <strong>${{ formatPrice(createFormTotal) }}</strong>
              </div>
            </div>

            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="createForm.notes" rows="2" class="form-control"></textarea>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeCreateModal" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="creating || !canCreateOrder">
                {{ creating ? 'Creating...' : 'Create Order' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../../api';

const orders = ref([]);
const clients = ref([]);
const products = ref([]);
const searchQuery = ref('');
const statusFilter = ref('');
const paymentFilter = ref('');
const dateRange = ref({ start: '', end: '' });
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showViewModal = ref(false);
const showEditModal = ref(false);
const showStatusModal = ref(false);
const showPaymentModal = ref(false);
const showCreateModal = ref(false);
const selectedOrder = ref(null);
const updating = ref(false);
const processingPayment = ref(false);
const creating = ref(false);

const stats = ref({
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  revenue: 0
});

const editForm = ref({
  status: '',
  payment_status: '',
  discount: 0,
  tax_amount: 0,
  notes: ''
});

const statusForm = ref({
  status: '',
  notes: ''
});

const paymentForm = ref({
  amount: 0,
  method: 'cash',
  reference: '',
  notes: ''
});

const createForm = ref({
  client_id: '',
  items: [{ product_id: '', quantity: 1, discount: 0 }],
  notes: ''
});

const filteredOrders = computed(() => {
  let filtered = orders.value;
  
  if (searchQuery.value) {
    filtered = filtered.filter(order => 
      order.order_number.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      order.client?.company_name?.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  if (statusFilter.value) {
    filtered = filtered.filter(order => order.status === statusFilter.value);
  }
  
  if (paymentFilter.value) {
    filtered = filtered.filter(order => order.payment_status === paymentFilter.value);
  }
  
  if (dateRange.value.start) {
    filtered = filtered.filter(order => new Date(order.order_date) >= new Date(dateRange.value.start));
  }
  
  if (dateRange.value.end) {
    filtered = filtered.filter(order => new Date(order.order_date) <= new Date(dateRange.value.end));
  }
  
  return filtered;
});

const totalPages = computed(() => {
  return Math.ceil(filteredOrders.value.length / itemsPerPage.value);
});

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredOrders.value.slice(start, end);
});

const remainingBalance = computed(() => {
  const total = parseFloat(selectedOrder.value?.final_amount || 0);
  const paid = parseFloat(selectedOrder.value?.payment?.amount || 0);
  return total - paid;
});

const createFormSubtotal = computed(() => {
  let subtotal = 0;
  createForm.value.items.forEach(item => {
    const product = products.value.find(p => p.id === parseInt(item.product_id));
    if (product && item.quantity) {
      subtotal += product.unit_price * item.quantity;
    }
  });
  return subtotal;
});

const createFormTotalDiscount = computed(() => {
  let totalDiscount = 0;
  createForm.value.items.forEach(item => {
    const product = products.value.find(p => p.id === parseInt(item.product_id));
    if (product && item.quantity && item.discount) {
      totalDiscount += parseFloat(item.discount);
    }
  });
  return totalDiscount;
});

const createFormTotal = computed(() => {
  return createFormSubtotal.value - createFormTotalDiscount.value;
});

const canCreateOrder = computed(() => {
  return createForm.value.client_id && createForm.value.items.some(item => item.product_id);
});

const formatPrice = (price) => {
  return Number(price).toFixed(2);
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
};

const getStatusText = (status) => {
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

const getPaymentStatusText = (status) => {
  const statusMap = {
    pending: 'Pending',
    partial: 'Partial',
    paid: 'Paid',
    overdue: 'Overdue'
  };
  return statusMap[status] || status;
};

const loadOrders = async () => {
  try {
    const response = await api.get('/orders');
    if (response.success) {
      orders.value = response.orders;
      calculateStats();
    } else {
      orders.value = [
        {
          id: 1,
          order_number: 'ORD-20240301-001',
          client: { company_name: 'Tech Solutions SARL', contact_person: 'Ahmed Ben Ali', user: { email: 'ahmed@techsolutions.tn' }, phone: '+216 71 123 456' },
          order_date: '2024-03-01',
          total_amount: 1299.99,
          discount: 0,
          tax_amount: 0,
          final_amount: 1299.99,
          status: 'pending',
          payment_status: 'pending',
          notes: '',
          items: [{ id: 1, product: { name: 'Gaming Laptop' }, quantity: 1, unit_price: 1299.99, discount: 0, total_price: 1299.99 }]
        },
        {
          id: 2,
          order_number: 'ORD-20240315-002',
          client: { company_name: 'Digital Services', contact_person: 'Sarra Mansour', user: { email: 'sarra@digitalservices.tn' }, phone: '+216 71 789 012' },
          order_date: '2024-03-15',
          total_amount: 899.99,
          discount: 50,
          tax_amount: 0,
          final_amount: 849.99,
          status: 'shipped',
          payment_status: 'paid',
          notes: 'Urgent delivery',
          items: [{ id: 1, product: { name: 'Smartphone Pro' }, quantity: 1, unit_price: 899.99, discount: 50, total_price: 849.99 }],
          payment: { payment_method: 'online', amount: 849.99, payment_date: '2024-03-15', transaction_id: 'TXN123456' }
        }
      ];
      calculateStats();
    }
  } catch (error) {
    console.error('Error loading orders:', error);
  }
};

const loadClients = async () => {
  try {
    const response = await api.get('/employees/clients');
    if (response.success) {
      clients.value = response.clients;
    } else {
      clients.value = [
        { id: 1, company_name: 'Tech Solutions SARL', user: { email: 'ahmed@techsolutions.tn' } },
        { id: 2, company_name: 'Digital Services', user: { email: 'sarra@digitalservices.tn' } }
      ];
    }
  } catch (error) {
    console.error('Error loading clients:', error);
  }
};

const loadProducts = async () => {
  try {
    const response = await api.get('/products');
    if (response.success) {
      products.value = response.products;
    } else {
      products.value = [
        { id: 1, name: 'Smart LED TV 55"', unit_price: 599.99 },
        { id: 2, name: 'Gaming Laptop', unit_price: 1299.99 },
        { id: 3, name: 'Smartphone Pro', unit_price: 899.99 }
      ];
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
};

const calculateStats = () => {
  stats.value.total = orders.value.length;
  stats.value.pending = orders.value.filter(o => o.status === 'pending').length;
  stats.value.processing = orders.value.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).length;
  stats.value.completed = orders.value.filter(o => o.status === 'delivered').length;
  stats.value.revenue = orders.value.reduce((sum, o) => sum + (parseFloat(o.final_amount) || 0), 0);
};

const applyFilters = () => {
  currentPage.value = 1;
};

const viewOrder = (order) => {
  selectedOrder.value = order;
  showViewModal.value = true;
};

const editOrder = (order) => {
  selectedOrder.value = order;
  editForm.value = {
    status: order.status,
    payment_status: order.payment_status,
    discount: order.discount || 0,
    tax_amount: order.tax_amount || 0,
    notes: order.notes || ''
  };
  showEditModal.value = true;
  closeViewModal();
};

const updateOrder = async () => {
  updating.value = true;
  try {
    const response = await api.put(`/orders/${selectedOrder.value.id}`, editForm.value);
    if (response.success) {
      alert('Order updated successfully');
      closeEditModal();
      await loadOrders();
    }
  } catch (error) {
    console.error('Error updating order:', error);
    alert('Failed to update order');
  } finally {
    updating.value = false;
  }
};

const updateStatus = (order) => {
  selectedOrder.value = order;
  statusForm.value = {
    status: order.status,
    notes: ''
  };
  showStatusModal.value = true;
  closeViewModal();
};

const submitStatusUpdate = async () => {
  updating.value = true;
  try {
    const response = await api.put(`/orders/${selectedOrder.value.id}/status`, {
      status: statusForm.value.status,
      notes: statusForm.value.notes
    });
    if (response.success) {
      alert('Order status updated successfully');
      closeStatusModal();
      await loadOrders();
    }
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Failed to update status');
  } finally {
    updating.value = false;
  }
};

const processPayment = (order) => {
  selectedOrder.value = order;
  paymentForm.value = {
    amount: remainingBalance.value,
    method: 'cash',
    reference: '',
    notes: ''
  };
  showPaymentModal.value = true;
  closeViewModal();
};

const submitPayment = async () => {
  if (!paymentForm.value.amount || paymentForm.value.amount <= 0) {
    alert('Please enter a valid payment amount');
    return;
  }
  
  processingPayment.value = true;
  try {
    const response = await api.post('/payments', {
      order_id: selectedOrder.value.id,
      amount: paymentForm.value.amount,
      payment_method: paymentForm.value.method,
      reference_number: paymentForm.value.reference,
      notes: paymentForm.value.notes
    });
    if (response.success) {
      alert('Payment processed successfully');
      closePaymentModal();
      await loadOrders();
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    alert('Failed to process payment');
  } finally {
    processingPayment.value = false;
  }
};

const createOrder = async () => {
  if (!canCreateOrder.value) return;
  
  creating.value = true;
  try {
    const orderData = {
      client_id: createForm.value.client_id,
      items: createForm.value.items.filter(item => item.product_id).map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        discount: item.discount || 0
      })),
      notes: createForm.value.notes,
      total_amount: createFormSubtotal.value,
      discount: createFormTotalDiscount.value,
      final_amount: createFormTotal.value
    };
    
    const response = await api.post('/orders', orderData);
    if (response.success) {
      alert('Order created successfully');
      closeCreateModal();
      await loadOrders();
    }
  } catch (error) {
    console.error('Error creating order:', error);
    alert('Failed to create order');
  } finally {
    creating.value = false;
  }
};

const addItem = () => {
  createForm.value.items.push({ product_id: '', quantity: 1, discount: 0 });
};

const removeItem = (index) => {
  createForm.value.items.splice(index, 1);
};

const closeViewModal = () => {
  showViewModal.value = false;
  selectedOrder.value = null;
};

const closeEditModal = () => {
  showEditModal.value = false;
  selectedOrder.value = null;
  editForm.value = { status: '', payment_status: '', discount: 0, tax_amount: 0, notes: '' };
};

const closeStatusModal = () => {
  showStatusModal.value = false;
  selectedOrder.value = null;
  statusForm.value = { status: '', notes: '' };
};

const closePaymentModal = () => {
  showPaymentModal.value = false;
  selectedOrder.value = null;
  paymentForm.value = { amount: 0, method: 'cash', reference: '', notes: '' };
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  createForm.value = {
    client_id: '',
    items: [{ product_id: '', quantity: 1, discount: 0 }],
    notes: ''
  };
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

onMounted(() => {
  loadOrders();
  loadClients();
  loadProducts();
});
</script>

<style scoped>
.orders-page {
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.order-number {
  font-weight: 600;
  color: #667eea;
  font-family: monospace;
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

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}
.status-badge.confirmed, .status-badge.processing {
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

.payment-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.payment-badge.pending {
  background: #fff3cd;
  color: #856404;
}
.payment-badge.partial {
  background: #cce5ff;
  color: #004085;
}
.payment-badge.paid {
  background: #d4edda;
  color: #155724;
}
.payment-badge.overdue {
  background: #f8d7da;
  color: #721c24;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  max-width: 900px;
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
  margin-bottom: 20px;
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

.order-details {
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

.items-table, .mini-table {
  width: 100%;
  margin-top: 10px;
}

.items-table th, .mini-table th {
  background: #f8f9fa;
  padding: 8px;
  text-align: left;
  font-size: 13px;
}

.items-table td, .mini-table td {
  padding: 8px;
  font-size: 13px;
}

.text-right {
  text-align: right;
}

.text-success {
  color: #28a745;
}

.total {
  font-size: 18px;
  font-weight: bold;
  color: #28a745;
}

.notes-text {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 5px;
  color: #666;
}

.payment-summary {
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
}

.items-editor {
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
}

.item-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.item-product {
  flex: 2;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.item-quantity {
  width: 80px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.item-discount {
  width: 100px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn-add-item {
  margin-top: 10px;
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.order-summary-preview {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
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
  
  .item-row {
    flex-direction: column;
  }
  
  .item-product, .item-quantity, .item-discount {
    width: 100%;
  }
}
</style>