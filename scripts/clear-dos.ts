import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDeliveryOrders() {
  try {
    console.log('🗑️  Starting to clear delivery orders...\n');

    // Delete in the correct order to respect foreign key constraints
    
    // 1. Delete workflow history
    const deletedHistory = await prisma.workflowHistory.deleteMany({});
    console.log(`✅ Deleted ${deletedHistory.count} workflow history entries`);
    
    // 2. Delete issues
    const deletedIssues = await prisma.issue.deleteMany({});
    console.log(`✅ Deleted ${deletedIssues.count} issues`);
    
    // 3. Delete delivery orders
    const deletedOrders = await prisma.deliveryOrder.deleteMany({});
    console.log(`✅ Deleted ${deletedOrders.count} delivery orders`);

    console.log('\n🎉 Successfully cleared all delivery orders and related data!');
  } catch (error) {
    console.error('❌ Error clearing delivery orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
clearDeliveryOrders();