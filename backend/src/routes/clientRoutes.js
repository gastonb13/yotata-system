const express = require('express');
const router = express.Router();

router.get('/profile', (req, res) => {
    res.json({ success: true, client: { company_name: 'Test Company', email: 'test@example.com' } });
});

router.put('/profile', (req, res) => {
    res.json({ success: true, message: 'Profile updated successfully' });
});

router.get('/stats', (req, res) => {
    res.json({ success: true, stats: { activeOrders: 5, totalSpent: 1250, pendingRequests: 2 } });
});

router.get('/orders', (req, res) => {
    res.json({ success: true, orders: [] });
});

router.get('/orders/:id', (req, res) => {
    res.json({ success: true, order: { id: req.params.id, status: 'pending' } });
});

router.get('/documents', (req, res) => {
    res.json({ success: true, documents: [] });
});

module.exports = router;