const sequelize = require('./src/config/database');
const { User } = require('./src/models');

async function test() {
    try {
        await sequelize.authenticate();
        console.log('✓ Connected to database:', sequelize.config.database);
        
        const users = await User.findAll();
        console.log(`✓ Found ${users.length} users:`);
        users.forEach(user => {
            console.log(`  - ${user.email} (${user.role})`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

test();