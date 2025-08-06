const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      username: true,
      role: true,
      isActive: true,
      isPasswordSet: true,
      password: true,
    }
  });
  
  console.log('Users in database:');
  users.forEach(user => {
    console.log(`- ${user.username}: password=${user.password ? 'SET' : 'NULL'}, isPasswordSet=${user.isPasswordSet}, isActive=${user.isActive}`);
  });
  
  await prisma.$disconnect();
}

checkUsers().catch(console.error);