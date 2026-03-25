const { Client, Order, Payment, Document, User } = require('../models');
const { Op } = require('sequelize');

const getProfile = async (req, res) => {
    try {
        let client = await Client.findOne({
            where: { user_id: req.user.id },
            include: [{ model: User, as: 'user' }]
        });

        if (!client) {
            // Create client profile if it doesn't exist
            client = await Client.create({
                user_id: req.user.id,
                company_name: req.user.email.split('@')[0],
                contact_person: req.user.email.split('@')[0]
            });
        }

        res.json({ success: true, client });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const client = await Client.findOne({ where: { user_id: req.user.id } });

        if (!client) {
            return res.status(404).json({ success: false, message: 'Client profile not found' });
        }

        const allowedUpdates = ['company_name', 'contact_person', 'phone', 'mobile', 'address', 'city', 'country', 'tax_number', 'notes'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        await client.update(updates);

        res.json({ success: true, message: 'Profile updated successfully', client });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getStats = async (req, res) => {
    try {
        const client = await Client.findOne({ where: { user_id: req.user.id } });

        if (!client) {
            return res.json({
                success: true,
                stats: {
                    activeOrders: 0,
                    totalSpent: 0,
                    pendingRequests: 0
                },
                recentOrders: []
            });
        }

        const activeOrders = await Order.count({
            where: {
                client_id: client.id,
                status: { [Op.in]: ['pending', 'confirmed', 'processing', 'shipped'] }
            }
        });

        const totalSpent = await Order.sum('final_amount', {
            where: {
                client_id: client.id,
                payment_status: 'paid'
            }
        });

        const pendingRequests = await Order.count({
            where: {
                client_id: client.id,
                status: 'pending'
            }
        });

        const recentOrders = await Order.findAll({
            where: { client_id: client.id },
            limit: 5,
            order: [['created_at', 'DESC']],
            raw: true
        });

        res.json({
            success: true,
            stats: {
                activeOrders: activeOrders || 0,
                totalSpent: totalSpent || 0,
                pendingRequests: pendingRequests || 0
            },
            recentOrders: recentOrders || []
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.json({
            success: true,
            stats: {
                activeOrders: 0,
                totalSpent: 0,
                pendingRequests: 0
            },
            recentOrders: []
        });
    }
};

const getOrders = async (req, res) => {
    try {
        const client = await Client.findOne({ where: { user_id: req.user.id } });

        if (!client) {
            return res.json({
                success: true,
                orders: [],
                total: 0,
                page: 1,
                totalPages: 0
            });
        }

        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        const where = { client_id: client.id };
        if (status) where.status = status;

        const orders = await Order.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']],
            raw: true
        });

        res.json({
            success: true,
            orders: orders.rows,
            total: orders.count,
            page: parseInt(page),
            totalPages: Math.ceil(orders.count / limit)
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const client = await Client.findOne({ where: { user_id: req.user.id } });

        if (!client) {
            return res.status(404).json({ success: false, message: 'Client profile not found' });
        }

        const order = await Order.findOne({
            where: { id, client_id: client.id },
            raw: true
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Get order detail error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getDocuments = async (req, res) => {
    try {
        const client = await Client.findOne({ where: { user_id: req.user.id } });

        if (!client) {
            return res.json({ success: true, documents: [] });
        }

        const documents = await Document.findAll({
            where: {
                reference_id: client.id,
                reference_type: 'client'
            },
            order: [['created_at', 'DESC']],
            raw: true
        });

        res.json({ success: true, documents: documents || [] });
    } catch (error) {
        console.error('Get documents error:', error);
        res.json({ success: true, documents: [] });
    }
	
	const createClient = async (req, res) => {
  try {
    const { company_name, phone } = req.body;

    if (!company_name) {
      return res.status(400).json({
        success: false,
        message: "company_name is required"
      });
    }

    const client = await Client.create({
      company_name,
      phone: phone || '',
      user_id: req.user?.id || null
    });

    res.json({
      success: true,
      client
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
};
	
	
	
};

module.exports = {
    getProfile,
    updateProfile,
    getStats,
    getOrders,
    getOrderDetail,
    getDocuments
};