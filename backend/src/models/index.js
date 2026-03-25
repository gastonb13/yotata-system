const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');
const Employee = require('./Employee');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const Document = require('./Document');
const SalaryPayment = require('./SalaryPayment');
const ActivityLog = require('./ActivityLog');

// Define associations
User.hasOne(Client, { foreignKey: 'user_id', as: 'client_profile' });
Client.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Employee, { foreignKey: 'user_id', as: 'employee_profile' });
Employee.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Client.hasMany(Order, { foreignKey: 'client_id', as: 'orders' });
Order.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'order_items' });

Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activities' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Employee.hasMany(SalaryPayment, { foreignKey: 'employee_id', as: 'salaries' });
SalaryPayment.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

Order.belongsTo(User, { foreignKey: 'processed_by', as: 'processed_by_user' });
User.hasMany(Order, { foreignKey: 'processed_by', as: 'processed_orders' });

Payment.belongsTo(User, { foreignKey: 'processed_by', as: 'processed_by_user' });

Document.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

SalaryPayment.belongsTo(User, { foreignKey: 'processed_by', as: 'processed_by_user' });

module.exports = {
    sequelize,
    User,
    Client,
    Employee,
    Product,
    Order,
    OrderItem,
    Payment,
    Document,
    SalaryPayment,
    ActivityLog
};