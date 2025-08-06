import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@orderflow.com',
      role: 'ADMIN',
      isActive: true,
      isPasswordSet: true,
    },
  });

  // Create area office user
  const areaOffice = await prisma.user.upsert({
    where: { username: 'area_office' },
    update: {},
    create: {
      username: 'area_office',
      password: hashedPassword,
      email: 'area@orderflow.com',
      role: 'AREA_OFFICE',
      isActive: true,
      isPasswordSet: true,
    },
  });

  // Create project office user
  const projectOffice = await prisma.user.upsert({
    where: { username: 'project_office' },
    update: {},
    create: {
      username: 'project_office',
      password: hashedPassword,
      email: 'project@orderflow.com',
      role: 'PROJECT_OFFICE',
      isActive: true,
      isPasswordSet: true,
    },
  });

  // Create road sale user
  const roadSale = await prisma.user.upsert({
    where: { username: 'road_sale' },
    update: {},
    create: {
      username: 'road_sale',
      password: hashedPassword,
      email: 'road@orderflow.com',
      role: 'ROAD_SALE',
      isActive: true,
      isPasswordSet: true,
    },
  });

  // Create sample parties
  const party1 = await prisma.party.upsert({
    where: { name: 'ABC Corporation' },
    update: {},
    create: {
      name: 'ABC Corporation',
      contactPerson: 'John Doe',
      phone: '+1234567890',
      email: 'contact@abc.com',
      address: '123 Main Street, City',
    },
  });

  const party2 = await prisma.party.upsert({
    where: { name: 'XYZ Industries' },
    update: {},
    create: {
      name: 'XYZ Industries',
      contactPerson: 'Jane Smith',
      phone: '+0987654321',
      email: 'info@xyz.com',
      address: '456 Oak Avenue, Town',
    },
  });

  console.log('Seed data created successfully!');
  console.log('Users created:');
  console.log('- admin (password: admin123)');
  console.log('- area_office (password: admin123)');
  console.log('- project_office (password: admin123)');
  console.log('- road_sale (password: admin123)');
  console.log('\nParties created:');
  console.log('- ABC Corporation');
  console.log('- XYZ Industries');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });