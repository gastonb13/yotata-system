<template>
  <div class="order-detail-page" v-if="order">
    <div class="page-header">
      <button @click="goBack" class="btn-back">← Back to Orders</button>
      <h1>Order #{{ order.order_number }}</h1>
    </div>

    <div class="order-status">
      <div class="status-tracker">
        <div class="status-step" :class="{ active: isStatusCompleted('pending') }">
          <div class="step-icon">1</div>
          <div class="step-label">Order Placed</div>
        </div>
        <div class="status-line" :class="{ active: isStatusCompleted('confirmed') }"></div>
        <div class="status-step" :class="{ active: isStatusCompleted('confirmed') }">
          <div class="step-icon">2</div>
          <div class="step-label">Confirmed</div>
        </div>
        <div class="status-line" :class="{ active: isStatusCompleted('processing') }"></div>
        <div class="status-step" :class="{ active: isStatusCompleted('processing') }">
          <div class="step-icon">3</div>
          <div class="step-label">Processing</div>
        </div>
        <div class="status-line" :class="{ active: isStatusCompleted('shipped') }"></div>
        <div class="status-step" :class="{ active: isStatusCompleted('shipped') }">
          <div class="step-icon">4</div>
          <div class="step-label">Shipped</div>
        </div>
        <div class="status-line" :class="{ active: isStatusCompleted('delivered') }"></div>
        <div class="status-step" :class="{ active: isStatusCompleted('delivered') }">
          <div class="step-icon">5</div>
          <div class="step-label">Delivered</div>
        </div>
      </div>
    </div>

    <div class="order-info-grid">
      <div class="info-card">
        <h3>Order Information</h3>
        <div class="info-row">
          <span class="label">Order Date:</span>
          <span class="value">{{ formatDate(order.order_date) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Status:</span>
          <span :class="['status-badge', order.status]">{{ getStatusText(order.status) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Payment Status:</span>
          <span :class="['payment-badge', order.payment_status]">{{ getPaymentStatusText(order.payment_status) }}</span>
        </div>
        <div class="info-row" v-if="order.notes">
          <span class="label">Notes:</span>
          <span class="value">{{ order.notes }}</span>
        </div>
      </div>

      <div class="info-card">
        <h3>Shipping Information</h3>
        <div class="info-row">
          <span class="label">Address:</span>
          <span class="value">{{ order.shipping_address || 'Not provided' }}</span>
        </div>
      </div>

      <div class="info-card">
        <h3>Order Summary</h3>
        <div class="info-row">
          <span class="label">Subtotal:</span>
          <span class="value">${{ formatPrice(order.total_amount) }}</span>
        </div>
        <div class="info-row" v-if="order.discount > 0">
          <span class="label">Discount:</span>
          <span class="value text-success">-${{ formatPrice(order.discount) }}</span>
        </div>
        <div class="info-row" v-if="order.tax_amount > 0">
          <span class="label">Tax:</span>
          <span class="value">${{ formatPrice(order.tax_amount) }}</span>
        </div>
        <div class="info-row total">
          <span class="label">Total:</span>
          <span class="value">${{ formatPrice(order.final_amount) }}</span>
        </div>
      </div>
    </div>

    <div class="actions" v-if="order.status === 'pending'">
      <button @click="cancelOrder" class="btn-cancel-order">Cancel Order</button>
    </div>
  </div>

  <div v-else class="loading">
    <div class="spinner"></div>
    <p>Loading order details...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../../api';

const route = useRoute();
const router = useRouter();
const order = ref(null);

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

const isStatusCompleted = (status) => {
  const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentIndex = statusOrder.indexOf(order.value?.status);
  const statusIndex = statusOrder.indexOf(status);
  return currentIndex >= statusIndex;
};

const loadOrder = async () => {
  try {
    const orderId = route.params.id;
    const response = await api.get(`/clients/orders/${orderId}`);
    if (response.success) {
      order.value = response.order;
    } else {
      alert('Order not found');
      router.push('/client/orders');
    }
  } catch (error) {
    console.error('Error loading order:', error);
    alert('Failed to load order details');
    router.push('/client/orders');
  }
};

const cancelOrder = async () => {
  if (confirm('Are you sure you want to cancel this order?')) {
    try {
      const response = await api.post(`/orders/${order.value.id}/cancel`);
      if (response.success) {
        alert('Order cancelled successfully');
        await loadOrder();
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  }
};

const goBack = () => {
  router.push('/client/orders');
};

onMounted(() => {
  loadOrder();
});
</script>

<style scoped>
.order-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.btn-back {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 15px;
  padding: 0;
}

.btn-back:hover {
  text-decoration: underline;
}

.page-header h1 {
  font-size: 28px;
  color: #333;
}

.order-status {
  background: white;
  border-radius: 10px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.status-tracker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.status-step {
  text-align: center;
  flex: 1;
  position: relative;
}

.step-icon {
  width: 40px;
  height: 40px;
  background: #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  font-weight: bold;
  color: #6c757d;
  transition: all 0.3s;
}

.status-step.active .step-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.step-label {
  font-size: 12px;
  color: #6c757d;
}

.status-step.active .step-label {
  color: #667eea;
  font-weight: 500;
}

.status-line {
  flex: 1;
  height: 2px;
  background: #e9ecef;
  margin: 0 10px;
}

.status-line.active {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.order-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.info-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.info-card h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row .label {
  color: #6c757d;
  font-weight: 500;
}

.info-row .value {
  color: #333;
}

.info-row.total {
  border-top: 2px solid #e9ecef;
  margin-top: 8px;
  padding-top: 12px;
  font-weight: bold;
  font-size: 16px;
}

.text-success {
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

.payment-badge.paid {
  background: #d4edda;
  color: #155724;
}

.actions {
  text-align: center;
}

.btn-cancel-order {
  padding: 12px 30px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-cancel-order:hover {
  background: #c82333;
}

.loading {
  text-align: center;
  padding: 60px;
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .status-tracker {
    flex-direction: column;
    gap: 15px;
  }
  
  .status-line {
    width: 2px;
    height: 30px;
    margin: 5px 0;
  }
  
  .status-step {
    width: 100%;
  }
  
  .order-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>