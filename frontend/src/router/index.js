import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/client',
    component: () => import('../layouts/ClientLayout.vue'),
    meta: { requiresAuth: true, role: 'client' },
    children: [
      { path: 'dashboard', name: 'ClientDashboard', component: () => import('../views/client/Dashboard.vue') },
      { path: 'orders', name: 'ClientOrders', component: () => import('../views/client/Orders.vue') },
      { path: 'orders/:id', name: 'ClientOrderDetail', component: () => import('../views/client/OrderDetail.vue') },
      { path: 'requests', name: 'ClientRequests', component: () => import('../views/client/Requests.vue') },
      { path: 'documents', name: 'ClientDocuments', component: () => import('../views/client/Documents.vue') },
      { path: 'profile', name: 'ClientProfile', component: () => import('../views/client/Profile.vue') }
    ]
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('../views/admin/Dashboard.vue') },
      { path: 'clients', name: 'AdminClients', component: () => import('../views/admin/Clients.vue') },
      { path: 'employees', name: 'AdminEmployees', component: () => import('../views/admin/Employees.vue') },
      { path: 'orders', name: 'AdminOrders', component: () => import('../views/admin/Orders.vue') },
      { path: 'products', name: 'AdminProducts', component: () => import('../views/admin/Products.vue') },
      { path: 'payments', name: 'AdminPayments', component: () => import('../views/admin/Payments.vue') },
      { path: 'salary', name: 'AdminSalary', component: () => import('../views/admin/Salary.vue') },
      { path: 'reports', name: 'AdminReports', component: () => import('../views/admin/Reports.vue') }
    ]
  },
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // If token exists but no user, try to fetch user
  if (authStore.token && !authStore.user) {
    await authStore.checkAuth()
  }
  
  const isAuthenticated = authStore.isAuthenticated
  const userRole = authStore.user?.role
  
  console.log('Router guard - isAuthenticated:', isAuthenticated, 'role:', userRole)
  console.log('Navigating to:', to.path)
  
  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      next('/login')
    } else if (to.meta.role && userRole !== to.meta.role) {
      // Redirect to correct dashboard
      if (userRole === 'admin') {
        next('/admin/dashboard')
      } else if (userRole === 'client') {
        next('/client/dashboard')
      } else {
        next('/login')
      }
    } else {
      next()
    }
  } else if (to.meta.guest && isAuthenticated) {
    // Redirect authenticated users to their dashboard
    if (userRole === 'admin') {
      next('/admin/dashboard')
    } else if (userRole === 'client') {
      next('/client/dashboard')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router