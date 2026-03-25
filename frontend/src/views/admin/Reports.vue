<template>
  <div class="reports-page">
    <div class="page-header">
      <h1>Reports & Analytics</h1>
    </div>

    <!-- Report Type Tabs -->
    <div class="report-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.name }}
      </button>
    </div>

    <!-- Sales Report -->
    <div v-if="activeTab === 'sales'" class="report-content">
      <div class="report-header">
        <h2>Sales Report</h2>
        <div class="report-actions">
          <div class="date-range">
            <input type="date" v-model="salesDateRange.start" />
            <span>to</span>
            <input type="date" v-model="salesDateRange.end" />
          </div>
          <button @click="generateSalesReport" class="btn-primary">Generate Report</button>
          <button @click="exportSalesReport" class="btn-secondary">Export CSV</button>
        </div>
      </div>

      <!-- Sales Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <h3>Total Revenue</h3>
            <p class="stat-value">${{ formatPrice(salesStats.totalRevenue) }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <h3>Total Orders</h3>
            <p class="stat-value">{{ salesStats.totalOrders }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <h3>Unique Customers</h3>
            <p class="stat-value">{{ salesStats.uniqueCustomers }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <h3>Average Order Value</h3>
            <p class="stat-value">${{ formatPrice(salesStats.averageOrderValue) }}</p>
          </div>
        </div>
      </div>

      <!-- Sales Chart -->
      <div class="chart-card">
        <h3>Revenue Trend</h3>
        <canvas ref="salesChart"></canvas>
      </div>

      <!-- Top Products -->
      <div class="data-table">
        <h3>Top Selling Products</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Units Sold</th>
              <th>Revenue</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in topProducts" :key="product.id">
              <td>{{ product.name }}</td>
              <td>{{ product.units_sold }}</td>
              <td>${{ formatPrice(product.revenue) }}</td>
              <td>{{ product.percentage }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Financial Report -->
    <div v-if="activeTab === 'financial'" class="report-content">
      <div class="report-header">
        <h2>Financial Report</h2>
        <div class="report-actions">
          <div class="date-range">
            <input type="date" v-model="financialDateRange.start" />
            <span>to</span>
            <input type="date" v-model="financialDateRange.end" />
          </div>
          <button @click="generateFinancialReport" class="btn-primary">Generate Report</button>
          <button @click="exportFinancialReport" class="btn-secondary">Export CSV</button>
        </div>
      </div>

      <!-- Financial Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💵</div>
          <div class="stat-info">
            <h3>Total Income</h3>
            <p class="stat-value">${{ formatPrice(financialStats.totalIncome) }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💸</div>
          <div class="stat-info">
            <h3>Total Expenses</h3>
            <p class="stat-value">${{ formatPrice(financialStats.totalExpenses) }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-info">
            <h3>Net Profit</h3>
            <p class="stat-value" :class="financialStats.netProfit >= 0 ? 'text-success' : 'text-danger'">
              ${{ formatPrice(financialStats.netProfit) }}
            </p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <h3>Profit Margin</h3>
            <p class="stat-value">{{ financialStats.profitMargin }}%</p>
          </div>
        </div>
      </div>

      <!-- Income vs Expenses Chart -->
      <div class="chart-card">
        <h3>Income vs Expenses</h3>
        <canvas ref="financialChart"></canvas>
      </div>

      <!-- Expense Breakdown -->
      <div class="data-table">
        <h3>Expense Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="expense in expenseBreakdown" :key="expense.category">
              <td>{{ expense.category }}</td>
              <td>${{ formatPrice(expense.amount) }}</td>
              <td>{{ expense.percentage }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Inventory Report -->
    <div v-if="activeTab === 'inventory'" class="report-content">
      <div class="report-header">
        <h2>Inventory Report</h2>
        <div class="report-actions">
          <button @click="generateInventoryReport" class="btn-primary">Generate Report</button>
          <button @click="exportInventoryReport" class="btn-secondary">Export CSV</button>
        </div>
      </div>

      <!-- Inventory Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <h3>Total Products</h3>
            <p class="stat-value">{{ inventoryStats.totalProducts }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚠️</div>
          <div class="stat-info">
            <h3>Low Stock Items</h3>
            <p class="stat-value text-warning">{{ inventoryStats.lowStock }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">❌</div>
          <div class="stat-info">
            <h3>Out of Stock</h3>
            <p class="stat-value text-danger">{{ inventoryStats.outOfStock }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <h3>Inventory Value</h3>
            <p class="stat-value">${{ formatPrice(inventoryStats.totalValue) }}</p>
          </div>
        </div>
      </div>

      <!-- Low Stock Alert -->
      <div class="alert-card" v-if="inventoryStats.lowStock > 0">
        <h3>⚠️ Low Stock Alert</h3>
        <p>{{ inventoryStats.lowStock }} products are below minimum stock level. Please reorder soon!</p>
      </div>

      <!-- Inventory Table -->
      <div class="data-table">
        <h3>Current Inventory Status</h3>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Min Stock</th>
              <th>Status</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in inventoryList" :key="product.id">
              <td>{{ product.sku }}</td>
              <td>{{ product.name }}</td>
              <td>{{ product.category || '-' }}</td>
              <td :class="getStockClass(product)">{{ product.stock_quantity }}</td>
              <td>{{ product.min_stock_level || '-' }}</td>
              <td>
                <span :class="['status-badge', getStockStatus(product)]">
                  {{ getStockStatusText(product) }}
                </span>
              </td>
              <td>${{ formatPrice(product.stock_quantity * product.unit_price) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Customer Report -->
    <div v-if="activeTab === 'customer'" class="report-content">
      <div class="report-header">
        <h2>Customer Report</h2>
        <div class="report-actions">
          <div class="date-range">
            <input type="date" v-model="customerDateRange.start" />
            <span>to</span>
            <input type="date" v-model="customerDateRange.end" />
          </div>
          <button @click="generateCustomerReport" class="btn-primary">Generate Report</button>
          <button @click="exportCustomerReport" class="btn-secondary">Export CSV</button>
        </div>
      </div>

      <!-- Customer Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <h3>Total Customers</h3>
            <p class="stat-value">{{ customerStats.totalCustomers }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🆕</div>
          <div class="stat-info">
            <h3>New Customers</h3>
            <p class="stat-value">{{ customerStats.newCustomers }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-info">
            <h3>Active Customers</h3>
            <p class="stat-value">{{ customerStats.activeCustomers }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <h3>Avg Order per Customer</h3>
            <p class="stat-value">{{ customerStats.avgOrdersPerCustomer }}</p>
          </div>
        </div>
      </div>

      <!-- Top Customers -->
      <div class="data-table">
        <h3>Top Customers by Spending</h3>
        <table>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Contact Person</th>
              <th>Total Orders</th>
              <th>Total Spent</th>
              <th>Average Order</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in topCustomers" :key="customer.id">
              <td><strong>{{ customer.company_name }}</strong></td>
              <td>{{ customer.contact_person || '-' }}</td>
              <td>{{ customer.total_orders }}</td>
              <td class="amount">${{ formatPrice(customer.total_spent) }}</td>
              <td>${{ formatPrice(customer.average_order) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Generating report...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Chart, registerables } from 'chart.js';
import { api } from '../../api';

Chart.register(...registerables);

const activeTab = ref('sales');
const loading = ref(false);

const tabs = [
  { id: 'sales', name: 'Sales Report', icon: '📊' },
  { id: 'financial', name: 'Financial Report', icon: '💰' },
  { id: 'inventory', name: 'Inventory Report', icon: '📦' },
  { id: 'customer', name: 'Customer Report', icon: '👥' }
];

// Sales Report Data
const salesDateRange = ref({
  start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
});
const salesStats = ref({
  totalRevenue: 0,
  totalOrders: 0,
  uniqueCustomers: 0,
  averageOrderValue: 0
});
const topProducts = ref([]);
let salesChart = null;

// Financial Report Data
const financialDateRange = ref({
  start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
});
const financialStats = ref({
  totalIncome: 0,
  totalExpenses: 0,
  netProfit: 0,
  profitMargin: 0
});
const expenseBreakdown = ref([]);
let financialChart = null;

// Inventory Report Data
const inventoryStats = ref({
  totalProducts: 0,
  lowStock: 0,
  outOfStock: 0,
  totalValue: 0
});
const inventoryList = ref([]);

// Customer Report Data
const customerDateRange = ref({
  start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
});
const customerStats = ref({
  totalCustomers: 0,
  newCustomers: 0,
  activeCustomers: 0,
  avgOrdersPerCustomer: 0
});
const topCustomers = ref([]);

const formatPrice = (price) => {
  return Number(price).toFixed(2);
};

const getStockClass = (product) => {
  if (product.stock_quantity === 0) return 'text-danger';
  if (product.stock_quantity <= (product.min_stock_level || 5)) return 'text-warning';
  return '';
};

const getStockStatus = (product) => {
  if (product.stock_quantity === 0) return 'out';
  if (product.stock_quantity <= (product.min_stock_level || 5)) return 'low';
  return 'in';
};

const getStockStatusText = (product) => {
  if (product.stock_quantity === 0) return 'Out of Stock';
  if (product.stock_quantity <= (product.min_stock_level || 5)) return 'Low Stock';
  return 'In Stock';
};

// Generate Sales Report
const generateSalesReport = async () => {
  loading.value = true;
  try {
    const response = await api.get('/reports/sales', {
      params: {
        start_date: salesDateRange.value.start,
        end_date: salesDateRange.value.end
      }
    });
    
    if (response.success) {
      salesStats.value = response.stats;
      topProducts.value = response.topProducts;
      updateSalesChart(response.chartData);
    } else {
      // Demo data
      salesStats.value = {
        totalRevenue: 28450.50,
        totalOrders: 156,
        uniqueCustomers: 89,
        averageOrderValue: 182.38
      };
      topProducts.value = [
        { id: 1, name: 'Smart LED TV 55"', units_sold: 45, revenue: 26999.55, percentage: 35 },
        { id: 2, name: 'Gaming Laptop', units_sold: 28, revenue: 36399.72, percentage: 28 },
        { id: 3, name: 'Smartphone Pro', units_sold: 52, revenue: 46799.48, percentage: 22 },
        { id: 4, name: 'Wireless Headphones', units_sold: 120, revenue: 11988.00, percentage: 15 }
      ];
      updateSalesChart({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [4200, 3850, 5200, 4800, 6100, 5800]
      });
    }
  } catch (error) {
    console.error('Error generating sales report:', error);
  } finally {
    loading.value = false;
  }
};

const updateSalesChart = (data) => {
  const ctx = document.getElementById('salesChart')?.getContext('2d');
  if (!ctx) return;
  
  if (salesChart) salesChart.destroy();
  
  salesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Revenue',
        data: data.values,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => '$' + value.toLocaleString()
          }
        }
      }
    }
  });
};

// Generate Financial Report
const generateFinancialReport = async () => {
  loading.value = true;
  try {
    const response = await api.get('/reports/financial', {
      params: {
        start_date: financialDateRange.value.start,
        end_date: financialDateRange.value.end
      }
    });
    
    if (response.success) {
      financialStats.value = response.stats;
      expenseBreakdown.value = response.expenseBreakdown;
      updateFinancialChart(response.chartData);
    } else {
      // Demo data
      financialStats.value = {
        totalIncome: 28450.50,
        totalExpenses: 18450.50,
        netProfit: 10000.00,
        profitMargin: 35.2
      };
      expenseBreakdown.value = [
        { category: 'Salaries', amount: 12000, percentage: 65 },
        { category: 'Rent', amount: 3000, percentage: 16.3 },
        { category: 'Utilities', amount: 800, percentage: 4.3 },
        { category: 'Marketing', amount: 1500, percentage: 8.1 },
        { category: 'Other', amount: 1150.50, percentage: 6.3 }
      ];
      updateFinancialChart({
        labels: ['Income', 'Expenses'],
        values: [28450.50, 18450.50]
      });
    }
  } catch (error) {
    console.error('Error generating financial report:', error);
  } finally {
    loading.value = false;
  }
};

const updateFinancialChart = (data) => {
  const ctx = document.getElementById('financialChart')?.getContext('2d');
  if (!ctx) return;
  
  if (financialChart) financialChart.destroy();
  
  financialChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Amount',
        data: data.values,
        backgroundColor: ['#28a745', '#dc3545'],
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => '$' + value.toLocaleString()
          }
        }
      }
    }
  });
};

// Generate Inventory Report
const generateInventoryReport = async () => {
  loading.value = true;
  try {
    const response = await api.get('/reports/inventory');
    if (response.success) {
      inventoryStats.value = response.stats;
      inventoryList.value = response.products;
    } else {
      // Demo data
      inventoryStats.value = {
        totalProducts: 48,
        lowStock: 8,
        outOfStock: 3,
        totalValue: 125000
      };
      inventoryList.value = [
        { id: 1, sku: 'TV-001', name: 'Smart LED TV 55"', category: 'Electronics', stock_quantity: 50, min_stock_level: 10, unit_price: 599.99 },
        { id: 2, sku: 'LAP-001', name: 'Gaming Laptop', category: 'Computers', stock_quantity: 30, min_stock_level: 5, unit_price: 1299.99 },
        { id: 3, sku: 'PH-001', name: 'Smartphone Pro', category: 'Mobile', stock_quantity: 100, min_stock_level: 20, unit_price: 899.99 },
        { id: 4, sku: 'HDD-001', name: 'External Hard Drive', category: 'Accessories', stock_quantity: 3, min_stock_level: 10, unit_price: 89.99 }
      ];
    }
  } catch (error) {
    console.error('Error generating inventory report:', error);
  } finally {
    loading.value = false;
  }
};

// Generate Customer Report
const generateCustomerReport = async () => {
  loading.value = true;
  try {
    const response = await api.get('/reports/customers', {
      params: {
        start_date: customerDateRange.value.start,
        end_date: customerDateRange.value.end
      }
    });
    
    if (response.success) {
      customerStats.value = response.stats;
      topCustomers.value = response.topCustomers;
    } else {
      // Demo data
      customerStats.value = {
        totalCustomers: 156,
        newCustomers: 23,
        activeCustomers: 89,
        avgOrdersPerCustomer: 2.4
      };
      topCustomers.value = [
        { id: 1, company_name: 'Tech Solutions SARL', contact_person: 'Ahmed Ben Ali', total_orders: 12, total_spent: 28500, average_order: 2375 },
        { id: 2, company_name: 'Digital Services', contact_person: 'Sarra Mansour', total_orders: 8, total_spent: 12450, average_order: 1556.25 },
        { id: 3, company_name: 'Innovation Hub', contact_person: 'Mohamed Said', total_orders: 5, total_spent: 8500, average_order: 1700 }
      ];
    }
  } catch (error) {
    console.error('Error generating customer report:', error);
  } finally {
    loading.value = false;
  }
};

// Export Functions
const exportSalesReport = () => {
  const csvData = [
    ['Sales Report', `Period: ${salesDateRange.value.start} to ${salesDateRange.value.end}`],
    [],
    ['Metric', 'Value'],
    ['Total Revenue', `$${salesStats.value.totalRevenue}`],
    ['Total Orders', salesStats.value.totalOrders],
    ['Unique Customers', salesStats.value.uniqueCustomers],
    ['Average Order Value', `$${salesStats.value.averageOrderValue}`],
    [],
    ['Top Products'],
    ['Product', 'Units Sold', 'Revenue', 'Percentage']
  ];
  
  topProducts.value.forEach(p => {
    csvData.push([p.name, p.units_sold, `$${p.revenue}`, `${p.percentage}%`]);
  });
  
  downloadCSV(csvData, 'sales_report.csv');
};

const exportFinancialReport = () => {
  const csvData = [
    ['Financial Report', `Period: ${financialDateRange.value.start} to ${financialDateRange.value.end}`],
    [],
    ['Metric', 'Value'],
    ['Total Income', `$${financialStats.value.totalIncome}`],
    ['Total Expenses', `$${financialStats.value.totalExpenses}`],
    ['Net Profit', `$${financialStats.value.netProfit}`],
    ['Profit Margin', `${financialStats.value.profitMargin}%`],
    [],
    ['Expense Breakdown'],
    ['Category', 'Amount', 'Percentage']
  ];
  
  expenseBreakdown.value.forEach(e => {
    csvData.push([e.category, `$${e.amount}`, `${e.percentage}%`]);
  });
  
  downloadCSV(csvData, 'financial_report.csv');
};

const exportInventoryReport = () => {
  const csvData = [
    ['Inventory Report', new Date().toLocaleDateString()],
    [],
    ['Metric', 'Value'],
    ['Total Products', inventoryStats.value.totalProducts],
    ['Low Stock Items', inventoryStats.value.lowStock],
    ['Out of Stock', inventoryStats.value.outOfStock],
    ['Inventory Value', `$${inventoryStats.value.totalValue}`],
    [],
    ['Inventory List'],
    ['SKU', 'Product Name', 'Category', 'Current Stock', 'Min Stock', 'Status', 'Value']
  ];
  
  inventoryList.value.forEach(p => {
    csvData.push([
      p.sku, p.name, p.category || '-', p.stock_quantity,
      p.min_stock_level || '-', getStockStatusText(p),
      `$${p.stock_quantity * p.unit_price}`
    ]);
  });
  
  downloadCSV(csvData, 'inventory_report.csv');
};

const exportCustomerReport = () => {
  const csvData = [
    ['Customer Report', `Period: ${customerDateRange.value.start} to ${customerDateRange.value.end}`],
    [],
    ['Metric', 'Value'],
    ['Total Customers', customerStats.value.totalCustomers],
    ['New Customers', customerStats.value.newCustomers],
    ['Active Customers', customerStats.value.activeCustomers],
    ['Avg Orders per Customer', customerStats.value.avgOrdersPerCustomer],
    [],
    ['Top Customers'],
    ['Company Name', 'Contact Person', 'Total Orders', 'Total Spent', 'Average Order']
  ];
  
  topCustomers.value.forEach(c => {
    csvData.push([
      c.company_name, c.contact_person || '-', c.total_orders,
      `$${c.total_spent}`, `$${c.average_order}`
    ]);
  });
  
  downloadCSV(csvData, 'customer_report.csv');
};

const downloadCSV = (data, filename) => {
  const csvContent = data.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Initial load
onMounted(() => {
  generateSalesReport();
});

// Cleanup charts
onUnmounted(() => {
  if (salesChart) salesChart.destroy();
  if (financialChart) financialChart.destroy();
});
</script>

<style scoped>
.reports-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #333;
}

.report-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid #e9ecef;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 12px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover {
  color: #667eea;
}

.tab-btn.active {
  color: #667eea;
  border-bottom: 2px solid #667eea;
  margin-bottom: -2px;
}

.tab-icon {
  font-size: 18px;
}

.report-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.report-header h2 {
  font-size: 20px;
  color: #333;
}

.report-actions {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.date-range {
  display: flex;
  gap: 10px;
  align-items: center;
}

.date-range input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
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

.chart-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.chart-card h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: #333;
}

.chart-card canvas {
  max-height: 300px;
}

.data-table {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  overflow-x: auto;
}

.data-table h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: #333;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
}

.alert-card {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
}

.alert-card h3 {
  color: #856404;
  margin-bottom: 10px;
}

.alert-card p {
  color: #856404;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.in {
  background: #d4edda;
  color: #155724;
}

.status-badge.low {
  background: #fff3cd;
  color: #856404;
}

.status-badge.out {
  background: #f8d7da;
  color: #721c24;
}

.text-success {
  color: #28a745 !important;
}

.text-danger {
  color: #dc3545 !important;
}

.text-warning {
  color: #ffc107 !important;
}

.amount {
  font-weight: 600;
  color: #28a745;
}

.btn-primary {
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.btn-secondary {
  padding: 8px 20px;
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

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.spinner {
  width: 50px;
  height: 50px;
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

.loading-overlay p {
  color: white;
  font-size: 16px;
}

@media (max-width: 768px) {
  .report-tabs {
    flex-direction: column;
    border-bottom: none;
  }
  
  .tab-btn {
    justify-content: center;
    border-radius: 5px;
  }
  
  .tab-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-bottom: none;
  }
  
  .report-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .report-actions {
    flex-direction: column;
  }
  
  .date-range {
    flex-direction: column;
    width: 100%;
  }
  
  .date-range input {
    width: 100%;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .btn-primary, .btn-secondary {
    width: 100%;
  }
}
</style>