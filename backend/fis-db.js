const sequelize = require('./src/config/database');
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function fixDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');
        
        // Sync all models (this will create missing columns)
        await sequelize.sync({ alter: true });
        console.log('Database synced');
        
        // Check if admin exists
        const adminExists = await User.findOne({ where: { email: 'admin@yotata.com' } });
        
        if (!adminExists) {
            // Create admin user
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                email: 'admin@yotata.com',
                password_hash: hashedPassword,
                role: 'admin',
                is_active: true
            });
            console.log('Admin user created');
        } else {
            console.log('Admin user already exists');
        }
        
        // Check if client exists
        const clientExists = await User.findOne({ where: { email: 'client@yotata.com' } });
        
        if (!clientExists) {
            // Create client user
            const hashedPassword = await bcrypt.hash('client123', 10);
            await User.create({
                email: 'client@yotata.com',
                password_hash: hashedPassword,
                role: 'client',
                is_active: true
            });
            console.log('Client user created');
        } else {
            console.log('Client user already exists');
        }
        
        // List all users
        const users = await User.findAll();
        console.log('\n=== Users ===');
        users.forEach(user => {
            console.log(`${user.email} - Role: ${user.role} - Active: ${user.is_active}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixDatabase();