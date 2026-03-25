<template>
  <div class="products-page">
    <div class="page-header">
      <h1>Products Management</h1>
      <button class="btn-primary" @click="showCreateModal = true">+ Add New Product</button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🛍️</div>
        <div class="stat-info">
          <h3>Total Products</h3>
          <p class="stat-value">{{ stats.total }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <h3>Active Products</h3>
          <p class="stat-value">{{ stats.active }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <h3>Low Stock Items</h3>
          <p class="stat-value">{{ stats.lowStock }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <h3>Total Value</h3>
          <p class="stat-value">${{ formatPrice(stats.totalValue) }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Search by name, SKU, category..." 
        class="search-input"
      />
      <select v-model="categoryFilter" class="filter-select">
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <select v-model="statusFilter" class="filter-select">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="discontinued">Discontinued</option>
      </select>
      <select v-model="stockFilter" class="filter-select">
        <option value="">All Stock</option>
        <option value="low">Low Stock</option>
        <option value="out">Out of Stock</option>
        <option value="in">In Stock</option>
      </select>
    </div>

    <!-- Products Grid -->
    <div class="products-grid">
      <div v-for="product in paginatedProducts" :key="product.id" class="product-card">
        <div class="product-image">
          <img v-if="product.image_url" :src="product.image_url" :alt="product.name" />
          <div v-else class="image-placeholder">
            <span>📦</span>
          </div>
          <div class="stock-badge" :class="getStockClass(product)">
            {{ getStockText(product) }}
          </div>
        </div>
        <div class="product-info">
          <h3 class="product-name">{{ product.name }}</h3>
          <p class="product-sku">SKU: {{ product.sku }}</p>
          <p class="product-category">{{ product.category || 'Uncategorized' }}</p>
          <div class="product-price">
            <span class="price">${{ formatPrice(product.unit_price) }}</span>
            <span class="cost" v-if="product.cost_price">Cost: ${{ formatPrice(product.cost_price) }}</span>
          </div>
          <div class="product-stock">
            <span>Stock: {{ product.stock_quantity }} {{ product.unit }}</span>
            <span v-if="product.min_stock_level" class="min-stock">Min: {{ product.min_stock_level }}</span>
          </div>
          <div class="product-status">
            <span :class="['status-badge', product.status]">
              {{ getStatusText(product.status) }}
            </span>
          </div>
        </div>
        <div class="product-actions">
          <button @click="viewProduct(product)" class="btn-icon" title="View">👁️</button>
          <button @click="editProduct(product)" class="btn-icon" title="Edit">✏️</button>
          <button @click="adjustStock(product)" class="btn-icon" title="Adjust Stock">📦</button>
          <button @click="toggleProductStatus(product)" class="btn-icon" :title="product.status === 'active' ? 'Deactivate' : 'Activate'">
            {{ product.status === 'active' ? '🔴' : '🟢' }}
          </button>
        </div>
      </div>
      
      <div v-if="filteredProducts.length === 0" class="empty-state">
        <p>No products found</p>
        <button @click="showCreateModal = true" class="btn-primary">Add Your First Product</button>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">Previous</button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">Next</button>
    </div>

    <!-- Create/Edit Product Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>{{ showEditModal ? 'Edit Product' : 'Add New Product' }}</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveProduct">
            <div class="form-row">
              <div class="form-group">
                <label>SKU *</label>
                <input type="text" v-model="form.sku" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Product Name *</label>
                <input type="text" v-model="form.name" class="form-control" required />
              </div>
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea v-model="form.description" rows="3" class="form-control"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Category</label>
                <input type="text" v-model="form.category" class="form-control" list="categories" />
                <datalist id="categories">
                  <option v-for="cat in allCategories" :key="cat" :value="cat"></option>
                </datalist>
              </div>
              <div class="form-group">
                <label>Brand</label>
                <input type="text" v-model="form.brand" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Unit Price *</label>
                <input type="number" v-model="form.unit_price" class="form-control" step="0.01" required />
              </div>
              <div class="form-group">
                <label>Cost Price</label>
                <input type="number" v-model="form.cost_price" class="form-control" step="0.01" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Stock Quantity</label>
                <input type="number" v-model="form.stock_quantity" class="form-control" />
              </div>
              <div class="form-group">
                <label>Unit</label>
                <select v-model="form.unit" class="form-control">
                  <option value="piece">Piece</option>
                  <option value="box">Box</option>
                  <option value="set">Set</option>
                  <option value="kg">KG</option>
                  <option value="liter">Liter</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Min Stock Level</label>
                <input type="number" v-model="form.min_stock_level" class="form-control" />
              </div>
              <div class="form-group">
                <label>Max Stock Level</label>
                <input type="number" v-model="form.max_stock_level" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Weight (kg)</label>
                <input type="number" v-model="form.weight" class="form-control" step="0.01" />
              </div>
              <div class="form-group">
                <label>Dimensions</label>
                <input type="text" v-model="form.dimensions" class="form-control" placeholder="L x W x H" />
              </div>
            </div>

            <div class="form-group">
              <label>Image URL</label>
              <input type="url" v-model="form.image_url" class="form-control" placeholder="https://..." />
            </div>

            <div class="form-group">
              <label>Status</label>
              <select v-model="form.status" class="form-control">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>

            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="form.notes" rows="2" class="form-control"></textarea>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeModal" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : (showEditModal ? 'Update Product' : 'Create Product') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View Product Modal -->
    <div v-if="showViewModal && selectedProduct" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Product Details</h2>
          <button @click="closeViewModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="product-details">
            <div class="detail-image">
              <img v-if="selectedProduct.image_url" :src="selectedProduct.image_url" :alt="selectedProduct.name" />
              <div v-else class="image-placeholder-large">
                <span>📦</span>
              </div>
            </div>
            
            <div class="detail-info">
              <div class="detail-section">
                <h3>Basic Information</h3>
                <div class="detail-row">
                  <span class="detail-label">SKU:</span>
                  <span class="detail-value">{{ selectedProduct.sku }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Name:</span>
                  <span class="detail-value">{{ selectedProduct.name }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Category:</span>
                  <span class="detail-value">{{ selectedProduct.category || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Brand:</span>
                  <span class="detail-value">{{ selectedProduct.brand || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status:</span>
                  <span :class="['status-badge', selectedProduct.status]">
                    {{ getStatusText(selectedProduct.status) }}
                  </span>
                </div>
              </div>

              <div class="detail-section">
                <h3>Pricing & Stock</h3>
                <div class="detail-row">
                  <span class="detail-label">Unit Price:</span>
                  <span class="detail-value price">${{ formatPrice(selectedProduct.unit_price) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Cost Price:</span>
                  <span class="detail-value">${{ formatPrice(selectedProduct.cost_price || 0) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Profit Margin:</span>
                  <span class="detail-value">{{ calculateMargin(selectedProduct) }}%</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Stock:</span>
                  <span class="detail-value" :class="getStockClass(selectedProduct)">
                    {{ selectedProduct.stock_quantity }} {{ selectedProduct.unit }}
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Min Stock:</span>
                  <span class="detail-value">{{ selectedProduct.min_stock_level || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Max Stock:</span>
                  <span class="detail-value">{{ selectedProduct.max_stock_level || '-' }}</span>
                </div>
              </div>

              <div class="detail-section" v-if="selectedProduct.description">
                <h3>Description</h3>
                <p class="description-text">{{ selectedProduct.description }}</p>
              </div>

              <div class="detail-section" v-if="selectedProduct.weight || selectedProduct.dimensions">
                <h3>Shipping Information</h3>
                <div class="detail-row" v-if="selectedProduct.weight">
                  <span class="detail-label">Weight:</span>
                  <span class="detail-value">{{ selectedProduct.weight }} kg</span>
                </div>
                <div class="detail-row" v-if="selectedProduct.dimensions">
                  <span class="detail-label">Dimensions:</span>
                  <span class="detail-value">{{ selectedProduct.dimensions }}</span>
                </div>
              </div>

              <div class="detail-section" v-if="selectedProduct.notes">
                <h3>Notes</h3>
                <p class="notes-text">{{ selectedProduct.notes }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeViewModal" class="btn-secondary">Close</button>
          <button @click="editProduct(selectedProduct)" class="btn-primary">Edit Product</button>
          <button @click="adjustStock(selectedProduct)" class="btn-primary">Adjust Stock</button>
        </div>
      </div>
    </div>

    <!-- Adjust Stock Modal -->
    <div v-if="showStockModal && selectedProduct" class="modal-overlay" @click.self="closeStockModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Adjust Stock - {{ selectedProduct.name }}</h2>
          <button @click="closeStockModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="current-stock">
            <p>Current Stock: <strong>{{ selectedProduct.stock_quantity }} {{ selectedProduct.unit }}</strong></p>
          </div>

          <div class="form-group">
            <label>Adjustment Type</label>
            <select v-model="stockForm.type" class="form-control">
              <option value="add">Add Stock</option>
              <option value="remove">Remove Stock</option>
              <option value="set">Set Stock</option>
            </select>
          </div>

          <div class="form-group">
            <label>Quantity</label>
            <input type="number" v-model="stockForm.quantity" class="form-control" step="1" required />
          </div>

          <div class="form-group">
            <label>Reason</label>
            <textarea v-model="stockForm.reason" rows="2" class="form-control" placeholder="Reason for stock adjustment..."></textarea>
          </div>

          <div class="stock-preview" v-if="stockForm.quantity">
            <div class="preview-row">
              <span>Current:</span>
              <strong>{{ selectedProduct.stock_quantity }}</strong>
            </div>
            <div class="preview-row">
              <span>Adjustment:</span>
              <strong :class="stockForm.type === 'add' ? 'text-success' : 'text-danger'">
                {{ stockForm.type === 'add' ? '+' : (stockForm.type === 'remove' ? '-' : '=') }}
                {{ stockForm.quantity }}
              </strong>
            </div>
            <div class="preview-row total">
              <span>New Stock:</span>
              <strong>{{ calculateNewStock }}</strong>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeStockModal" class="btn-secondary">Cancel</button>
          <button @click="submitStockAdjustment" class="btn-primary">Apply Adjustment</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../../api';

const products = ref([]);
const searchQuery = ref('');
const categoryFilter = ref('');
const statusFilter = ref('');
const stockFilter = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(12);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showViewModal = ref(false);
const showStockModal = ref(false);
const selectedProduct = ref(null);
const saving = ref(false);

const stats = ref({
  total: 0,
  active: 0,
  lowStock: 0,
  totalValue: 0
});

const categories = ref([]);
const allCategories = ref(['Electronics', 'Computers', 'Mobile', 'Accessories', 'Appliances']);

const form = ref({
  id: null,
  sku: '',
  name: '',
  description: '',
  category: '',
  brand: '',
  unit_price: '',
  cost_price: '',
  stock_quantity: 0,
  min_stock_level: '',
  max_stock_level: '',
  unit: 'piece',
  weight: '',
  dimensions: '',
  status: 'active',
  image_url: '',
  notes: ''
});

const stockForm = ref({
  type: 'add',
  quantity: 0,
  reason: ''
});

const filteredProducts = computed(() => {
  let filtered = products.value;
  
  if (searchQuery.value) {
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  if (categoryFilter.value) {
    filtered = filtered.filter(product => product.category === categoryFilter.value);
  }
  
  if (statusFilter.value) {
    filtered = filtered.filter(product => product.status === statusFilter.value);
  }
  
  if (stockFilter.value === 'low') {
    filtered = filtered.filter(product => product.stock_quantity <= (product.min_stock_level || 5));
  } else if (stockFilter.value === 'out') {
    filtered = filtered.filter(product => product.stock_quantity === 0);
  } else if (stockFilter.value === 'in') {
    filtered = filtered.filter(product => product.stock_quantity > 0);
  }
  
  return filtered;
});

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value);
});

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredProducts.value.slice(start, end);
});

const calculateNewStock = computed(() => {
  if (!selectedProduct.value) return 0;
  const current = selectedProduct.value.stock_quantity;
  const quantity = parseInt(stockForm.value.quantity) || 0;
  
  if (stockForm.value.type === 'add') return current + quantity;
  if (stockForm.value.type === 'remove') return Math.max(0, current - quantity);
  return quantity;
});

const formatPrice = (price) => {
  return Number(price).toFixed(2);
};

const getStatusText = (status) => {
  const statusMap = {
    active: 'Active',
    inactive: 'Inactive',
    discontinued: 'Discontinued'
  };
  return statusMap[status] || status;
};

const getStockClass = (product) => {
  if (product.stock_quantity === 0) return 'stock-out';
  if (product.stock_quantity <= (product.min_stock_level || 5)) return 'stock-low';
  return 'stock-in';
};

const getStockText = (product) => {
  if (product.stock_quantity === 0) return 'Out of Stock';
  if (product.stock_quantity <= (product.min_stock_level || 5)) return 'Low Stock';
  return 'In Stock';
};

const calculateMargin = (product) => {
  if (!product.cost_price || product.cost_price === 0) return 0;
  const margin = ((product.unit_price - product.cost_price) / product.unit_price) * 100;
  return margin.toFixed(1);
};

const loadProducts = async () => {
  try {
    const response = await api.get('/products');
    if (response.success) {
      products.value = response.products;
      calculateStats();
      extractCategories();
    } else {
      // Demo data
      products.value = [
        {
          id: 1,
          sku: 'TV-001',
          name: 'Smart LED TV 55"',
          description: '4K Ultra HD Smart TV with HDR10+',
          category: 'Electronics',
          brand: 'Samsung',
          unit_price: 599.99,
          cost_price: 450.00,
          stock_quantity: 50,
          min_stock_level: 10,
          max_stock_level: 100,
          unit: 'piece',
          weight: 15.5,
          dimensions: '48" x 28" x 3"',
          status: 'active',
          image_url: '',
          notes: 'Popular model'
        },
        {
          id: 2,
          sku: 'LAP-001',
          name: 'Gaming Laptop',
          description: 'High-performance gaming laptop with RTX 4060',
          category: 'Computers',
          brand: 'ASUS',
          unit_price: 1299.99,
          cost_price: 1000.00,
          stock_quantity: 30,
          min_stock_level: 5,
          max_stock_level: 50,
          unit: 'piece',
          weight: 2.5,
          dimensions: '14" x 9" x 1"',
          status: 'active',
          image_url: '',
          notes: ''
        },
        {
          id: 3,
          sku: 'PH-001',
          name: 'Smartphone Pro',
          description: 'Latest model with 5G and 108MP camera',
          category: 'Mobile',
          brand: 'Apple',
          unit_price: 899.99,
          cost_price: 700.00,
          stock_quantity: 100,
          min_stock_level: 20,
          max_stock_level: 200,
          unit: 'piece',
          weight: 0.5,
          dimensions: '6" x 3" x 0.3"',
          status: 'active',
          image_url: '',
          notes: 'Best seller'
        },
        {
          id: 4,
          sku: 'HDD-001',
          name: 'External Hard Drive 2TB',
          description: 'Portable external hard drive',
          category: 'Accessories',
          brand: 'WD',
          unit_price: 89.99,
          cost_price: 60.00,
          stock_quantity: 3,
          min_stock_level: 10,
          max_stock_level: 50,
          unit: 'piece',
          weight: 0.2,
          dimensions: '4" x 3" x 0.5"',
          status: 'active',
          image_url: '',
          notes: 'Low stock alert'
        }
      ];
      calculateStats();
      extractCategories();
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
};

const calculateStats = () => {
  stats.value.total = products.value.length;
  stats.value.active = products.value.filter(p => p.status === 'active').length;
  stats.value.lowStock = products.value.filter(p => p.stock_quantity <= (p.min_stock_level || 5)).length;
  stats.value.totalValue = products.value.reduce((sum, p) => sum + (p.unit_price * p.stock_quantity), 0);
};

const extractCategories = () => {
  const cats = [...new Set(products.value.map(p => p.category).filter(c => c))];
  categories.value = cats;
};

const saveProduct = async () => {
  saving.value = true;
  try {
    if (showEditModal.value) {
      const response = await api.put(`/products/${form.value.id}`, form.value);
      if (response.success) {
        alert('Product updated successfully');
      }
    } else {
      const response = await api.post('/products', form.value);
      if (response.success) {
        alert('Product created successfully');
      }
    }
    closeModal();
    await loadProducts();
  } catch (error) {
    console.error('Error saving product:', error);
    alert('Failed to save product');
  } finally {
    saving.value = false;
  }
};

const viewProduct = (product) => {
  selectedProduct.value = product;
  showViewModal.value = true;
};

const editProduct = (product) => {
  selectedProduct.value = product;
  form.value = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description || '',
    category: product.category || '',
    brand: product.brand || '',
    unit_price: product.unit_price,
    cost_price: product.cost_price || '',
    stock_quantity: product.stock_quantity,
    min_stock_level: product.min_stock_level || '',
    max_stock_level: product.max_stock_level || '',
    unit: product.unit || 'piece',
    weight: product.weight || '',
    dimensions: product.dimensions || '',
    status: product.status,
    image_url: product.image_url || '',
    notes: product.notes || ''
  };
  showEditModal.value = true;
  closeViewModal();
};

const adjustStock = (product) => {
  selectedProduct.value = product;
  stockForm.value = {
    type: 'add',
    quantity: 0,
    reason: ''
  };
  showStockModal.value = true;
  closeViewModal();
};

const submitStockAdjustment = async () => {
  if (!stockForm.value.quantity || stockForm.value.quantity <= 0) {
    alert('Please enter a valid quantity');
    return;
  }
  
  try {
    let newStock = calculateNewStock.value;
    const response = await api.put(`/products/${selectedProduct.value.id}/stock`, {
      quantity: newStock,
      adjustment_type: stockForm.value.type,
      reason: stockForm.value.reason
    });
    
    if (response.success) {
      alert('Stock adjusted successfully');
      closeStockModal();
      await loadProducts();
    }
  } catch (error) {
    console.error('Error adjusting stock:', error);
    alert('Failed to adjust stock');
  }
};

const toggleProductStatus = async (product) => {
  const newStatus = product.status === 'active' ? 'inactive' : 'active';
  if (confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this product?`)) {
    try {
      const response = await api.put(`/products/${product.id}/status`, { status: newStatus });
      if (response.success) {
        await loadProducts();
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('Failed to update product status');
    }
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  form.value = {
    id: null,
    sku: '',
    name: '',
    description: '',
    category: '',
    brand: '',
    unit_price: '',
    cost_price: '',
    stock_quantity: 0,
    min_stock_level: '',
    max_stock_level: '',
    unit: 'piece',
    weight: '',
    dimensions: '',
    status: 'active',
    image_url: '',
    notes: ''
  };
};

const closeViewModal = () => {
  showViewModal.value = false;
  selectedProduct.value = null;
};

const closeStockModal = () => {
  showStockModal.value = false;
  selectedProduct.value = null;
  stockForm.value = { type: 'add', quantity: 0, reason: '' };
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

onMounted(() => {
  loadProducts();
});
</script>

<style scoped>
.products-page {
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
  margin-bottom: 30px;
  flex-wrap: wrap;
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

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.product-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}

.product-image {
  height: 200px;
  background: #f8f9fa;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e9ecef 100%);
}

.stock-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.stock-badge.stock-in {
  background: #d4edda;
  color: #155724;
}

.stock-badge.stock-low {
  background: #fff3cd;
  color: #856404;
}

.stock-badge.stock-out {
  background: #f8d7da;
  color: #721c24;
}

.product-info {
  padding: 15px;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.product-sku {
  font-size: 12px;
  color: #999;
  font-family: monospace;
  margin-bottom: 5px;
}

.product-category {
  font-size: 12px;
  color: #667eea;
  margin-bottom: 10px;
}

.product-price {
  display: flex;
  gap: 10px;
  align-items: baseline;
  margin-bottom: 8px;
}

.price {
  font-size: 20px;
  font-weight: bold;
  color: #28a745;
}

.cost {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.product-stock {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.min-stock {
  color: #ffc107;
}

.product-status {
  margin-top: 8px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #fff3cd;
  color: #856404;
}

.status-badge.discontinued {
  background: #f8d7da;
  color: #721c24;
}

.product-actions {
  display: flex;
  justify-content: space-around;
  padding: 12px 15px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
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
  max-width: 600px;
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

/* Product Details */
.product-details {
  display: flex;
  gap: 30px;
}

.detail-image {
  flex: 1;
  max-width: 300px;
}

.detail-image img {
  width: 100%;
  border-radius: 10px;
}

.image-placeholder-large {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e9ecef 100%);
  border-radius: 10px;
}

.detail-info {
  flex: 2;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h3 {
  font-size: 16px;
  margin-bottom: 10px;
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
  width: 120px;
  font-weight: 600;
  color: #666;
}

.detail-value {
  flex: 1;
  color: #333;
}

.detail-value.price {
  font-weight: bold;
  color: #28a745;
  font-size: 18px;
}

.description-text, .notes-text {
  color: #666;
  line-height: 1.5;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 5px;
}

/* Stock Modal */
.current-stock {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
  text-align: center;
}

.stock-preview {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-top: 20px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #dee2e6;
}

.preview-row.total {
  border-top: 2px solid #dee2e6;
  border-bottom: none;
  margin-top: 8px;
  padding-top: 12px;
  font-weight: bold;
  font-size: 16px;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
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
  
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .product-details {
    flex-direction: column;
  }
  
  .detail-image {
    max-width: 100%;
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