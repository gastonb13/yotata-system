const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    entity_type: {
        type: DataTypes.STRING(50)
    },
    entity_id: {
        type: DataTypes.INTEGER
    },
    old_values: {
        type: DataTypes.TEXT
    },
    new_values: {
        type: DataTypes.TEXT
    },
    details: {
        type: DataTypes.TEXT
    },
    ip_address: {
        type: DataTypes.STRING(45)
    },
    user_agent: {
        type: DataTypes.STRING(255)
    },
    status: {
        type: DataTypes.ENUM('success', 'failure'),
        defaultValue: 'success'
    }
}, {
    tableName: 'activity_logs',
    timestamps: true,
    underscored: true
});

module.exports = ActivityLog;