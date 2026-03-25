<template>
  <div class="orders-page">
    <div class="page-header">
      <h1>My Orders</h1>
      <button class="btn-new-order" @click="showNewOrderModal = true">+ New Order</button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="statusFilter" class="filter-select">
        <option value="">All Orders</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="processing">Processing</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>
      
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Search by order #..." 
        class="search-input"
      />
    </div>

    <!-- Orders Table -->
    <div class="orders-table">
      <table v-if="filteredOrders.length > 0">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Payment Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in paginatedOrders" :key="order.id">
            <td class="order-number">{{ order.order_number }}</td>
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
            <td>
              <button @click="viewOrder(order.id)" class="btn-view">View</button>
              <button 
                v-if="order.status === 'pending'" 
                @click="cancelOrder(order.id)" 
                class="btn-cancel"
              >
                Cancel
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <p>No orders found</p>
        <button @click="showNewOrderModal = true" class="btn-primary">Place Your First Order</button>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">Previous</button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">Next</button>
    </div>

    <!-- New Order Modal -->
    <div v-if="showNewOrderModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Place New Order</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Product</label>
            <select v-model="newOrder.product_id" class="form-control">
              <option value="">Select a product</option>
              <option v-for="product in products" :key="product.id" :value="product.id">
                {{ product.name }} - ${{ formatPrice(product.unit_price) }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Quantity</label>
            <input 
              type="number" 
              v-model="newOrder.quantity" 
              min="1" 
              class="form-control"
            />
          </div>
          
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="newOrder.notes" rows="3" class="form-control"></textarea>
          </div>
          
          <div class="order-summary" v-if="selectedProduct">
            <h3>Order Summary</h3>
            <div class="summary-row">
              <span>Product:</span>
              <strong>{{ selectedProduct.name }}</strong>
            </div>
            <div class="summary-row">
              <span>Unit Price:</span>
              <strong>${{ formatPrice(selectedProduct.unit_price) }}</strong>
            </div>
            <div class="summary-row">
              <span>Quantity:</span>
              <strong>{{ newOrder.quantity }}</strong>
            </div>
            <div class="summary-row total">
              <span>Total:</span>
              <strong>${{ formatPrice(totalAmount) }}</strong>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">Cancel</button>
          <button @click="submitOrder" class="btn-primary" :disabled="!canSubmit">Place Order</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../../api';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const orders = ref([]);
const products = ref([]);
const statusFilter = ref('');
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showNewOrderModal = ref(false);

const newOrder = ref({
  product_id: '',
  quantity: 1,
  notes: ''
});

const filteredOrders = computed(() => {
  let filtered = orders.value;
  
  if (statusFilter.value) {
    filtered = filtered.filter(order => order.status === statusFilter.value);
  }
  
  if (searchQuery.value) {
    filtered = filtered.filter(order => 
      order.order_number.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
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

const selectedProduct = computed(() => {
  return products.value.find(p => p.id === parseInt(newOrder.value.product_id));
});

const totalAmount = computed(() => {
  if (selectedProduct.value && newOrder.value.quantity) {
    return selectedProduct.value.unit_price * newOrder.value.quantity;
  }
  return 0;
});

const canSubmit = computed(() => {
  return newOrder.value.product_id && newOrder.value.quantity > 0;
});

const formatPrice = (price) => {
  return Number(price).toFixed(2);
};

const formatDate = (date) => {
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
    const response = await api.get('/clients/orders');
    if (response.success) {
      orders.value = response.orders;
    }
  } catch (error) {
    console.error('Error loading orders:', error);
  }
};

const loadProducts = async () => {
  try {
    const response = await api.get('/products');
    if (response.success) {
      products.value = response.products;
    } else {
      // Demo products if API not ready
      products.value = [
        { id: 1, name: 'Smart LED TV 55"', unit_price: 599.99 },
        { id: 2, name: 'Gaming Laptop', unit_price: 1299.99 },
        { id: 3, name: 'Smartphone Pro', unit_price: 899.99 }
      ];
    }
  } catch (error) {
    console.error('Error loading products:', error);
    // Fallback demo products
    products.value = [
      { id: 1, name: 'Smart LED TV 55"', unit_price: 599.99 },
      { id: 2, name: 'Gaming Laptop', unit_price: 1299.99 },
      { id: 3, name: 'Smartphone Pro', unit_price: 899.99 }
    ];
  }
};

const viewOrder = (orderId) => {
  router.push(`/client/orders/${orderId}`);
};

const cancelOrder = async (orderId) => {
  if (confirm('Are you sure you want to cancel this order?')) {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`);
      if (response.success) {
        await loadOrders();
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  }
};

const submitOrder = async () => {
  try {
    const orderData = {
      product_id: newOrder.value.product_id,
      quantity: newOrder.value.quantity,
      notes: newOrder.value.notes,
      total_amount: totalAmount.value,
      final_amount: totalAmount.value
    };
    
    const response = await api.post('/orders', orderData);
    if (response.success) {
      alert('Order placed successfully!');
      closeModal();
      await loadOrders();
    }
  } catch (error) {
    console.error('Error placing order:', error);
    alert('Failed to place order');
  }
};

const closeModal = () => {
  showNewOrderModal.value = false;
  newOrder.value = {
    product_id: '',
    quantity: 1,
    notes: ''
  };
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
  loadOrders();
  loadProducts();
});
</script>

<style scoped>
.orders-page {
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

.btn-new-order {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.2s;
}

.btn-new-order:hover {
  transform: translateY(-2px);
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
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

.orders-table {
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
  padding: 15px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
}

.order-number {
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

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.confirmed,
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

.btn-view {
  padding: 5px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 5px;
}

.btn-cancel {
  padding: 5px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px;
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
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

.order-summary {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-top: 20px;
}

.order-summary h3 {
  margin-bottom: 10px;
  font-size: 16px;
  color: #333;
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
  font-weight: bold;
  font-size: 16px;
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
  
  td, th {
    padding: 10px;
    font-size: 12px;
  }
  
  .btn-view, .btn-cancel {
    padding: 3px 8px;
    font-size: 10px;
  }
}
</style>