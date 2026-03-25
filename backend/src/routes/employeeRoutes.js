const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Employee routes
router.get('/', employeeController.getAllEmployees);
router.get('/stats', employeeController.getEmployeeStats);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

// Client management for admin
router.get('/clients', employeeController.getAllClients);
router.post('/clients', employeeController.createClient);
router.put('/clients/:id', employeeController.updateClient);
router.put('/clients/:id/toggle-status', employeeController.toggleClientStatus);

module.exports = router;