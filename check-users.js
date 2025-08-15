const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Connecting to database...');
    
    // Count users
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);
    
    if (userCount === 0) {
      console.log('No users found! You need to seed the database.');
      return;
    }
    
    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        isPasswordSet: true,
        email: true
      }
    });
    
    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.role}) - Active: ${user.isActive}, Password Set: ${user.isPasswordSet}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('P1001')) {
      console.log('\nConnection failed. Make sure your DATABASE_URL is correct.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();