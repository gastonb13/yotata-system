const express = require('express');
const router = express.Router();

const { createClient, getClients } = require('../controllers/clientController');
const auth = require('../middleware/auth');

// GET ALL CLIENTS
router.get('/', auth, getClients);

// CREATE CLIENT
router.post('/', auth, createClient);

module.exports = router;