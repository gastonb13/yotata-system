const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ success: true, documents: [] });
});

router.get('/:id', (req, res) => {
    res.json({ success: true, document: { id: req.params.id, title: 'Document.pdf' } });
});

router.get('/:id/download', (req, res) => {
    res.json({ success: true, message: 'Download endpoint working' });
});

router.post('/', (req, res) => {
    res.json({ success: true, message: 'Document uploaded successfully' });
});

router.delete('/:id', (req, res) => {
    res.json({ success: true, message: 'Document deleted successfully' });
});

module.exports = router;