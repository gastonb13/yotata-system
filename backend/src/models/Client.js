const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
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
    company_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    contact_person: {
        type: DataTypes.STRING(255)
    },
    phone: {
        type: DataTypes.STRING(50)
    },
    mobile: {
        type: DataTypes.STRING(50)
    },
    address: {
        type: DataTypes.TEXT
    },
    city: {
        type: DataTypes.STRING(100)
    },
    country: {
        type: DataTypes.STRING(100),
        defaultValue: 'Tunisia'
    },
    tax_number: {
        type: DataTypes.STRING(100)
    },
    credit_limit: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    payment_terms: {
        type: DataTypes.INTEGER,
        defaultValue: 30
    },
    notes: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'clients',
    timestamps: true,
    underscored: true
});

module.exports = Client;