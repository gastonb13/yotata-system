const { Order, Client, Employee, Payment, ActivityLog, sequelize } = require('../models');
const { Op } = require('sequelize');

class DashboardController {
    async getKPIs(req, res) {
        try {
            const { start_date, end_date } = req.query;
            
            const dateFilter = {};
            if (start_date && end_date) {
                dateFilter.created_at = {
                    [Op.between]: [new Date(start_date), new Date(end_date)]
                };
            }
            
            const revenue = await Payment.sum('amount', {
                where: {
                    ...dateFilter,
                    status: 'completed'
                }
            });
            
            const totalOrders = await Order.count({
                where: dateFilter
            });
            
            const activeClients = await Client.count({
                where: { status: 'active' }
            });
            
            const activeEmployees = await Employee.count({
                where: { status: 'active' }
            });
            
            res.json({
                success: true,
                data: {
                    revenue: revenue || 0,
                    totalOrders,
                    activeClients,
                    activeEmployees
                }
            });
        } catch (error) {
            console.error('Get KPIs error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching KPIs'
            });
        }
    }
    
    async getRevenueTrend(req, res) {
        try {
            const { start_date, end_date } = req.query;
            
            const revenueData = await Payment.findAll({
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('payment_date')), 'date'],
                    [sequelize.fn('SUM', sequelize.col('amount')), 'total']
                ],
                where: {
                    payment_date: {
                        [Op.between]: [new Date(start_date), new Date(end_date)]
                    },
                    status: 'completed'
                },
                group: [sequelize.fn('DATE', sequelize.col('payment_date'))],
                order: [[sequelize.fn('DATE', sequelize.col('payment_date')), 'ASC']]
            });
            
            const labels = revenueData.map(item => item.dataValues.date);
            const values = revenueData.map(item => item.dataValues.total);
            
            res.json({
                success: true,
                data: { labels, values }
            });
        } catch (error) {
            console.error('Get revenue trend error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching revenue trend'
            });
        }
    }
    
    async getOrderStatus(req, res) {
        try {
            const statusCounts = await Order.findAll({
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('status')), 'count']
                ],
                group: ['status']
            });
            
            const labels = statusCounts.map(item => item.status);
            const values = statusCounts.map(item => item.dataValues.count);
            
            res.json({
                success: true,
                data: { labels, values }
            });
        } catch (error) {
            console.error('Get order status error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching order status'
            });
        }
    }
    
    async getRecentActivities(req, res) {
        try {
            const { limit = 10 } = req.query;
            
            const activities = await ActivityLog.findAll({
                limit: parseInt(limit),
                order: [['created_at', 'DESC']],
                include: [{ model: User, as: 'user', attributes: ['email'] }]
            });
            
            const formattedActivities = activities.map(activity => ({
                id: activity.id,
                action: activity.action,
                description: `${activity.user?.email || 'System'} performed ${activity.action}`,
                created_at: activity.created_at
            }));
            
            res.json({
                success: true,
                data: formattedActivities
            });
        } catch (error) {
            console.error('Get recent activities error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching recent activities'
            });
        }
    }
}

module.exports = new DashboardController();