import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addIndexes() {
  try {
    console.log('🚀 Adding performance indexes to database...\n');

    // Add indexes for better query performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "DeliveryOrder_status_idx" ON "DeliveryOrder"("status");',
      'CREATE INDEX IF NOT EXISTS "DeliveryOrder_createdAt_idx" ON "DeliveryOrder"("createdAt");',
      'CREATE INDEX IF NOT EXISTS "DeliveryOrder_status_createdAt_idx" ON "DeliveryOrder"("status", "createdAt");',
      'CREATE INDEX IF NOT EXISTS "Issue_status_idx" ON "Issue"("status");',
      'CREATE INDEX IF NOT EXISTS "Issue_deliveryOrderId_idx" ON "Issue"("deliveryOrderId");',
      'CREATE INDEX IF NOT EXISTS "WorkflowHistory_deliveryOrderId_idx" ON "WorkflowHistory"("deliveryOrderId");',
      'CREATE INDEX IF NOT EXISTS "WorkflowHistory_createdAt_idx" ON "WorkflowHistory"("createdAt");',
      'CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");',
      'CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");',
    ];

    for (const index of indexes) {
      try {
        await prisma.$executeRawUnsafe(index);
        console.log(`✅ ${index.match(/CREATE INDEX[^"]*"([^"]+)"/)?.[1] || 'Index'} created`);
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`⏭️  ${index.match(/CREATE INDEX[^"]*"([^"]+)"/)?.[1] || 'Index'} already exists`);
        } else {
          console.error(`❌ Failed to create index: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Database indexes added successfully!');
  } catch (error) {
    console.error('❌ Error adding indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addIndexes();