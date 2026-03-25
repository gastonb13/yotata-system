const { Employee, User, Client, ActivityLog, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

const getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            include: [{ model: User, as: 'user', attributes: ['id', 'email', 'is_active'] }],
            raw: true,
            nest: true
        });
        res.json({ success: true, employees: employees || [] });
    } catch (error) {
        console.error('Get employees error:', error);
        res.json({ success: true, employees: [] });
    }
};

const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id, {
            include: [{ model: User, as: 'user', attributes: ['id', 'email', 'is_active'] }]
        });
        res.json({ success: true, employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createEmployee = async (req, res) => {
    try {
        const { email, password, first_name, last_name, position, department, base_salary } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            password_hash: hashedPassword,
            role: 'employee',
            is_active: true
        });

        const employeeCode = `EMP-${Date.now()}`;
        const employee = await Employee.create({
            user_id: user.id,
            employee_code: employeeCode,
            first_name,
            last_name,
            position,
            department,
            base_salary: base_salary || 0,
            status: 'active'
        });

        res.json({ success: true, message: 'Employee created successfully', employee });
    } catch (error) {
        console.error('Create employee error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        await employee.update(req.body);
        res.json({ success: true, message: 'Employee updated successfully', employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        await employee.update({ status: 'terminated' });
        await User.update({ is_active: false }, { where: { id: employee.user_id } });
        res.json({ success: true, message: 'Employee deactivated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getEmployeeStats = async (req, res) => {
    try {
        const total = await Employee.count();
        const active = await Employee.count({ where: { status: 'active' } });
        res.json({ success: true, stats: { total, active, monthlySalary: 0, departmentsCount: 0 } });
    } catch (error) {
        res.json({ success: true, stats: { total: 0, active: 0, monthlySalary: 0, departmentsCount: 0 } });
    }
};

// Admin endpoints for clients
const getAllClients = async (req, res) => {
    try {
        const clients = await Client.findAll({
            include: [{ model: User, as: 'user', attributes: ['id', 'email', 'is_active'] }],
            raw: true,
            nest: true
        });
        res.json({ success: true, clients: clients || [] });
    } catch (error) {
        console.error('Get clients error:', error);
        res.json({ success: true, clients: [] });
    }
};

const createClient = async (req, res) => {
    try {
        const { email, password, company_name, phone, address } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            password_hash: hashedPassword,
            role: 'client',
            is_active: true
        });

        const client = await Client.create({
            user_id: user.id,
            company_name,
            phone,
            address
        });

        res.json({ success: true, message: 'Client created successfully', client });
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateClient = async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id);
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        await client.update(req.body);
        res.json({ success: true, message: 'Client updated successfully', client });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleClientStatus = async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id);
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        const user = await User.findByPk(client.user_id);
        await user.update({ is_active: !user.is_active });
        res.json({ success: true, message: 'Client status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeStats,
    getAllClients,
    createClient,
    updateClient,
    toggleClientStatus
};