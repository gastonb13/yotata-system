const { Payment, Order, Client, User, ActivityLog, sequelize } = require('../models');
const { Op } = require('sequelize');

const getAllPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, start_date, end_date } = req.query;
        const offset = (page - 1) * limit;
        
        const where = {};
        if (status) where.status = status;
        if (start_date && end_date) {
            where.payment_date = {
                [Op.between]: [new Date(start_date), new Date(end_date)]
            };
        }
        
        const payments = await Payment.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                { 
                    model: Order, 
                    as: 'order',
                    include: [{ model: Client, as: 'client' }]
                }
            ],
            order: [['payment_date', 'DESC']]
        });
        
        res.json({
            success: true,
            payments: payments.rows,
            total: payments.count,
            page: parseInt(page),
            totalPages: Math.ceil(payments.count / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findByPk(id, {
            include: [
                { 
                    model: Order, 
                    as: 'order',
                    include: [{ model: Client, as: 'client' }]
                }
            ]
        });
        
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        
        res.json({ success: true, payment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createPayment = async (req, res) => {
    try {
        const { order_id, amount, payment_method, reference_number, notes } = req.body;
        
        const order = await Order.findByPk(order_id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        const payment = await Payment.create({
            order_id,
            amount,
            payment_method,
            reference_number,
            notes,
            processed_by: req.user.id,
            status: 'completed',
            payment_date: new Date()
        });
        
        const totalPaid = await Payment.sum('amount', {
            where: { order_id, status: 'completed' }
        });
        
        if (totalPaid >= order.final_amount) {
            await order.update({ payment_status: 'paid' });
        } else if (totalPaid > 0) {
            await order.update({ payment_status: 'partial' });
        }
        
        res.status(201).json({ success: true, message: 'Payment created successfully', payment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const refundPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        const payment = await Payment.findByPk(id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        
        if (payment.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Only completed payments can be refunded' });
        }
        
        await payment.update({
            status: 'refunded',
            notes: reason ? `Refunded: ${reason}` : payment.notes
        });
        
        res.json({ success: true, message: 'Payment refunded successfully', payment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPaymentStats = async (req, res) => {
    try {
        const totalCollected = await Payment.sum('amount', {
            where: { status: 'completed' }
        });
        
        const pendingPayments = await Payment.sum('amount', {
            where: { status: 'pending' }
        });
        
        const refundedAmount = await Payment.sum('amount', {
            where: { status: 'refunded' }
        });
        
        res.json({
            success: true,
            stats: {
                totalCollected: totalCollected || 0,
                pendingPayments: pendingPayments || 0,
                refundedAmount: refundedAmount || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllPayments,
    getPaymentById,
    createPayment,
    refundPayment,
    getPaymentStats
};