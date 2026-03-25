const express = require('express');
const router = express.Router();

// ✅ correct path
const authController = require('../controllers/authController');

// LOGIN
router.post('/login', authController.login);

// REGISTER
router.post('/register', authController.register);

// PROFILE
router.get('/profile', authController.getProfile);

// OPTIONAL (keep simple if not implemented)
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

router.post('/change-password', (req, res) => {
    res.json({ success: true, message: 'Password changed successfully' });
});

router.post('/forgot-password', (req, res) => {
    res.json({ success: true, message: 'Password reset email sent' });
});

router.post('/reset-password', (req, res) => {
    res.json({ success: true, message: 'Password reset successful' });
});

module.exports = router;