const express = require('express');
const router = express.Router();

router.get('/kpis', (req, res) => {
    res.json({ success: true, data: { revenue: 50000, totalOrders: 150, activeClients: 45, activeEmployees: 12 } });
});

router.get('/revenue-trend', (req, res) => {
    res.json({ success: true, data: { labels: ['Jan', 'Feb', 'Mar'], values: [10000, 15000, 20000] } });
});

router.get('/order-status', (req, res) => {
    res.json({ success: true, data: { labels: ['Pending', 'Processing', 'Completed'], values: [10, 20, 70] } });
});

router.get('/recent-activities', (req, res) => {
    res.json({ success: true, data: [] });
});

module.exports = router;