const sequelize = require('./src/config/database');
const { User } = require('./src/models');

async function test() {
    try {
        await sequelize.authenticate();
        console.log('✓ Database connected');
        
        const users = await User.findAll();
        console.log('Users found:', users.length);
        
        users.forEach(user => {
            console.log(`- ${user.email} (${user.role})`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

test();