const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sku: {
        type: DataTypes.STRING(100),
        unique: true
    },
    name: {
        type: DataTypes.STRING(255)
    },
    unit_price: {
        type: DataTypes.DECIMAL(10, 2)
    },
    stock_quantity: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false  // products table doesn't have updated_at
});

module.exports = Product;