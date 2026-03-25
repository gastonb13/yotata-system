const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalaryPayment = sequelize.define('SalaryPayment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'employees',
            key: 'id'
        }
    },
    month_year: {
        type: DataTypes.DATE,
        allowNull: false
    },
    base_salary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    bonuses: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    commissions: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    overtime_hours: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    overtime_rate: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    overtime_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    deductions: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    social_security: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    net_salary: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    payment_date: {
        type: DataTypes.DATE
    },
    payment_method: {
        type: DataTypes.ENUM('bank_transfer', 'cash', 'check'),
        defaultValue: 'bank_transfer'
    },
    transaction_id: {
        type: DataTypes.STRING(255)
    },
    status: {
        type: DataTypes.ENUM('pending', 'processed', 'paid', 'cancelled'),
        defaultValue: 'pending'
    },
    notes: {
        type: DataTypes.TEXT
    },
    processed_by: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'salary_payments',
    timestamps: true,
    underscored: true
});

module.exports = SalaryPayment;