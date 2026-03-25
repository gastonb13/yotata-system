const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    employee_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    first_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    position: {
        type: DataTypes.STRING(100)
    },
    department: {
        type: DataTypes.STRING(100)
    },
    hire_date: {
        type: DataTypes.DATE
    },
    base_salary: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    bank_name: {
        type: DataTypes.STRING(255)
    },
    bank_account: {
        type: DataTypes.STRING(100)
    },
    emergency_contact: {
        type: DataTypes.STRING(100)
    },
    emergency_phone: {
        type: DataTypes.STRING(50)
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'terminated'),
        defaultValue: 'active'
    }
}, {
    tableName: 'employees',
    timestamps: true,
    underscored: true
});

module.exports = Employee;