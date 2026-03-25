const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    document_type: {
        type: DataTypes.ENUM('invoice', 'quote', 'contract', 'receipt', 'delivery_note', 'other'),
        allowNull: false
    },
    reference_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reference_type: {
        type: DataTypes.ENUM('order', 'client', 'employee', 'payment'),
        allowNull: false
    },
    document_number: {
        type: DataTypes.STRING(100),
        unique: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    file_path: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    file_name: {
        type: DataTypes.STRING(255)
    },
    file_size: {
        type: DataTypes.INTEGER
    },
    mime_type: {
        type: DataTypes.STRING(100)
    },
    version: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    status: {
        type: DataTypes.ENUM('draft', 'final', 'archived', 'deleted'),
        defaultValue: 'draft'
    },
    uploaded_by: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    expires_at: {
        type: DataTypes.DATE
    },
    notes: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'documents',
    timestamps: true,
    underscored: true
});

module.exports = Document;