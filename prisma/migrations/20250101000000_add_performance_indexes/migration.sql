-- Add indexes for performance optimization

-- Index on delivery order status for faster filtering
CREATE INDEX IF NOT EXISTS "DeliveryOrder_status_idx" ON "DeliveryOrder"("status");

-- Index on delivery order createdAt for sorting
CREATE INDEX IF NOT EXISTS "DeliveryOrder_createdAt_idx" ON "DeliveryOrder"("createdAt" DESC);

-- Composite index for status and createdAt
CREATE INDEX IF NOT EXISTS "DeliveryOrder_status_createdAt_idx" ON "DeliveryOrder"("status", "createdAt" DESC);

-- Index on issues status for filtering open issues
CREATE INDEX IF NOT EXISTS "Issue_status_idx" ON "Issue"("status");

-- Index on issues deliveryOrderId for joins
CREATE INDEX IF NOT EXISTS "Issue_deliveryOrderId_idx" ON "Issue"("deliveryOrderId");

-- Index on workflow history for joins
CREATE INDEX IF NOT EXISTS "WorkflowHistory_deliveryOrderId_idx" ON "WorkflowHistory"("deliveryOrderId");

-- Index on workflow history createdAt for sorting
CREATE INDEX IF NOT EXISTS "WorkflowHistory_createdAt_idx" ON "WorkflowHistory"("createdAt" DESC);

-- Index on user role for filtering
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- Index on user isActive for filtering active users
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");