<template>
  <div class="salary-page">
    <div class="page-header">
      <h1>Salary Management</h1>
      <button class="btn-primary" @click="showProcessModal = true">+ Process Salary</button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">💵</div>
        <div class="stat-info">
          <h3>Total Paid (Year)</h3>
          <p class="stat-value">${{ formatPrice(stats.yearlyTotal) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <h3>Last Month Total</h3>
          <p class="stat-value">${{ formatPrice(stats.lastMonthTotal) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <h3>Active Employees</h3>
          <p class="stat-value">{{ stats.activeEmployees }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <h3>Average Salary</h3>
          <p class="stat-value">${{ formatPrice(stats.averageSalary) }}</p>
        </div>
      </div>
    </div>

    <!-- Monthly Salary Chart -->
    <div class="chart-container">
      <div class="chart-card">
        <h3>Monthly Salary Distribution</h3>
        <canvas ref="salaryChart"></canvas>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="monthFilter" class="filter-select">
        <option value="">All Months</option>
        <option v-for="month in months" :key="month.value" :value="month.value">
          {{ month.label }}
        </option>
      </select>
      <select v-model="yearFilter" class="filter-select">
        <option value="">All Years</option>
        <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
      </select>
      <select v-model="employeeFilter" class="filter-select">
        <option value="">All Employees</option>
        <option v-for="emp in employees" :key="emp.id" :value="emp.id">
          {{ emp.first_name }} {{ emp.last_name }}
        </option>
      </select>
      <select v-model="statusFilter" class="filter-select">
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="processed">Processed</option>
        <option value="paid">Paid</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <!-- Salary Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Month/Year</th>
            <th>Base Salary</th>
            <th>Bonuses</th>
            <th>Overtime</th>
            <th>Deductions</th>
            <th>Net Salary</th>
            <th>Payment Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="salary in paginatedSalaries" :key="salary.id">
            <td class="employee-name">{{ salary.employee?.first_name }} {{ salary.employee?.last_name }}</td>
            <td>{{ formatMonthYear(salary.month_year) }}</td>
            <td>${{ formatPrice(salary.base_salary) }}</td>
            <td class="text-success">+${{ formatPrice(salary.bonuses || 0) }}</td>
            <td class="text-success">+${{ formatPrice(salary.overtime_amount || 0) }}</td>
            <td class="text-danger">-${{ formatPrice(salary.deductions || 0) }}</td>
            <td class="amount">${{ formatPrice(salary.net_salary) }}</td>
            <td>{{ formatDate(salary.payment_date) }}</td>
            <td>
              <span :class="['status-badge', salary.status]">
                {{ getStatusText(salary.status) }}
              </span>
            </td>
            <td class="actions">
              <button @click="viewSalary(salary)" class="btn-icon" title="View">👁️</button>
              <button 
                v-if="salary.status === 'processed'" 
                @click="markAsPaid(salary)" 
                class="btn-icon" 
                title="Mark as Paid"
              >💰</button>
              <button 
                v-if="salary.status === 'pending'" 
                @click="editSalary(salary)" 
                class="btn-icon" 
                title="Edit"
              >✏️</button>
              <button 
                v-if="salary.status === 'pending'" 
                @click="cancelSalary(salary)" 
                class="btn-icon" 
                title="Cancel"
              >❌</button>
            </td>
          </tr>
          <tr v-if="filteredSalaries.length === 0">
            <td colspan="10" class="empty-state">No salary records found</td>
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

    <!-- Process Salary Modal -->
    <div v-if="showProcessModal" class="modal-overlay" @click.self="closeProcessModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Process Salary</h2>
          <button @click="closeProcessModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="submitProcessSalary">
            <div class="form-group">
              <label>Select Employee *</label>
              <select v-model="processForm.employee_id" class="form-control" required @change="loadEmployeeDetails">
                <option value="">Select employee</option>
                <option v-for="emp in activeEmployees" :key="emp.id" :value="emp.id">
                  {{ emp.first_name }} {{ emp.last_name }} - {{ emp.position || 'No Position' }}
                </option>
              </select>
            </div>

            <div v-if="selectedEmployee" class="employee-details">
              <div class="detail-row">
                <span>Base Salary:</span>
                <strong>${{ formatPrice(selectedEmployee.base_salary) }}</strong>
              </div>
              <div class="detail-row">
                <span>Department:</span>
                <span>{{ selectedEmployee.department || '-' }}</span>
              </div>
              <div class="detail-row">
                <span>Position:</span>
                <span>{{ selectedEmployee.position || '-' }}</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Month/Year *</label>
                <input type="month" v-model="processForm.month_year" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Payment Date</label>
                <input type="date" v-model="processForm.payment_date" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Bonuses</label>
                <input type="number" v-model="processForm.bonuses" class="form-control" step="0.01" @input="calculateNet" />
              </div>
              <div class="form-group">
                <label>Commission</label>
                <input type="number" v-model="processForm.commissions" class="form-control" step="0.01" @input="calculateNet" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Overtime Hours</label>
                <input type="number" v-model="processForm.overtime_hours" class="form-control" step="0.5" @input="calculateNet" />
              </div>
              <div class="form-group">
                <label>Overtime Rate</label>
                <input type="number" v-model="processForm.overtime_rate" class="form-control" step="0.01" @input="calculateNet" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Deductions</label>
                <input type="number" v-model="processForm.deductions" class="form-control" step="0.01" @input="calculateNet" />
              </div>
              <div class="form-group">
                <label>Tax Amount</label>
                <input type="number" v-model="processForm.tax_amount" class="form-control" step="0.01" @input="calculateNet" />
              </div>
            </div>

            <div class="form-group">
              <label>Social Security</label>
              <input type="number" v-model="processForm.social_security" class="form-control" step="0.01" @input="calculateNet" />
            </div>

            <div class="salary-summary">
              <h3>Salary Summary</h3>
              <div class="summary-row">
                <span>Base Salary:</span>
                <strong>${{ formatPrice(processForm.base_salary || 0) }}</strong>
              </div>
              <div class="summary-row text-success">
                <span>+ Bonuses:</span>
                <strong>${{ formatPrice(processForm.bonuses || 0) }}</strong>
              </div>
              <div class="summary-row text-success">
                <span>+ Commission:</span>
                <strong>${{ formatPrice(processForm.commissions || 0) }}</strong>
              </div>
              <div class="summary-row text-success">
                <span>+ Overtime:</span>
                <strong>${{ formatPrice(processForm.overtime_amount || 0) }}</strong>
              </div>
              <div class="summary-row text-danger">
                <span>- Deductions:</span>
                <strong>${{ formatPrice(processForm.deductions || 0) }}</strong>
              </div>
              <div class="summary-row text-danger">
                <span>- Tax:</span>
                <strong>${{ formatPrice(processForm.tax_amount || 0) }}</strong>
              </div>
              <div class="summary-row text-danger">
                <span>- Social Security:</span>
                <strong>${{ formatPrice(processForm.social_security || 0) }}</strong>
              </div>
              <div class="summary-row total">
                <span>Net Salary:</span>
                <strong>${{ formatPrice(netSalary) }}</strong>
              </div>
            </div>

            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="processForm.notes" rows="2" class="form-control"></textarea>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeProcessModal" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="processing">
                {{ processing ? 'Processing...' : 'Process Salary' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View Salary Modal -->
    <div v-if="showViewModal && selectedSalary" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Salary Details</h2>
          <button @click="closeViewModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="salary-details">
            <div class="detail-section">
              <h3>Employee Information</h3>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{ selectedSalary.employee?.first_name }} {{ selectedSalary.employee?.last_name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Position:</span>
                <span class="detail-value">{{ selectedSalary.employee?.position || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Department:</span>
                <span class="detail-value">{{ selectedSalary.employee?.department || '-' }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Salary Details</h3>
              <div class="detail-row">
                <span class="detail-label">Month/Year:</span>
                <span class="detail-value">{{ formatMonthYear(selectedSalary.month_year) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Base Salary:</span>
                <span class="detail-value">${{ formatPrice(selectedSalary.base_salary) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Bonuses:</span>
                <span class="detail-value text-success">+${{ formatPrice(selectedSalary.bonuses || 0) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Commission:</span>
                <span class="detail-value text-success">+${{ formatPrice(selectedSalary.commissions || 0) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Overtime:</span>
                <span class="detail-value text-success">
                  {{ selectedSalary.overtime_hours || 0 }} hrs @ ${{ formatPrice(selectedSalary.overtime_rate || 0) }}
                  = +${{ formatPrice(selectedSalary.overtime_amount || 0) }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Deductions:</span>
                <span class="detail-value text-danger">-${{ formatPrice(selectedSalary.deductions || 0) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Tax:</span>
                <span class="detail-value text-danger">-${{ formatPrice(selectedSalary.tax_amount || 0) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Social Security:</span>
                <span class="detail-value text-danger">-${{ formatPrice(selectedSalary.social_security || 0) }}</span>
              </div>
              <div class="detail-row total">
                <span class="detail-label">Net Salary:</span>
                <span class="detail-value amount">${{ formatPrice(selectedSalary.net_salary) }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Payment Information</h3>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span :class="['status-badge', selectedSalary.status]">
                  {{ getStatusText(selectedSalary.status) }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Date:</span>
                <span class="detail-value">{{ formatDate(selectedSalary.payment_date) || 'Not paid' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">{{ getMethodText(selectedSalary.payment_method) }}</span>
              </div>
              <div class="detail-row" v-if="selectedSalary.transaction_id">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">{{ selectedSalary.transaction_id }}</span>
              </div>
            </div>

            <div class="detail-section" v-if="selectedSalary.notes">
              <h3>Notes</h3>
              <p class="notes-text">{{ selectedSalary.notes }}</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeViewModal" class="btn-secondary">Close</button>
          <button 
            v-if="selectedSalary.status === 'processed'" 
            @click="markAsPaid(selectedSalary)" 
            class="btn-primary"
          >
            Mark as Paid
          </button>
          <button @click="downloadPayslip(selectedSalary)" class="btn-primary">Download Payslip</button>
        </div>
      </div>
    </div>

    <!-- Edit Salary Modal -->
    <div v-if="showEditModal && selectedSalary" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Edit Salary</h2>
          <button @click="closeEditModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Bonuses</label>
            <input type="number" v-model="editForm.bonuses" class="form-control" step="0.01" />
          </div>
          <div class="form-group">
            <label>Deductions</label>
            <input type="number" v-model="editForm.deductions" class="form-control" step="0.01" />
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="editForm.notes" rows="3" class="form-control"></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeEditModal" class="btn-secondary">Cancel</button>
          <button @click="updateSalary" class="btn-primary">Update</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { api } from '../../api';

Chart.register(...registerables);

const salaries = ref([]);
const employees = ref([]);
const monthFilter = ref('');
const yearFilter = ref('');
const employeeFilter = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showProcessModal = ref(false);
const showViewModal = ref(false);
const showEditModal = ref(false);
const selectedSalary = ref(null);
const selectedEmployee = ref(null);
const processing = ref(false);

const stats = ref({
  yearlyTotal: 0,
  lastMonthTotal: 0,
  activeEmployees: 0,
  averageSalary: 0
});

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

const years = computed(() => {
  const currentYear = new Date().getFullYear();
  return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
});

const activeEmployees = computed(() => {
  return employees.value.filter(emp => emp.status === 'active');
});

const processForm = ref({
  employee_id: '',
  month_year: new Date().toISOString().slice(0, 7),
  payment_date: new Date().toISOString().slice(0, 10),
  base_salary: 0,
  bonuses: 0,
  commissions: 0,
  overtime_hours: 0,
  overtime_rate: 0,
  overtime_amount: 0,
  deductions: 0,
  tax_amount: 0,
  social_security: 0,
  notes: ''
});

const editForm = ref({
  bonuses: 0,
  deductions: 0,
  notes: ''
});

const netSalary = computed(() => {
  const base = parseFloat(processForm.value.base_salary || 0);
  const bonuses = parseFloat(processForm.value.bonuses || 0);
  const commissions = parseFloat(processForm.value.commissions || 0);
  const overtime = parseFloat(processForm.value.overtime_amount || 0);
  const deductions = parseFloat(processForm.value.deductions || 0);
  const tax = parseFloat(processForm.value.tax_amount || 0);
  const social = parseFloat(processForm.value.social_security || 0);
  
  return base + bonuses + commissions + overtime - deductions - tax - social;
});

const filteredSalaries = computed(() => {
  let filtered = salaries.value;
  
  if (monthFilter.value) {
    filtered = filtered.filter(s => {
      const month = new Date(s.month_year).getMonth() + 1;
      return month.toString() === monthFilter.value;
    });
  }
  
  if (yearFilter.value) {
    filtered = filtered.filter(s => {
      const year = new Date(s.month_year).getFullYear();
      return year.toString() === yearFilter.value;
    });
  }
  
  if (employeeFilter.value) {
    filtered = filtered.filter(s => s.employee_id.toString() === employeeFilter.value);
  }
  
  if (statusFilter.value) {
    filtered = filtered.filter(s => s.status === statusFilter.value);
  }
  
  return filtered;
});

const totalPages = computed(() => {
  return Math.ceil(filteredSalaries.value.length / itemsPerPage.value);
});

const paginatedSalaries = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredSalaries.value.slice(start, end);
});

let salaryChart = null;

const formatPrice = (price) => {
  return Number(price).toFixed(2);
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
};

const formatMonthYear = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const getStatusText = (status) => {
  const statusMap = {
    pending: 'Pending',
    processed: 'Processed',
    paid: 'Paid',
    cancelled: 'Cancelled'
  };
  return statusMap[status] || status;
};

const getMethodText = (method) => {
  const methodMap = {
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    check: 'Check'
  };
  return methodMap[method] || method;
};

const loadSalaries = async () => {
  try {
    const response = await api.get('/salary');
    if (response.success) {
      salaries.value = response.salaries;
      calculateStats();
      updateChart();
    } else {
      // Demo data
      salaries.value = [
        {
          id: 1,
          employee_id: 1,
          employee: { first_name: 'Ahmed', last_name: 'Ben Ali', position: 'Sales Manager', department: 'Sales' },
          month_year: '2024-03-01',
          base_salary: 3500,
          bonuses: 500,
          commissions: 200,
          overtime_hours: 5,
          overtime_rate: 20,
          overtime_amount: 100,
          deductions: 150,
          tax_amount: 350,
          social_security: 280,
          net_salary: 3520,
          payment_date: '2024-03-31',
          status: 'paid',
          payment_method: 'bank_transfer',
          transaction_id: 'TXN123456',
          notes: 'March salary'
        },
        {
          id: 2,
          employee_id: 2,
          employee: { first_name: 'Sarra', last_name: 'Mansour', position: 'Technical Lead', department: 'Technical' },
          month_year: '2024-03-01',
          base_salary: 4200,
          bonuses: 300,
          commissions: 0,
          overtime_hours: 0,
          overtime_rate: 0,
          overtime_amount: 0,
          deductions: 100,
          tax_amount: 420,
          social_security: 336,
          net_salary: 3644,
          payment_date: '2024-03-31',
          status: 'paid',
          payment_method: 'bank_transfer',
          transaction_id: 'TXN123457',
          notes: ''
        },
        {
          id: 3,
          employee_id: 1,
          employee: { first_name: 'Ahmed', last_name: 'Ben Ali', position: 'Sales Manager', department: 'Sales' },
          month_year: '2024-02-01',
          base_salary: 3500,
          bonuses: 400,
          commissions: 150,
          overtime_hours: 3,
          overtime_rate: 20,
          overtime_amount: 60,
          deductions: 120,
          tax_amount: 340,
          social_security: 272,
          net_salary: 3378,
          payment_date: '2024-02-29',
          status: 'paid',
          payment_method: 'bank_transfer',
          transaction_id: 'TXN123450',
          notes: ''
        }
      ];
      calculateStats();
      updateChart();
    }
  } catch (error) {
    console.error('Error loading salaries:', error);
  }
};

const loadEmployees = async () => {
  try {
    const response = await api.get('/employees');
    if (response.success) {
      employees.value = response.employees;
    } else {
      employees.value = [
        { id: 1, first_name: 'Ahmed', last_name: 'Ben Ali', position: 'Sales Manager', department: 'Sales', status: 'active', base_salary: 3500 },
        { id: 2, first_name: 'Sarra', last_name: 'Mansour', position: 'Technical Lead', department: 'Technical', status: 'active', base_salary: 4200 },
        { id: 3, first_name: 'Mohamed', last_name: 'Said', position: 'Support Engineer', department: 'Support', status: 'active', base_salary: 2800 }
      ];
    }
  } catch (error) {
    console.error('Error loading employees:', error);
  }
};

const calculateStats = () => {
  const currentYear = new Date().getFullYear();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  stats.value.yearlyTotal = salaries.value
    .filter(s => new Date(s.month_year).getFullYear() === currentYear && s.status === 'paid')
    .reduce((sum, s) => sum + parseFloat(s.net_salary), 0);
  
  stats.value.lastMonthTotal = salaries.value
    .filter(s => {
      const date = new Date(s.month_year);
      return date.getMonth() === lastMonth.getMonth() && 
             date.getFullYear() === lastMonth.getFullYear() &&
             s.status === 'paid';
    })
    .reduce((sum, s) => sum + parseFloat(s.net_salary), 0);
  
  stats.value.activeEmployees = employees.value.filter(e => e.status === 'active').length;
  
  const paidSalaries = salaries.value.filter(s => s.status === 'paid');
  if (paidSalaries.length > 0) {
    stats.value.averageSalary = paidSalaries.reduce((sum, s) => sum + parseFloat(s.net_salary), 0) / paidSalaries.length;
  } else {
    stats.value.averageSalary = 0;
  }
};

const updateChart = () => {
  const ctx = document.getElementById('salaryChart')?.getContext('2d');
  if (!ctx) return;
  
  const monthlyData = {};
  salaries.value.forEach(salary => {
    const date = new Date(salary.month_year);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!monthlyData[key]) {
      monthlyData[key] = { month: key, total: 0, count: 0 };
    }
    monthlyData[key].total += parseFloat(salary.net_salary);
    monthlyData[key].count++;
  });
  
  const sortedMonths = Object.keys(monthlyData).sort();
  const labels = sortedMonths.map(m => {
    const [year, month] = m.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });
  const values = sortedMonths.map(m => monthlyData[m].total);
  
  if (salaryChart) {
    salaryChart.destroy();
  }
  
  salaryChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Salary Paid',
        data: values,
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
        legend: {
          position: 'top',
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        }
      }
    }
  });
};

const loadEmployeeDetails = () => {
  if (processForm.value.employee_id) {
    selectedEmployee.value = employees.value.find(e => e.id === parseInt(processForm.value.employee_id));
    processForm.value.base_salary = selectedEmployee.value?.base_salary || 0;
    calculateNet();
  } else {
    selectedEmployee.value = null;
  }
};

const calculateNet = () => {
  const overtime = (processForm.value.overtime_hours || 0) * (processForm.value.overtime_rate || 0);
  processForm.value.overtime_amount = overtime;
};

const submitProcessSalary = async () => {
  if (!processForm.value.employee_id || !processForm.value.month_year) {
    alert('Please fill in all required fields');
    return;
  }
  
  processing.value = true;
  try {
    const response = await api.post('/salary/process', {
      employee_id: processForm.value.employee_id,
      month_year: processForm.value.month_year,
      base_salary: processForm.value.base_salary,
      bonuses: processForm.value.bonuses,
      commissions: processForm.value.commissions,
      overtime_hours: processForm.value.overtime_hours,
      overtime_rate: processForm.value.overtime_rate,
      overtime_amount: processForm.value.overtime_amount,
      deductions: processForm.value.deductions,
      tax_amount: processForm.value.tax_amount,
      social_security: processForm.value.social_security,
      net_salary: netSalary.value,
      payment_date: processForm.value.payment_date,
      notes: processForm.value.notes
    });
    
    if (response.success) {
      alert('Salary processed successfully');
      closeProcessModal();
      await loadSalaries();
    }
  } catch (error) {
    console.error('Error processing salary:', error);
    alert('Failed to process salary');
  } finally {
    processing.value = false;
  }
};

const viewSalary = (salary) => {
  selectedSalary.value = salary;
  showViewModal.value = true;
};

const editSalary = (salary) => {
  selectedSalary.value = salary;
  editForm.value = {
    bonuses: salary.bonuses || 0,
    deductions: salary.deductions || 0,
    notes: salary.notes || ''
  };
  showEditModal.value = true;
};

const updateSalary = async () => {
  try {
    const response = await api.put(`/salary/${selectedSalary.value.id}`, editForm.value);
    if (response.success) {
      alert('Salary updated successfully');
      closeEditModal();
      await loadSalaries();
    }
  } catch (error) {
    console.error('Error updating salary:', error);
    alert('Failed to update salary');
  }
};

const markAsPaid = async (salary) => {
  if (confirm('Mark this salary as paid?')) {
    try {
      const response = await api.put(`/salary/${salary.id}/pay`, {
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: 'bank_transfer'
      });
      if (response.success) {
        alert('Salary marked as paid');
        await loadSalaries();
        closeViewModal();
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Failed to mark as paid');
    }
  }
};

const cancelSalary = async (salary) => {
  if (confirm('Cancel this salary record?')) {
    try {
      const response = await api.delete(`/salary/${salary.id}`);
      if (response.success) {
        alert('Salary cancelled');
        await loadSalaries();
      }
    } catch (error) {
      console.error('Error cancelling salary:', error);
      alert('Failed to cancel salary');
    }
  }
};

const downloadPayslip = (salary) => {
  const payslip = `
    =========================================
              PAYSLIP
    =========================================
    Employee: ${salary.employee?.first_name} ${salary.employee?.last_name}
    Position: ${salary.employee?.position || '-'}
    Department: ${salary.employee?.department || '-'}
    Month: ${formatMonthYear(salary.month_year)}
    =========================================
    EARNINGS
    -----------------------------------------
    Base Salary:                    $${formatPrice(salary.base_salary)}
    Bonuses:                        $${formatPrice(salary.bonuses || 0)}
    Commission:                     $${formatPrice(salary.commissions || 0)}
    Overtime:                       $${formatPrice(salary.overtime_amount || 0)}
    -----------------------------------------
    DEDUCTIONS
    -----------------------------------------
    Deductions:                     $${formatPrice(salary.deductions || 0)}
    Tax:                            $${formatPrice(salary.tax_amount || 0)}
    Social Security:                $${formatPrice(salary.social_security || 0)}
    -----------------------------------------
    NET PAY:                        $${formatPrice(salary.net_salary)}
    =========================================
    Payment Date: ${formatDate(salary.payment_date)}
    Payment Method: ${getMethodText(salary.payment_method)}
    Status: ${getStatusText(salary.status)}
    =========================================
  `;
  
  const blob = new Blob([payslip], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `payslip_${salary.employee?.first_name}_${formatMonthYear(salary.month_year)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

const closeProcessModal = () => {
  showProcessModal.value = false;
  processForm.value = {
    employee_id: '',
    month_year: new Date().toISOString().slice(0, 7),
    payment_date: new Date().toISOString().slice(0, 10),
    base_salary: 0,
    bonuses: 0,
    commissions: 0,
    overtime_hours: 0,
    overtime_rate: 0,
    overtime_amount: 0,
    deductions: 0,
    tax_amount: 0,
    social_security: 0,
    notes: ''
  };
  selectedEmployee.value = null;
};

const closeViewModal = () => {
  showViewModal.value = false;
  selectedSalary.value = null;
};

const closeEditModal = () => {
  showEditModal.value = false;
  selectedSalary.value = null;
  editForm.value = { bonuses: 0, deductions: 0, notes: '' };
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

watch([monthFilter, yearFilter, employeeFilter, statusFilter], () => {
  currentPage.value = 1;
});

onMounted(() => {
  loadSalaries();
  loadEmployees();
});
</script>

<style scoped>
.salary-page {
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

.chart-container {
  margin-bottom: 30px;
}

.chart-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
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

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
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
  min-width: 900px;
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

.employee-name {
  font-weight: 500;
  color: #667eea;
}

.amount {
  font-weight: 600;
  color: #28a745;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.paid {
  background: #d4edda;
  color: #155724;
}

.status-badge.processed {
  background: #cce5ff;
  color: #004085;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.cancelled {
  background: #f8d7da;
  color: #721c24;
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

.employee-details {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
}

.salary-summary {
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

.salary-details {
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

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .filter-select {
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