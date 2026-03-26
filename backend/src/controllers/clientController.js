const { Client } = require('../models');

// CREATE CLIENT
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
      user_id: req.user.id
    });

    res.json({
      success: true,
      client
    });

  } catch (error) {
    console.error("CREATE CLIENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET ALL CLIENTS
const getClients = async (req, res) => {
  try {
    const clients = await Client.findAll({
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      clients
    });

  } catch (error) {
    console.error("GET CLIENTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createClient,
  getClients
};