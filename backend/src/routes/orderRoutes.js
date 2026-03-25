const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ success: true, orders: [] });
});

router.get('/stats', (req, res) => {
    res.json({ success: true, stats: { total: 50, pending: 10, completed: 40 } });
});

router.get('/:id', (req, res) => {
    res.json({ success: true, order: { id: req.params.id, status: 'pending' } });
});

router.post('/', (req, res) => {
    res.json({ success: true, message: 'Order created successfully' });
});

router.put('/:id/status', (req, res) => {
    res.json({ success: true, message: 'Order status updated successfully' });
});

router.post('/:id/cancel', (req, res) => {
    res.json({ success: true, message: 'Order cancelled successfully' });
});

module.exports = router;