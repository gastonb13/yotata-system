<template>
  <div class="data-table">
    <div class="table-toolbar" v-if="showToolbar">
      <div class="search-box">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search..."
          @input="onSearch"
        />
        <span class="search-icon">🔍</span>
      </div>
      
      <div class="filters">
        <select v-model="filterValue" @change="onFilterChange">
          <option value="">All</option>
          <option v-for="option in filterOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      
      <button v-if="showExport" @click="exportData" class="btn-export">
        Export
      </button>
    </div>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" @click="sort(column.key)">
              {{ column.label }}
              <span class="sort-icon" v-if="sortKey === column.key">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th v-if="hasActions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in paginatedData" :key="row.id">
            <td v-for="column in columns" :key="column.key">
              <slot :name="`column-${column.key}`" :row="row" :value="row[column.key]">
                <span v-if="column.format">
                  {{ column.format(row[column.key]) }}
                </span>
                <span v-else>
                  {{ row[column.key] }}
                </span>
              </slot>
            </td>
            <td v-if="hasActions">
              <div class="actions">
                <button
                  v-if="showView"
                  @click="$emit('view', row)"
                  class="btn-icon"
                  title="View"
                >
                  👁️
                </button>
                <button
                  v-if="showEdit"
                  @click="$emit('edit', row)"
                  class="btn-icon"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  v-if="showDelete"
                  @click="$emit('delete', row)"
                  class="btn-icon"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="paginatedData.length === 0">
            <td :colspan="columns.length + (hasActions ? 1 : 0)" class="empty-state">
              No data available
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="table-footer" v-if="totalPages > 1">
      <div class="pagination">
        <button
          @click="prevPage"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          Previous
        </button>
        
        <div class="page-numbers">
          <button
            v-for="page in displayedPages"
            :key="page"
            @click="goToPage(page)"
            :class="['page-number', { active: currentPage === page }]"
          >
            {{ page }}
          </button>
        </div>
        
        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Next
        </button>
      </div>
      
      <div class="page-info">
        Showing {{ (currentPage - 1) * pageSize + 1 }} to
        {{ Math.min(currentPage * pageSize, filteredData.length) }} of
        {{ filteredData.length }} entries
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  columns: {
    type: Array,
    required: true
  },
  pageSize: {
    type: Number,
    default: 10
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  showView: {
    type: Boolean,
    default: false
  },
  showEdit: {
    type: Boolean,
    default: false
  },
  showDelete: {
    type: Boolean,
    default: false
  },
  showExport: {
    type: Boolean,
    default: false
  },
  filterOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['view', 'edit', 'delete', 'search', 'filter', 'export'])

const searchQuery = ref('')
const filterValue = ref('')
const currentPage = ref(1)
const sortKey = ref('')
const sortOrder = ref('asc')

const hasActions = computed(() => {
  return props.showView || props.showEdit || props.showDelete
})

const filteredData = computed(() => {
  let data = [...props.data]
  
  // Apply search
  if (searchQuery.value) {
    data = data.filter(row => {
      return Object.values(row).some(value => {
        return String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
      })
    })
  }
  
  // Apply filter
  if (filterValue.value) {
    data = data.filter(row => row.status === filterValue.value)
  }
  
  // Apply sorting
  if (sortKey.value) {
    data.sort((a, b) => {
      let aVal = a[sortKey.value]
      let bVal = b[sortKey.value]
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (sortOrder.value === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }
  
  return data
})

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / props.pageSize)
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return filteredData.value.slice(start, end)
})

const displayedPages = computed(() => {
  const pages = []
  const maxDisplayed = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxDisplayed / 2))
  let end = Math.min(totalPages.value, start + maxDisplayed - 1)
  
  if (end - start + 1 < maxDisplayed) {
    start = Math.max(1, end - maxDisplayed + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const sort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const onSearch = () => {
  currentPage.value = 1
  emit('search', searchQuery.value)
}

const onFilterChange = () => {
  currentPage.value = 1
  emit('filter', filterValue.value)
}

const goToPage = (page) => {
  currentPage.value = page
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const exportData = () => {
  emit('export', filteredData.value)
}

watch(() => props.data, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.data-table {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search-box input {
  width: 100%;
  padding: 8px 12px 8px 35px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.btn-export {
  padding: 8px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-export:hover {
  background: #5a67d8;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f8f9fa;
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  cursor: pointer;
  user-select: none;
  border-bottom: 2px solid #dee2e6;
}

th:hover {
  background: #e9ecef;
}

td {
  padding: 12px 15px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
}

.actions {
  display: flex;
  gap: 10px;
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

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-btn {
  padding: 5px 12px;
  border: 1px solid #ddd;
  background: white;
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

.page-numbers {
  display: flex;
  gap: 5px;
}

.page-number {
  padding: 5px 10px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-number:hover {
  background: #f8f9fa;
}

.page-number.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.page-info {
  font-size: 14px;
  color: #666;
}

@media (max-width: 768px) {
  .table-toolbar {
    flex-direction: column;
    gap: 10px;
  }
  
  .search-box {
    max-width: 100%;
  }
  
  .table-footer {
    flex-direction: column;
    gap: 10px;
  }
  
  .pagination {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>