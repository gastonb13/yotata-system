const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ success: true, salaries: [] });
});

router.get('/stats', (req, res) => {
    res.json({ success: true, stats: { yearlyTotal: 100000, monthlyBreakdown: [] } });
});

router.post('/process', (req, res) => {
    res.json({ success: true, message: 'Salary processed successfully' });
});

module.exports = router;