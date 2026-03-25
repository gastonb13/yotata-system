<template>
  <div class="profile-page">
    <div class="page-header">
      <h1>My Profile</h1>
      <p>Manage your account information</p>
    </div>

    <div class="profile-container">
      <!-- Profile Tabs -->
      <div class="profile-tabs">
        <button 
          @click="activeTab = 'personal'" 
          :class="['tab-btn', { active: activeTab === 'personal' }]"
        >
          Personal Information
        </button>
        <button 
          @click="activeTab = 'security'" 
          :class="['tab-btn', { active: activeTab === 'security' }]"
        >
          Security
        </button>
        <button 
          @click="activeTab = 'preferences'" 
          :class="['tab-btn', { active: activeTab === 'preferences' }]"
        >
          Preferences
        </button>
      </div>

      <!-- Personal Information Tab -->
      <div v-if="activeTab === 'personal'" class="tab-content">
        <form @submit.prevent="updateProfile" class="profile-form">
          <div class="form-row">
            <div class="form-group">
              <label>Company Name *</label>
              <input 
                type="text" 
                v-model="profile.company_name" 
                class="form-control"
                required
              />
            </div>
            
            <div class="form-group">
              <label>Contact Person</label>
              <input 
                type="text" 
                v-model="profile.contact_person" 
                class="form-control"
                placeholder="Full name of primary contact"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Email *</label>
              <input 
                type="email" 
                v-model="profile.email" 
                class="form-control"
                readonly
                disabled
              />
              <small class="form-hint">Email cannot be changed</small>
            </div>
            
            <div class="form-group">
              <label>Phone</label>
              <input 
                type="tel" 
                v-model="profile.phone" 
                class="form-control"
                placeholder="+216 XX XXX XXX"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Mobile</label>
              <input 
                type="tel" 
                v-model="profile.mobile" 
                class="form-control"
                placeholder="Mobile number"
              />
            </div>
            
            <div class="form-group">
              <label>Tax Number / VAT</label>
              <input 
                type="text" 
                v-model="profile.tax_number" 
                class="form-control"
                placeholder="Tax identification number"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Address</label>
            <textarea 
              v-model="profile.address" 
              rows="3" 
              class="form-control"
              placeholder="Street address, building, floor"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>City</label>
              <input 
                type="text" 
                v-model="profile.city" 
                class="form-control"
                placeholder="City"
              />
            </div>
            
            <div class="form-group">
              <label>Country</label>
              <select v-model="profile.country" class="form-control">
                <option value="Tunisia">Tunisia</option>
                <option value="Algeria">Algeria</option>
                <option value="Morocco">Morocco</option>
                <option value="Egypt">Egypt</option>
                <option value="Libya">Libya</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Notes</label>
            <textarea 
              v-model="profile.notes" 
              rows="2" 
              class="form-control"
              placeholder="Additional information about your company"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
            <button type="button" @click="resetForm" class="btn-secondary">Reset</button>
          </div>
        </form>
      </div>

      <!-- Security Tab -->
      <div v-if="activeTab === 'security'" class="tab-content">
        <form @submit.prevent="changePassword" class="security-form">
          <div class="form-group">
            <label>Current Password *</label>
            <input 
              type="password" 
              v-model="passwordData.current" 
              class="form-control"
              required
            />
          </div>

          <div class="form-group">
            <label>New Password *</label>
            <input 
              type="password" 
              v-model="passwordData.new" 
              class="form-control"
              required
              @input="validatePassword"
            />
            <div v-if="passwordErrors.new" class="error-message">
              {{ passwordErrors.new }}
            </div>
          </div>

          <div class="form-group">
            <label>Confirm New Password *</label>
            <input 
              type="password" 
              v-model="passwordData.confirm" 
              class="form-control"
              required
              @input="validatePassword"
            />
            <div v-if="passwordErrors.confirm" class="error-message">
              {{ passwordErrors.confirm }}
            </div>
          </div>

          <div class="password-strength" v-if="passwordData.new">
            <div class="strength-bar">
              <div :class="['strength-level', strengthClass]" :style="{ width: strengthPercent }"></div>
            </div>
            <p class="strength-text">Password strength: {{ strengthText }}</p>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="!canChangePassword || changingPassword">
              {{ changingPassword ? 'Changing...' : 'Change Password' }}
            </button>
          </div>
        </form>

        <div class="security-info">
          <h3>Security Tips</h3>
          <ul>
            <li>Use a strong password with at least 8 characters</li>
            <li>Include uppercase and lowercase letters, numbers, and symbols</li>
            <li>Don't reuse passwords from other accounts</li>
            <li>Never share your password with anyone</li>
            <li>Enable two-factor authentication for extra security</li>
          </ul>
        </div>
      </div>

      <!-- Preferences Tab -->
      <div v-if="activeTab === 'preferences'" class="tab-content">
        <form @submit.prevent="updatePreferences" class="preferences-form">
          <div class="form-group">
            <label>Language</label>
            <select v-model="preferences.language" class="form-control">
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="ar">Arabic</option>
            </select>
          </div>

          <div class="form-group">
            <label>Timezone</label>
            <select v-model="preferences.timezone" class="form-control">
              <option value="UTC">UTC</option>
              <option value="Africa/Tunis">Africa/Tunis</option>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </div>

          <div class="form-group">
            <label>Currency</label>
            <select v-model="preferences.currency" class="form-control">
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="TND">TND - Tunisian Dinar</option>
            </select>
          </div>

          <div class="form-group">
            <label>Date Format</label>
            <select v-model="preferences.date_format" class="form-control">
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="preferences.email_notifications" />
              <span>Receive email notifications about orders and updates</span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="preferences.sms_notifications" />
              <span>Receive SMS notifications for important updates</span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="preferences.newsletter" />
              <span>Subscribe to newsletter and promotions</span>
            </label>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="savingPreferences">
              {{ savingPreferences ? 'Saving...' : 'Save Preferences' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Account Actions -->
    <div class="account-actions">
      <h3>Account Actions</h3>
      <div class="actions-grid">
        <div class="action-card" @click="downloadData">
          <span class="action-icon">📥</span>
          <h4>Download My Data</h4>
          <p>Export all your personal data</p>
        </div>
        <div class="action-card" @click="showDeleteModal = true">
          <span class="action-icon">🗑️</span>
          <h4>Delete Account</h4>
          <p>Permanently delete your account</p>
        </div>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Delete Account</h2>
          <button @click="closeDeleteModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="warning-message">
            <span class="warning-icon">⚠️</span>
            <p><strong>Warning:</strong> This action cannot be undone. This will permanently delete:</p>
            <ul>
              <li>Your profile information</li>
              <li>All your orders and transaction history</li>
              <li>All uploaded documents</li>
              <li>All support requests</li>
            </ul>
          </div>
          
          <div class="form-group">
            <label>Please type <strong>{{ userEmail }}</strong> to confirm</label>
            <input 
              type="text" 
              v-model="deleteConfirmEmail" 
              class="form-control"
              placeholder="Enter your email to confirm"
            />
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-secondary">Cancel</button>
          <button 
            @click="deleteAccount" 
            class="btn-danger" 
            :disabled="deleteConfirmEmail !== userEmail || deleting"
          >
            {{ deleting ? 'Deleting...' : 'Permanently Delete Account' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { api } from '../../api';

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref('personal');
const saving = ref(false);
const changingPassword = ref(false);
const savingPreferences = ref(false);
const deleting = ref(false);
const showDeleteModal = ref(false);
const deleteConfirmEmail = ref('');

const profile = reactive({
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  mobile: '',
  address: '',
  city: '',
  country: 'Tunisia',
  tax_number: '',
  notes: ''
});

const passwordData = reactive({
  current: '',
  new: '',
  confirm: ''
});

const passwordErrors = reactive({
  new: '',
  confirm: ''
});

const preferences = reactive({
  language: 'en',
  timezone: 'Africa/Tunis',
  currency: 'TND',
  date_format: 'DD/MM/YYYY',
  email_notifications: true,
  sms_notifications: false,
  newsletter: true
});

const userEmail = computed(() => authStore.user?.email || '');

const strengthText = computed(() => {
  const strength = calculatePasswordStrength(passwordData.new);
  if (strength < 30) return 'Very Weak';
  if (strength < 50) return 'Weak';
  if (strength < 70) return 'Fair';
  if (strength < 90) return 'Good';
  return 'Strong';
});

const strengthClass = computed(() => {
  const strength = calculatePasswordStrength(passwordData.new);
  if (strength < 30) return 'very-weak';
  if (strength < 50) return 'weak';
  if (strength < 70) return 'fair';
  if (strength < 90) return 'good';
  return 'strong';
});

const strengthPercent = computed(() => {
  return calculatePasswordStrength(passwordData.new) + '%';
});

const canChangePassword = computed(() => {
  return passwordData.current && 
         passwordData.new && 
         passwordData.confirm && 
         !passwordErrors.new && 
         !passwordErrors.confirm &&
         passwordData.new === passwordData.confirm;
});

const calculatePasswordStrength = (password) => {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.match(/[a-z]/)) strength += 15;
  if (password.match(/[A-Z]/)) strength += 15;
  if (password.match(/[0-9]/)) strength += 15;
  if (password.match(/[^a-zA-Z0-9]/)) strength += 30;
  return Math.min(strength, 100);
};

const validatePassword = () => {
  if (passwordData.new) {
    if (passwordData.new.length < 8) {
      passwordErrors.new = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(passwordData.new)) {
      passwordErrors.new = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(passwordData.new)) {
      passwordErrors.new = 'Password must contain at least one number';
    } else {
      passwordErrors.new = '';
    }
  } else {
    passwordErrors.new = '';
  }
  
  if (passwordData.confirm && passwordData.new !== passwordData.confirm) {
    passwordErrors.confirm = 'Passwords do not match';
  } else {
    passwordErrors.confirm = '';
  }
};

const loadProfile = async () => {
  try {
    const response = await api.get('/clients/profile');
    if (response.success) {
      const client = response.client;
      profile.company_name = client.company_name || '';
      profile.contact_person = client.contact_person || '';
      profile.email = client.user?.email || authStore.user?.email || '';
      profile.phone = client.phone || '';
      profile.mobile = client.mobile || '';
      profile.address = client.address || '';
      profile.city = client.city || '';
      profile.country = client.country || 'Tunisia';
      profile.tax_number = client.tax_number || '';
      profile.notes = client.notes || '';
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
};

const updateProfile = async () => {
  saving.value = true;
  try {
    const response = await api.put('/clients/profile', {
      company_name: profile.company_name,
      contact_person: profile.contact_person,
      phone: profile.phone,
      mobile: profile.mobile,
      address: profile.address,
      city: profile.city,
      country: profile.country,
      tax_number: profile.tax_number,
      notes: profile.notes
    });
    
    if (response.success) {
      alert('Profile updated successfully!');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile');
  } finally {
    saving.value = false;
  }
};

const resetForm = () => {
  loadProfile();
};

const changePassword = async () => {
  if (!canChangePassword) return;
  
  changingPassword.value = true;
  try {
    const response = await api.post('/auth/change-password', {
      currentPassword: passwordData.current,
      newPassword: passwordData.new
    });
    
    if (response.success) {
      alert('Password changed successfully!');
      passwordData.current = '';
      passwordData.new = '';
      passwordData.confirm = '';
    }
  } catch (error) {
    console.error('Error changing password:', error);
    alert(error.response?.data?.message || 'Failed to change password');
  } finally {
    changingPassword.value = false;
  }
};

const updatePreferences = async () => {
  savingPreferences.value = true;
  try {
    // Save preferences to localStorage for now
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    alert('Preferences saved successfully!');
  } catch (error) {
    console.error('Error saving preferences:', error);
    alert('Failed to save preferences');
  } finally {
    savingPreferences.value = false;
  }
};

const downloadData = () => {
  const data = {
    profile: profile,
    preferences: preferences,
    exportDate: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `yotata-data-${new Date().toISOString()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const deleteAccount = async () => {
  if (deleteConfirmEmail.value !== userEmail.value) return;
  
  deleting.value = true;
  try {
    const response = await api.delete('/auth/account');
    if (response.success) {
      alert('Account deleted successfully');
      await authStore.logout();
      router.push('/login');
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    alert('Failed to delete account');
  } finally {
    deleting.value = false;
    closeDeleteModal();
  }
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deleteConfirmEmail.value = '';
};

// Load preferences from localStorage
const loadPreferences = () => {
  const saved = localStorage.getItem('user_preferences');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(preferences, parsed);
    } catch (e) {
      console.error('Error loading preferences:', e);
    }
  }
};

onMounted(() => {
  loadProfile();
  loadPreferences();
});
</script>

<style scoped>
.profile-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.page-header p {
  color: #666;
  font-size: 14px;
}

.profile-container {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  overflow: hidden;
  margin-bottom: 30px;
}

.profile-tabs {
  display: flex;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.tab-btn {
  flex: 1;
  padding: 15px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s;
}

.tab-btn:hover {
  color: #667eea;
}

.tab-btn.active {
  color: #667eea;
  border-bottom: 2px solid #667eea;
  background: white;
}

.tab-content {
  padding: 30px;
}

.profile-form,
.security-form,
.preferences-form {
  max-width: 100%;
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
  transition: border-color 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
}

.form-control:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.form-hint {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  display: block;
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
}

.password-strength {
  margin-top: 10px;
}

.strength-bar {
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.strength-level {
  height: 100%;
  transition: width 0.3s;
}

.strength-level.very-weak { background: #dc3545; width: 20%; }
.strength-level.weak { background: #fd7e14; width: 40%; }
.strength-level.fair { background: #ffc107; width: 60%; }
.strength-level.good { background: #20c997; width: 80%; }
.strength-level.strong { background: #28a745; width: 100%; }

.strength-text {
  font-size: 12px;
  color: #666;
}

.form-actions {
  display: flex;
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
  font-weight: 500;
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
  transition: background 0.3s;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  padding: 10px 24px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input {
  width: auto;
  cursor: pointer;
}

.security-info {
  margin-top: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 5px;
}

.security-info h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #333;
}

.security-info ul {
  margin: 0;
  padding-left: 20px;
}

.security-info li {
  margin-bottom: 8px;
  color: #666;
  font-size: 14px;
}

.account-actions {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.account-actions h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: #333;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.action-card {
  padding: 20px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  border-color: #667eea;
}

.action-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 10px;
}

.action-card h4 {
  font-size: 16px;
  margin-bottom: 8px;
  color: #333;
}

.action-card p {
  font-size: 12px;
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

.warning-message {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
}

.warning-icon {
  font-size: 24px;
  display: block;
  text-align: center;
  margin-bottom: 10px;
}

.warning-message p {
  margin-bottom: 10px;
  color: #856404;
}

.warning-message ul {
  margin: 10px 0 0 20px;
  color: #856404;
}

.warning-message li {
  margin-bottom: 5px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e9ecef;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .profile-tabs {
    flex-direction: column;
  }
  
  .tab-btn {
    text-align: left;
    padding: 12px 20px;
  }
  
  .tab-btn.active {
    border-bottom: none;
    border-left: 2px solid #667eea;
  }
  
  .tab-content {
    padding: 20px;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions button {
    width: 100%;
  }
}
</style>