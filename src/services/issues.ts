import { prisma } from '@/lib/db'
import { UserRole } from '@/types'
import { Prisma } from '@prisma/client'

export interface AuthPayload { userId: string; username: string; role: UserRole }

export async function roleScopedIssueWhere(user: AuthPayload, base: Prisma.IssueWhereInput) {
  const where: Prisma.IssueWhereInput = { ...base }
  if (user.role === 'AREA_OFFICE') {
    const ids = await prisma.deliveryOrder.findMany({ where: { status: { in: ['created', 'at_area_office'] } }, select: { id: true } })
    const doIds = ids.map(d => d.id)
    where.deliveryOrderId = base.deliveryOrderId ? base.deliveryOrderId : (doIds.length ? { in: doIds } : '__none__')
  } else if (user.role === 'PROJECT_OFFICE') {
    const ids = await prisma.deliveryOrder.findMany({ where: { status: { in: ['at_project_office', 'received_at_project_office', 'at_road_sale'] } }, select: { id: true } })
    const doIds = ids.map(d => d.id)
    where.deliveryOrderId = base.deliveryOrderId ? base.deliveryOrderId : (doIds.length ? { in: doIds } : '__none__')
  } else if (user.role === 'CISF') {
  const ids = await prisma.deliveryOrder.findMany({ where: { status: { in: ['at_project_office', 'received_at_project_office', 'cisf_approved', 'both_approved'] } }, select: { id: true } })
    const doIds = ids.map(d => d.id)
    where.deliveryOrderId = base.deliveryOrderId ? base.deliveryOrderId : (doIds.length ? { in: doIds } : '__none__')
  } else if (user.role === 'ROAD_SALE') {
    const ids = await prisma.deliveryOrder.findMany({ where: { status: 'at_road_sale' }, select: { id: true } })
    const doIds = ids.map(d => d.id)
    where.deliveryOrderId = base.deliveryOrderId ? base.deliveryOrderId : (doIds.length ? { in: doIds } : '__none__')
  }
  return where
}

export async function listForUser(user: AuthPayload, filters: { deliveryOrderId?: string | null; status?: string | null }) {
  const base: Prisma.IssueWhereInput = {}
  if (filters.deliveryOrderId) base.deliveryOrderId = filters.deliveryOrderId
  if (filters.status) base.status = filters.status
  const where = await roleScopedIssueWhere(user, base)

  if (where.deliveryOrderId === '__none__') return []

  return prisma.issue.findMany({
    where,
    include: {
      deliveryOrder: { include: { party: true } },
      reportedBy: { select: { id: true, username: true, role: true } },
      resolvedBy: { select: { id: true, username: true, role: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createIssue(user: AuthPayload, input: { deliveryOrderId: string; issueType?: string; description: string }) {
  // Ensure DO exists
  const exists = await prisma.deliveryOrder.findUnique({ where: { id: input.deliveryOrderId } })
  if (!exists) throw new Error('Delivery order not found')

  return prisma.issue.create({
    data: {
      deliveryOrderId: input.deliveryOrderId,
      issueType: input.issueType || 'OTHER',
      description: input.description,
      status: 'OPEN',
      reportedById: user.userId,
    },
    include: {
      deliveryOrder: { include: { party: true } },
      reportedBy: { select: { id: true, username: true, role: true } }
    }
  })
}
