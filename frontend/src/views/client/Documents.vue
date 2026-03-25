<template>
  <div class="documents-page">
    <div class="page-header">
      <h1>My Documents</h1>
      <button class="btn-upload" @click="showUploadModal = true">+ Upload Document</button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="typeFilter" class="filter-select">
        <option value="">All Types</option>
        <option value="invoice">Invoices</option>
        <option value="quote">Quotes</option>
        <option value="contract">Contracts</option>
        <option value="receipt">Receipts</option>
        <option value="other">Other</option>
      </select>
      
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Search by title..." 
        class="search-input"
      />
    </div>

    <!-- Documents Grid -->
    <div class="documents-grid">
      <div v-for="doc in paginatedDocuments" :key="doc.id" class="document-card">
        <div class="document-icon">
          <span class="icon">{{ getFileIcon(doc.mime_type) }}</span>
        </div>
        <div class="document-info">
          <h3 class="document-title">{{ doc.title }}</h3>
          <p class="document-type">{{ getDocumentTypeText(doc.document_type) }}</p>
          <p class="document-meta">
            <span>📅 {{ formatDate(doc.created_at) }}</span>
            <span>📄 {{ formatFileSize(doc.file_size) }}</span>
          </p>
        </div>
        <div class="document-actions">
          <button @click="downloadDocument(doc.id)" class="btn-download" title="Download">📥</button>
          <button @click="viewDocument(doc.id)" class="btn-view" title="View">👁️</button>
          <button @click="deleteDocument(doc.id)" class="btn-delete" title="Delete">🗑️</button>
        </div>
      </div>
      
      <div v-if="filteredDocuments.length === 0" class="empty-state">
        <p>No documents found</p>
        <button @click="showUploadModal = true" class="btn-primary">Upload Your First Document</button>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">Previous</button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">Next</button>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click.self="closeUploadModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Upload Document</h2>
          <button @click="closeUploadModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Document Type *</label>
            <select v-model="uploadForm.document_type" class="form-control" required>
              <option value="">Select document type</option>
              <option value="invoice">Invoice</option>
              <option value="quote">Quote</option>
              <option value="contract">Contract</option>
              <option value="receipt">Receipt</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Title *</label>
            <input 
              type="text" 
              v-model="uploadForm.title" 
              class="form-control"
              placeholder="Enter document title"
              required
            />
          </div>
          
          <div class="form-group">
            <label>Reference (Optional)</label>
            <select v-model="uploadForm.reference_id" class="form-control">
              <option value="">No reference</option>
              <option v-for="order in orders" :key="order.id" :value="order.id">
                Order #{{ order.order_number }} - ${{ formatPrice(order.final_amount) }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>File *</label>
            <input 
              type="file" 
              @change="handleFileSelect" 
              class="form-control"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              required
            />
            <p class="file-hint">Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB)</p>
          </div>
          
          <div class="form-group" v-if="selectedFile">
            <div class="selected-file">
              <span>📄 {{ selectedFile.name }}</span>
              <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label>Notes (Optional)</label>
            <textarea 
              v-model="uploadForm.notes" 
              rows="3" 
              class="form-control"
              placeholder="Additional notes about this document"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeUploadModal" class="btn-secondary">Cancel</button>
          <button @click="uploadDocument" class="btn-primary" :disabled="!canUpload">Upload</button>
        </div>
      </div>
    </div>

    <!-- View Document Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>{{ viewDocumentData?.title }}</h2>
          <button @click="closeViewModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body" v-if="viewDocumentData">
          <div class="document-details">
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span class="detail-value">{{ getDocumentTypeText(viewDocumentData.document_type) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Uploaded:</span>
              <span class="detail-value">{{ formatDate(viewDocumentData.created_at) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">File Name:</span>
              <span class="detail-value">{{ viewDocumentData.file_name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">File Size:</span>
              <span class="detail-value">{{ formatFileSize(viewDocumentData.file_size) }}</span>
            </div>
            <div class="detail-row" v-if="viewDocumentData.notes">
              <span class="detail-label">Notes:</span>
              <span class="detail-value">{{ viewDocumentData.notes }}</span>
            </div>
          </div>
          
          <div class="document-preview" v-if="isImage(viewDocumentData.mime_type)">
            <h3>Preview</h3>
            <img :src="previewUrl" :alt="viewDocumentData.title" class="preview-image" />
          </div>
          <div class="document-preview" v-else>
            <h3>Preview</h3>
            <div class="preview-placeholder">
              <span class="preview-icon">📄</span>
              <p>Preview not available for this file type</p>
              <button @click="downloadDocument(viewDocumentData.id)" class="btn-primary">
                Download to View
              </button>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="downloadDocument(viewDocumentData?.id)" class="btn-primary">Download</button>
          <button @click="closeViewModal" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../../api';

const documents = ref([]);
const orders = ref([]);
const typeFilter = ref('');
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(12);
const showUploadModal = ref(false);
const showViewModal = ref(false);
const viewDocumentData = ref(null);
const previewUrl = ref('');

const uploadForm = ref({
  document_type: '',
  title: '',
  reference_id: '',
  notes: ''
});

const selectedFile = ref(null);

const filteredDocuments = computed(() => {
  let filtered = documents.value;
  
  if (typeFilter.value) {
    filtered = filtered.filter(doc => doc.document_type === typeFilter.value);
  }
  
  if (searchQuery.value) {
    filtered = filtered.filter(doc => 
      doc.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  return filtered;
});

const totalPages = computed(() => {
  return Math.ceil(filteredDocuments.value.length / itemsPerPage.value);
});

const paginatedDocuments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredDocuments.value.slice(start, end);
});

const canUpload = computed(() => {
  return uploadForm.value.document_type && uploadForm.value.title && selectedFile.value;
});

const formatPrice = (price) => {
  return Number(price).toFixed(2);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getDocumentTypeText = (type) => {
  const typeMap = {
    invoice: 'Invoice',
    quote: 'Quote',
    contract: 'Contract',
    receipt: 'Receipt',
    other: 'Other'
  };
  return typeMap[type] || type;
};

const getFileIcon = (mimeType) => {
  if (!mimeType) return '📄';
  if (mimeType.includes('pdf')) return '📑';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel')) return '📊';
  return '📄';
};

const isImage = (mimeType) => {
  return mimeType && mimeType.startsWith('image/');
};

const loadDocuments = async () => {
  try {
    const response = await api.get('/clients/documents');
    if (response.success) {
      documents.value = response.documents;
    } else {
      // Demo data if API not ready
      documents.value = [
        {
          id: 1,
          document_type: 'invoice',
          title: 'Invoice #INV-2024-001',
          file_name: 'invoice-001.pdf',
          file_size: 245760,
          mime_type: 'application/pdf',
          created_at: new Date().toISOString(),
          notes: 'Monthly invoice for March 2024'
        },
        {
          id: 2,
          document_type: 'contract',
          title: 'Service Agreement',
          file_name: 'contract.pdf',
          file_size: 512000,
          mime_type: 'application/pdf',
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          notes: 'Annual service contract'
        },
        {
          id: 3,
          document_type: 'receipt',
          title: 'Payment Receipt - March 2024',
          file_name: 'receipt-march.jpg',
          file_size: 102400,
          mime_type: 'image/jpeg',
          created_at: new Date(Date.now() - 15 * 86400000).toISOString()
        }
      ];
    }
  } catch (error) {
    console.error('Error loading documents:', error);
    // Fallback demo data
    documents.value = [
      {
        id: 1,
        document_type: 'invoice',
        title: 'Invoice #INV-2024-001',
        file_name: 'invoice-001.pdf',
        file_size: 245760,
        mime_type: 'application/pdf',
        created_at: new Date().toISOString()
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

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    selectedFile.value = file;
  }
};

const uploadDocument = async () => {
  if (!canUpload.value) return;
  
  try {
    const formData = new FormData();
    formData.append('document_type', uploadForm.value.document_type);
    formData.append('title', uploadForm.value.title);
    formData.append('notes', uploadForm.value.notes);
    if (uploadForm.value.reference_id) {
      formData.append('reference_id', uploadForm.value.reference_id);
      formData.append('reference_type', 'order');
    }
    formData.append('file', selectedFile.value);
    
    const response = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    if (response.success) {
      alert('Document uploaded successfully!');
      closeUploadModal();
      await loadDocuments();
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    alert('Failed to upload document');
  }
};

const downloadDocument = async (id) => {
  try {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    const document = documents.value.find(d => d.id === id);
    link.setAttribute('download', document?.file_name || 'document');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading document:', error);
    alert('Failed to download document');
  }
};

const viewDocument = async (id) => {
  const document = documents.value.find(d => d.id === id);
  if (!document) return;
  
  viewDocumentData.value = document;
  
  if (isImage(document.mime_type)) {
    try {
      const response = await api.get(`/documents/${id}/download`, {
        responseType: 'blob'
      });
      previewUrl.value = URL.createObjectURL(response);
    } catch (error) {
      console.error('Error loading preview:', error);
    }
  }
  
  showViewModal.value = true;
};

const deleteDocument = async (id) => {
  if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await api.delete(`/documents/${id}`);
    if (response.success) {
      alert('Document deleted successfully');
      await loadDocuments();
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    alert('Failed to delete document');
  }
};

const closeUploadModal = () => {
  showUploadModal.value = false;
  uploadForm.value = {
    document_type: '',
    title: '',
    reference_id: '',
    notes: ''
  };
  selectedFile.value = null;
};

const closeViewModal = () => {
  showViewModal.value = false;
  viewDocumentData.value = null;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = '';
  }
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
  loadDocuments();
  loadOrders();
});
</script>

<style scoped>
.documents-page {
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

.btn-upload {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.2s;
}

.btn-upload:hover {
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

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.document-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  gap: 15px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}

.document-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-icon .icon {
  font-size: 32px;
}

.document-info {
  flex: 1;
}

.document-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.document-type {
  font-size: 12px;
  color: #667eea;
  margin-bottom: 8px;
}

.document-meta {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: #999;
}

.document-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.document-actions button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 5px;
  transition: transform 0.2s;
}

.document-actions button:hover {
  transform: scale(1.1);
}

.btn-download {
  color: #28a745;
}

.btn-view {
  color: #667eea;
}

.btn-delete {
  color: #dc3545;
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

.file-hint {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.selected-file {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-size {
  font-size: 12px;
  color: #666;
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

/* Document Details */
.document-details {
  margin-bottom: 30px;
}

.detail-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-label {
  width: 100px;
  font-weight: 600;
  color: #666;
}

.detail-value {
  flex: 1;
  color: #333;
}

.document-preview {
  margin-top: 20px;
}

.document-preview h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #333;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.preview-placeholder {
  text-align: center;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 5px;
}

.preview-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 15px;
}

.preview-placeholder p {
  margin-bottom: 15px;
  color: #666;
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
  
  .documents-grid {
    grid-template-columns: 1fr;
  }
  
  .document-card {
    flex-direction: column;
    text-align: center;
  }
  
  .document-icon {
    margin: 0 auto;
  }
  
  .document-actions {
    flex-direction: row;
    justify-content: center;
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