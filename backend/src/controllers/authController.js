const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Client } = require('../models');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt:', email);
        
        // Find user
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }
        
        console.log('User found:', user.email, 'Role:', user.role);
        
        // Validate password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            console.log('Invalid password for:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }
        
        console.log('Password valid for:', email);
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            'secret123',
            { expiresIn: '7d' }
        );
        
        console.log('Login successful for:', email, 'Role:', user.role);
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

const register = async (req, res) => {
    try {
        const { email, password, company_name, phone } = req.body;
        
        // Check if user exists
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email' 
            });
        }
        
        // Hash password
        const hash = await bcrypt.hash(password, 10);
        
        // Create user
        const user = await User.create({
            email,
            password_hash: hash,
            role: 'client',
            is_active: true
        });
        
        // Create client profile
        await Client.create({
            user_id: user.id,
            company_name: company_name || email.split('@')[0],
            phone: phone || ''
        });
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            'secret123',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{ model: Client }]
        });
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { login, register, getProfile };