const sequelize = require('./src/config/database');
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function testDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully');

        // List all users
        const users = await User.findAll();
        console.log('\n=== Users in Database ===');
        users.forEach(user => {
            console.log(`ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Active: ${user.is_active}`);
        });

        // Test admin login
        const adminUser = await User.findOne({ where: { email: 'admin@yotata.com' } });
        if (adminUser) {
            console.log('\n=== Admin User Found ===');
            console.log(`Email: ${adminUser.email}`);
            console.log(`Role: ${adminUser.role}`);
            console.log(`Active: ${adminUser.is_active}`);
            
            // Test password verification
            const testPassword = 'admin123';
            const isValid = await bcrypt.compare(testPassword, adminUser.password_hash);
            console.log(`Password '${testPassword}' is valid: ${isValid}`);
        } else {
            console.log('\n=== Admin User NOT Found ===');
            console.log('Please insert admin user with:');
            console.log("INSERT INTO users (email, password_hash, role, is_active) VALUES ('admin@yotata.com', '$2a$10$rQZ9KJtL5Y2Z3cX4vW5b6eL8qM9nO0pP1qR2sT3uV4wX5yZ6aB7cD8eF9gH0iJ', 'admin', true);");
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testDatabase();