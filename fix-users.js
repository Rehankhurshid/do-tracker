const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUsers() {
  // Update all users that have passwords to set isPasswordSet = true
  const result = await prisma.user.updateMany({
    where: {
      password: {
        not: null
      }
    },
    data: {
      isPasswordSet: true
    }
  });
  
  console.log(`Updated ${result.count} users to set isPasswordSet = true`);
  
  // Verify the fix
  const users = await prisma.user.findMany({
    select: {
      username: true,
      isPasswordSet: true,
    }
  });
  
  console.log('\nUsers after fix:');
  users.forEach(user => {
    console.log(`- ${user.username}: isPasswordSet=${user.isPasswordSet}`);
  });
  
  await prisma.$disconnect();
}

fixUsers().catch(console.error);