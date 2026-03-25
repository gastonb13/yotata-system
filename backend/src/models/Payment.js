const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    payment_method: {
        type: DataTypes.ENUM('cash', 'bank_transfer', 'credit_card', 'check', 'online'),
        allowNull: false
    },
    payment_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    transaction_id: {
        type: DataTypes.STRING(255),
        unique: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'),
        defaultValue: 'pending'
    },
    reference_number: {
        type: DataTypes.STRING(100)
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
    },
    bank_name: {
        type: DataTypes.STRING(255)
    },
    check_number: {
        type: DataTypes.STRING(100)
    }
}, {
    tableName: 'payments',
    timestamps: true,
    underscored: true
});

module.exports = Payment;