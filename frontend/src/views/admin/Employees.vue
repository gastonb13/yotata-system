<template>
  <div class="employees-page">
    <div class="page-header">
      <h1>Employees Management</h1>
      <button class="btn-primary" @click="showCreateModal = true">+ Add New Employee</button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👔</div>
        <div class="stat-info">
          <h3>Total Employees</h3>
          <p class="stat-value">{{ stats.total }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <h3>Active Employees</h3>
          <p class="stat-value">{{ stats.active }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💵</div>
        <div class="stat-info">
          <h3>Monthly Salary</h3>
          <p class="stat-value">${{ formatPrice(stats.monthlySalary) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏢</div>
        <div class="stat-info">
          <h3>Departments</h3>
          <p class="stat-value">{{ stats.departmentsCount }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Search by name, email, employee code..." 
        class="search-input"
      />
      <select v-model="departmentFilter" class="filter-select">
        <option value="">All Departments</option>
        <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
      </select>
      <select v-model="statusFilter" class="filter-select">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="terminated">Terminated</option>
      </select>
    </div>

    <!-- Employees Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee Code</th>
            <th>Name</th>
            <th>Email</th>
            <th>Position</th>
            <th>Department</th>
            <th>Base Salary</th>
            <th>Hire Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in paginatedEmployees" :key="employee.id">
            <td>#{{ employee.id }}</td>
            <td class="employee-code">{{ employee.employee_code }}</td>
            <td class="employee-name">{{ employee.first_name }} {{ employee.last_name }}</td>
            <td>{{ employee.user?.email || '-' }}</td>
            <td>{{ employee.position || '-' }}</td>
            <td>{{ employee.department || '-' }}</td>
            <td class="amount">${{ formatPrice(employee.base_salary) }}</td>
            <td>{{ formatDate(employee.hire_date) }}</td>
            <td>
              <span :class="['status-badge', employee.status]">
                {{ getStatusText(employee.status) }}
              </span>
            </td>
            <td class="actions">
              <button @click="viewEmployee(employee)" class="btn-icon" title="View">👁️</button>
              <button @click="editEmployee(employee)" class="btn-icon" title="Edit">✏️</button>
              <button @click="processSalary(employee)" class="btn-icon" title="Process Salary">💰</button>
              <button @click="toggleEmployeeStatus(employee)" class="btn-icon" :title="employee.status === 'active' ? 'Deactivate' : 'Activate'">
                {{ employee.status === 'active' ? '🔴' : '🟢' }}
              </button>
            </td>
          </tr>
          <tr v-if="filteredEmployees.length === 0">
            <td colspan="10" class="empty-state">No employees found</td>
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

    <!-- Create/Edit Employee Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>{{ showEditModal ? 'Edit Employee' : 'Add New Employee' }}</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveEmployee">
            <div class="form-row">
              <div class="form-group">
                <label>First Name *</label>
                <input type="text" v-model="form.first_name" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Last Name *</label>
                <input type="text" v-model="form.last_name" class="form-control" required />
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
                <label>Position</label>
                <input type="text" v-model="form.position" class="form-control" />
              </div>
              <div class="form-group">
                <label>Department</label>
                <select v-model="form.department" class="form-control">
                  <option value="">Select Department</option>
                  <option value="Management">Management</option>
                  <option value="Sales">Sales</option>
                  <option value="Technical">Technical</option>
                  <option value="Support">Support</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">Human Resources</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Base Salary</label>
                <input type="number" v-model="form.base_salary" class="form-control" step="0.01" />
              </div>
              <div class="form-group">
                <label>Hire Date</label>
                <input type="date" v-model="form.hire_date" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Bank Name</label>
                <input type="text" v-model="form.bank_name" class="form-control" />
              </div>
              <div class="form-group">
                <label>Bank Account</label>
                <input type="text" v-model="form.bank_account" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Emergency Contact</label>
                <input type="text" v-model="form.emergency_contact" class="form-control" />
              </div>
              <div class="form-group">
                <label>Emergency Phone</label>
                <input type="tel" v-model="form.emergency_phone" class="form-control" />
              </div>
            </div>

            <div class="form-group">
              <label>Status</label>
              <select v-model="form.status" class="form-control">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeModal" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : (showEditModal ? 'Update Employee' : 'Create Employee') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View Employee Modal -->
    <div v-if="showViewModal && selectedEmployee" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Employee Details</h2>
          <button @click="closeViewModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="employee-details">
            <div class="detail-section">
              <h3>Personal Information</h3>
              <div class="detail-row">
                <span class="detail-label">Employee Code:</span>
                <span class="detail-value">{{ selectedEmployee.employee_code }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Full Name:</span>
                <span class="detail-value">{{ selectedEmployee.first_name }} {{ selectedEmployee.last_name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ selectedEmployee.user?.email || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Position:</span>
                <span class="detail-value">{{ selectedEmployee.position || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Department:</span>
                <span class="detail-value">{{ selectedEmployee.department || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Hire Date:</span>
                <span class="detail-value">{{ formatDate(selectedEmployee.hire_date) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span :class="['status-badge', selectedEmployee.status]">
                  {{ getStatusText(selectedEmployee.status) }}
                </span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Financial Information</h3>
              <div class="detail-row">
                <span class="detail-label">Base Salary:</span>
                <span class="detail-value">${{ formatPrice(selectedEmployee.base_salary) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Bank Name:</span>
                <span class="detail-value">{{ selectedEmployee.bank_name || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Bank Account:</span>
                <span class="detail-value">{{ selectedEmployee.bank_account || '-' }}</span>
              </div>
            </div>

            <div class="detail-section" v-if="selectedEmployee.emergency_contact || selectedEmployee.emergency_phone">
              <h3>Emergency Contact</h3>
              <div class="detail-row">
                <span class="detail-label">Contact Name:</span>
                <span class="detail-value">{{ selectedEmployee.emergency_contact || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">{{ selectedEmployee.emergency_phone || '-' }}</span>
              </div>
            </div>

            <div class="detail-section" v-if="selectedEmployee.salaries?.length">
              <h3>Salary History</h3>
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Base Salary</th>
                    <th>Bonuses</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="salary in selectedEmployee.salaries" :key="salary.id">
                    <td>{{ formatMonthYear(salary.month_year) }}</td>
                    <td>${{ formatPrice(salary.base_salary) }}</td>
                    <td>${{ formatPrice(salary.bonuses) }}</td>
                    <td>${{ formatPrice(salary.deductions) }}</td>
                    <td class="amount">${{ formatPrice(salary.net_salary) }}</td>
                    <td><span :class="['status-badge', salary.status]">{{ salary.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeViewModal" class="btn-secondary">Close</button>
          <button @click="editEmployee(selectedEmployee)" class="btn-primary">Edit Employee</button>
          <button @click="processSalary(selectedEmployee)" class="btn-primary">Process Salary</button>
        </div>
      </div>
    </div>

    <!-- Process Salary Modal -->
    <div v-if="showSalaryModal && selectedEmployee" class="modal-overlay" @click.self="closeSalaryModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Process Salary - {{ selectedEmployee.first_name }} {{ selectedEmployee.last_name }}</h2>
          <button @click="closeSalaryModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="salary-summary">
            <div class="summary-row">
              <span>Base Salary:</span>
              <strong>${{ formatPrice(selectedEmployee.base_salary) }}</strong>
            </div>
            <div class="summary-row">
              <span>Bonuses:</span>
              <input type="number" v-model="salaryData.bonuses" class="salary-input" step="0.01" />
            </div>
            <div class="summary-row">
              <span>Deductions:</span>
              <input type="number" v-model="salaryData.deductions" class="salary-input" step="0.01" />
            </div>
            <div class="summary-row total">
              <span>Net Salary:</span>
              <strong>${{ formatPrice(calculateNetSalary) }}</strong>
            </div>
          </div>

          <div class="form-group">
            <label>Month/Year</label>
            <input type="month" v-model="salaryData.month_year" class="form-control" required />
          </div>

          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="salaryData.notes" rows="3" class="form-control" placeholder="Additional notes..."></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeSalaryModal" class="btn-secondary">Cancel</button>
          <button @click="submitSalary" class="btn-primary" :disabled="processingSalary">
            {{ processingSalary ? 'Processing...' : 'Process Salary' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../../api';

const employees = ref([]);
const departments = ref([]);
const searchQuery = ref('');
const departmentFilter = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showViewModal = ref(false);
const showSalaryModal = ref(false);
const selectedEmployee = ref(null);
const saving = ref(false);
const processingSalary = ref(false);

const stats = ref({
  total: 0,
  active: 0,
  monthlySalary: 0,
  departmentsCount: 0
});

const form = ref({
  id: null,
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  position: '',
  department: '',
  base_salary: '',
  hire_date: '',
  bank_name: '',
  bank_account: '',
  emergency_contact: '',
  emergency_phone: '',
  status: 'active'
});

const salaryData = ref({
  bonuses: 0,
  deductions: 0,
  month_year: '',
  notes: ''
});

const filteredEmployees = computed(() => {
  let filtered = employees.value;
  
  if (searchQuery.value) {
    filtered = filtered.filter(emp => 
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      emp.employee_code?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      emp.user?.email?.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  if (departmentFilter.value) {
    filtered = filtered.filter(emp => emp.department === departmentFilter.value);
  }
  
  if (statusFilter.value) {
    filtered = filtered.filter(emp => emp.status === statusFilter.value);
  }
  
  return filtered;
});

const totalPages = computed(() => {
  return Math.ceil(filteredEmployees.value.length / itemsPerPage.value);
});

const paginatedEmployees = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredEmployees.value.slice(start, end);
});

const calculateNetSalary = computed(() => {
  const base = parseFloat(selectedEmployee.value?.base_salary || 0);
  const bonuses = parseFloat(salaryData.value.bonuses || 0);
  const deductions = parseFloat(salaryData.value.deductions || 0);
  return base + bonuses - deductions;
});

const formatPrice = (price) => {
  return Number(price).toFixed(2);
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
};

const formatMonthYear = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const getStatusText = (status) => {
  const statusMap = {
    active: 'Active',
    inactive: 'Inactive',
    terminated: 'Terminated'
  };
  return statusMap[status] || status;
};

const loadEmployees = async () => {
  try {
    const response = await api.get('/employees');
    if (response.success) {
      employees.value = response.employees;
      calculateStats();
      extractDepartments();
    } else {
      // Demo data
      employees.value = [
        {
          id: 1,
          employee_code: 'EMP-001',
          first_name: 'Ahmed',
          last_name: 'Ben Ali',
          user: { email: 'ahmed.benali@yotata.com' },
          position: 'Sales Manager',
          department: 'Sales',
          base_salary: 3500,
          hire_date: '2023-01-15',
          bank_name: 'Banque Tunisienne',
          bank_account: 'BT123456789',
          emergency_contact: 'Fatma Ben Ali',
          emergency_phone: '+216 98 123 456',
          status: 'active',
          salaries: []
        },
        {
          id: 2,
          employee_code: 'EMP-002',
          first_name: 'Sarra',
          last_name: 'Mansour',
          user: { email: 'sarra.mansour@yotata.com' },
          position: 'Technical Lead',
          department: 'Technical',
          base_salary: 4200,
          hire_date: '2023-03-20',
          bank_name: 'Amen Bank',
          bank_account: 'AM123456789',
          emergency_contact: 'Mohamed Mansour',
          emergency_phone: '+216 55 789 012',
          status: 'active',
          salaries: []
        }
      ];
      calculateStats();
      extractDepartments();
    }
  } catch (error) {
    console.error('Error loading employees:', error);
  }
};

const calculateStats = () => {
  stats.value.total = employees.value.length;
  stats.value.active = employees.value.filter(e => e.status === 'active').length;
  stats.value.monthlySalary = employees.value.reduce((sum, e) => sum + (parseFloat(e.base_salary) || 0), 0);
  stats.value.departmentsCount = [...new Set(employees.value.map(e => e.department).filter(d => d))].length;
};

const extractDepartments = () => {
  const depts = [...new Set(employees.value.map(e => e.department).filter(d => d))];
  departments.value = depts;
};

const saveEmployee = async () => {
  saving.value = true;
  try {
    if (showEditModal.value) {
      const response = await api.put(`/employees/${form.value.id}`, {
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        position: form.value.position,
        department: form.value.department,
        base_salary: form.value.base_salary,
        bank_name: form.value.bank_name,
        bank_account: form.value.bank_account,
        emergency_contact: form.value.emergency_contact,
        emergency_phone: form.value.emergency_phone,
        status: form.value.status
      });
      if (response.success) {
        alert('Employee updated successfully');
      }
    } else {
      const response = await api.post('/employees', {
        email: form.value.email,
        password: form.value.password,
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        position: form.value.position,
        department: form.value.department,
        base_salary: form.value.base_salary,
        hire_date: form.value.hire_date,
        bank_name: form.value.bank_name,
        bank_account: form.value.bank_account,
        emergency_contact: form.value.emergency_contact,
        emergency_phone: form.value.emergency_phone
      });
      if (response.success) {
        alert('Employee created successfully');
      }
    }
    closeModal();
    await loadEmployees();
  } catch (error) {
    console.error('Error saving employee:', error);
    alert('Failed to save employee');
  } finally {
    saving.value = false;
  }
};

const viewEmployee = (employee) => {
  selectedEmployee.value = employee;
  showViewModal.value = true;
};

const editEmployee = (employee) => {
  selectedEmployee.value = employee;
  form.value = {
    id: employee.id,
    first_name: employee.first_name,
    last_name: employee.last_name,
    email: employee.user?.email || '',
    password: '',
    position: employee.position || '',
    department: employee.department || '',
    base_salary: employee.base_salary || '',
    hire_date: employee.hire_date || '',
    bank_name: employee.bank_name || '',
    bank_account: employee.bank_account || '',
    emergency_contact: employee.emergency_contact || '',
    emergency_phone: employee.emergency_phone || '',
    status: employee.status || 'active'
  };
  showEditModal.value = true;
  closeViewModal();
};

const processSalary = (employee) => {
  selectedEmployee.value = employee;
  salaryData.value = {
    bonuses: 0,
    deductions: 0,
    month_year: new Date().toISOString().slice(0, 7),
    notes: ''
  };
  showSalaryModal.value = true;
  closeViewModal();
};

const submitSalary = async () => {
  if (!salaryData.value.month_year) {
    alert('Please select month/year');
    return;
  }
  
  processingSalary.value = true;
  try {
    const response = await api.post('/salary/process', {
      employee_id: selectedEmployee.value.id,
      month_year: salaryData.value.month_year,
      bonuses: salaryData.value.bonuses,
      deductions: salaryData.value.deductions,
      notes: salaryData.value.notes
    });
    
    if (response.success) {
      alert('Salary processed successfully!');
      closeSalaryModal();
      await loadEmployees();
    }
  } catch (error) {
    console.error('Error processing salary:', error);
    alert('Failed to process salary');
  } finally {
    processingSalary.value = false;
  }
};

const toggleEmployeeStatus = async (employee) => {
  const action = employee.status === 'active' ? 'deactivate' : 'activate';
  if (confirm(`Are you sure you want to ${action} this employee?`)) {
    try {
      const response = await api.put(`/employees/${employee.id}/toggle-status`);
      if (response.success) {
        await loadEmployees();
      }
    } catch (error) {
      console.error('Error toggling employee status:', error);
      alert('Failed to update employee status');
    }
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  form.value = {
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    position: '',
    department: '',
    base_salary: '',
    hire_date: '',
    bank_name: '',
    bank_account: '',
    emergency_contact: '',
    emergency_phone: '',
    status: 'active'
  };
};

const closeViewModal = () => {
  showViewModal.value = false;
  selectedEmployee.value = null;
};

const closeSalaryModal = () => {
  showSalaryModal.value = false;
  selectedEmployee.value = null;
  salaryData.value = {
    bonuses: 0,
    deductions: 0,
    month_year: '',
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
  loadEmployees();
});
</script>

<style scoped>
.employees-page {
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
  width: 180px;
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

.employee-code {
  font-weight: 600;
  color: #667eea;
  font-family: monospace;
}

.employee-name {
  font-weight: 500;
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
  background: #fff3cd;
  color: #856404;
}

.status-badge.terminated {
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e9ecef;
}

/* Employee Details */
.employee-details {
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

.mini-table {
  width: 100%;
  margin-top: 10px;
}

.mini-table th,
.mini-table td {
  padding: 8px;
  font-size: 13px;
}

/* Salary Modal */
.salary-summary {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #dee2e6;
}

.summary-row.total {
  border-top: 2px solid #dee2e6;
  border-bottom: none;
  margin-top: 10px;
  padding-top: 15px;
  font-size: 18px;
}

.salary-input {
  width: 150px;
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  text-align: right;
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
  
  .salary-input {
    width: 100%;
  }
}
</style>