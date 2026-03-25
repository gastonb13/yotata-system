const { Order, Client, User, ActivityLog } = require('../models');
const { Op } = require('sequelize');

class OrderController {
    async getAllOrders(req, res) {
        try {
            const { page = 1, limit = 10, status, startDate, endDate } = req.query;
            const offset = (page - 1) * limit;

            const where = {};
            if (status) where.status = status;
            if (startDate && endDate) {
                where.order_date = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            const orders = await Order.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                include: [
                    { model: Client, as: 'client', include: [{ model: User, as: 'user' }] }
                ],
                order: [['created_at', 'DESC']]
            });

            res.json({
                success: true,
                orders: orders.rows,
                total: orders.count,
                page: parseInt(page),
                totalPages: Math.ceil(orders.count / limit)
            });
        } catch (error) {
            console.error('Get all orders error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching orders'
            });
        }
    }

    async getOrderById(req, res) {
        try {
            const { id } = req.params;
            const order = await Order.findByPk(id, {
                include: [
                    { model: Client, as: 'client', include: [{ model: User, as: 'user' }] },
                    { model: User, as: 'processed_by_user', attributes: ['id', 'email'] }
                ]
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            res.json({
                success: true,
                order
            });
        } catch (error) {
            console.error('Get order error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching order'
            });
        }
    }

    async createOrder(req, res) {
        try {
            const { client_id, items, total_amount, discount, tax_amount, final_amount, notes } = req.body;

            // Generate order number
            const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            const order = await Order.create({
                client_id,
                order_number: orderNumber,
                total_amount,
                discount: discount || 0,
                tax_amount: tax_amount || 0,
                final_amount,
                notes,
                processed_by: req.user.id,
                status: 'pending',
                payment_status: 'pending'
            });

            await ActivityLog.create({
                user_id: req.user.id,
                action: 'CREATE_ORDER',
                details: JSON.stringify({ order_id: order.id, order_number: orderNumber }),
                ip_address: req.ip
            });

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                order
            });
        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating order'
            });
        }
    }

    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;

            const order = await Order.findByPk(id);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            await order.update({
                status,
                notes: notes || order.notes
            });

            await ActivityLog.create({
                user_id: req.user.id,
                action: 'UPDATE_ORDER_STATUS',
                details: JSON.stringify({ order_id: id, old_status: order.status, new_status: status }),
                ip_address: req.ip
            });

            res.json({
                success: true,
                message: 'Order status updated successfully',
                order
            });
        } catch (error) {
            console.error('Update order status error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating order status'
            });
        }
    }

    async cancelOrder(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const order = await Order.findByPk(id);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            if (order.status === 'delivered') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel delivered order'
                });
            }

            await order.update({
                status: 'cancelled',
                notes: reason ? `Cancelled: ${reason}` : order.notes
            });

            await ActivityLog.create({
                user_id: req.user.id,
                action: 'CANCEL_ORDER',
                details: JSON.stringify({ order_id: id, reason }),
                ip_address: req.ip
            });

            res.json({
                success: true,
                message: 'Order cancelled successfully',
                order
            });
        } catch (error) {
            console.error('Cancel order error:', error);
            res.status(500).json({
                success: false,
                message: 'Error cancelling order'
            });
        }
    }

    async getOrderStats(req, res) {
        try {
            const totalOrders = await Order.count();
            const pendingOrders = await Order.count({ where: { status: 'pending' } });
            const processingOrders = await Order.count({ where: { status: 'processing' } });
            const completedOrders = await Order.count({ where: { status: 'delivered' } });
            const cancelledOrders = await Order.count({ where: { status: 'cancelled' } });

            const totalRevenue = await Order.sum('final_amount', {
                where: { payment_status: 'paid' }
            });

            res.json({
                success: true,
                stats: {
                    total: totalOrders,
                    pending: pendingOrders,
                    processing: processingOrders,
                    completed: completedOrders,
                    cancelled: cancelledOrders,
                    revenue: totalRevenue || 0
                }
            });
        } catch (error) {
            console.error('Get order stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching order statistics'
            });
        }
    }
}

module.exports = new OrderController();