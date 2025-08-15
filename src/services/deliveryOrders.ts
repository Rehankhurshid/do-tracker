import { prisma } from '@/lib/db'
import { DOStatus, UserRole } from '@/types'
import { isValidForwardTransition } from '@/domain/workflow'
import { Prisma } from '@prisma/client'

export interface AuthPayload { userId: string; username: string; role: UserRole }

export function roleBasedDOWhere(role: UserRole): Prisma.DeliveryOrderWhereInput {
  switch (role) {
    case 'AREA_OFFICE':
      return {
        OR: [
          { status: { in: ['created', 'at_area_office'] as DOStatus[] } },
          { status: { in: ['at_project_office', 'received_at_project_office', 'project_approved', 'cisf_approved', 'both_approved', 'at_road_sale'] as DOStatus[] } }
        ]
      }
    case 'PROJECT_OFFICE':
    case 'CISF':
      return {
        status: { in: ['at_project_office', 'received_at_project_office', 'project_approved', 'cisf_approved', 'both_approved', 'at_road_sale'] as DOStatus[] }
      }
    case 'ROAD_SALE':
      return { status: 'at_road_sale' as DOStatus }
    default:
      return {}
  }
}

export async function listForUser(
  user: AuthPayload,
  filters: { status?: string | null; partyId?: string | null }
) {
  const where: Prisma.DeliveryOrderWhereInput = roleBasedDOWhere(user.role)
  if (filters.partyId) where.partyId = filters.partyId
  if (filters.status && !where.OR) where.status = filters.status

  return prisma.deliveryOrder.findMany({
    where,
    include: {
      party: true,
      createdBy: { select: { id: true, username: true, role: true } },
      issues: { include: { reportedBy: { select: { id: true, username: true } } } },
      workflowHistory: { include: { actionBy: { select: { id: true, username: true, role: true } } }, orderBy: { createdAt: 'desc' } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getById(id: string) {
  return prisma.deliveryOrder.findUnique({ where: { id }, include: { issues: true, party: true } })
}

export async function hasOpenIssues(id: string) {
  const count = await prisma.issue.count({ where: { deliveryOrderId: id, status: 'OPEN' } })
  return count > 0
}

export async function createDO(
  user: AuthPayload,
  data: { doNumber: string; partyId: string; authorizedPerson: string; validTo: string; notes?: string | null }
) {
  const existing = await prisma.deliveryOrder.findUnique({ where: { doNumber: data.doNumber } })
  if (existing) {
    throw new Error(`DO number ${data.doNumber} already exists`)
  }

  const deliveryOrder = await prisma.deliveryOrder.create({
    data: {
      doNumber: data.doNumber,
      partyId: data.partyId,
      authorizedPerson: data.authorizedPerson,
      validFrom: new Date(),
      validTo: new Date(data.validTo),
      status: 'at_area_office',
      notes: data.notes || null,
      createdById: user.userId,
    },
    include: { party: true, createdBy: { select: { username: true } } }
  })

  await prisma.workflowHistory.create({
    data: {
      deliveryOrderId: deliveryOrder.id,
      fromStatus: 'created',
      toStatus: 'at_area_office',
      actionById: user.userId,
      notes: 'Delivery order created',
    }
  })

  return deliveryOrder
}

export async function forward(user: AuthPayload, id: string, toStatus: DOStatus) {
  const current = await prisma.deliveryOrder.findUnique({ where: { id }, include: { issues: { where: { status: 'OPEN' } } } })
  if (!current) throw new Error('Delivery order not found')
  if (current.issues.length > 0) throw new Error('Cannot forward DO with unresolved issues')
  if (!isValidForwardTransition(current.status as DOStatus, toStatus)) throw new Error('Invalid status transition')

  const updated = await prisma.deliveryOrder.update({ where: { id }, data: { status: toStatus }, include: { party: true, issues: true } })
  await prisma.workflowHistory.create({
    data: {
      deliveryOrderId: id,
      fromStatus: current.status as DOStatus,
      toStatus,
      actionById: user.userId,
      notes: `Forwarded from ${current.status} to ${toStatus}`,
    }
  })
  return updated
}

export async function receiveAtProjectOffice(user: AuthPayload, id: string) {
  // Only Project Office or Admin can receive
  if (user.role !== 'PROJECT_OFFICE' && user.role !== 'ADMIN') {
    throw new Error('Only Project Office can receive delivery orders')
  }
  const current = await prisma.deliveryOrder.findUnique({
    where: { id },
    include: { issues: { where: { status: 'OPEN' } } }
  })
  if (!current) throw new Error('Delivery order not found')
  if (current.status !== 'at_project_office') throw new Error('Delivery order is not available for receipt')
  if (current.issues.length > 0) throw new Error('Cannot receive DO with open issues')

  const updated = await prisma.deliveryOrder.update({
    where: { id },
    data: { status: 'received_at_project_office' },
    include: {
      party: true,
      createdBy: { select: { id: true, username: true, role: true } },
      issues: true,
    }
  })
  await prisma.workflowHistory.create({
    data: {
      deliveryOrderId: id,
      fromStatus: 'at_project_office',
      toStatus: 'received_at_project_office',
      actionById: user.userId,
      notes: 'Received at Project Office',
    }
  })
  return updated
}

export async function forwardToRoadSale(user: AuthPayload, id: string, notes?: string | null) {
  // Admin, Project Office, or CISF may trigger after both approvals
  if (!['ADMIN', 'PROJECT_OFFICE', 'CISF'].includes(user.role)) {
    throw new Error("You don't have permission to forward to Road Sale")
  }
  const current = await prisma.deliveryOrder.findUnique({
    where: { id },
    include: { issues: { where: { status: 'OPEN' } } }
  })
  if (!current) throw new Error('Delivery order not found')
  if (current.status !== 'both_approved') {
    throw new Error('Both Project Office and CISF must approve before forwarding to Road Sale')
  }
  if (current.issues.length > 0) throw new Error('Cannot forward order with open issues')

  const updated = await prisma.deliveryOrder.update({
    where: { id },
    data: { status: 'at_road_sale', updatedAt: new Date() },
  })

  await prisma.workflowHistory.create({
    data: {
      deliveryOrderId: id,
      fromStatus: current.status as DOStatus,
      toStatus: 'at_road_sale',
      actionById: user.userId,
      notes: notes || 'Forwarded to Road Sale after dual approval',
    }
  })

  return updated
}

export async function deleteDO(user: AuthPayload, id: string) {
  // Only Area Office or Admin can delete DOs in early states
  if (user.role !== 'AREA_OFFICE' && user.role !== 'ADMIN') {
    throw new Error('Only Area Office can delete delivery orders')
  }

  const deliveryOrder = await prisma.deliveryOrder.findUnique({
    where: { id },
    include: { issues: true, workflowHistory: true }
  })
  if (!deliveryOrder) throw new Error('Delivery order not found')
  if (deliveryOrder.status !== 'at_area_office' && deliveryOrder.status !== 'created') {
    throw new Error('Cannot delete delivery order that has been forwarded')
  }
  const hasWorkflowHistory = (deliveryOrder.workflowHistory?.length || 0) > 1
  if (hasWorkflowHistory) throw new Error('Cannot delete delivery order with workflow history')

  if (deliveryOrder.issues.length > 0) {
    await prisma.issue.deleteMany({ where: { deliveryOrderId: id } })
  }
  await prisma.workflowHistory.deleteMany({ where: { deliveryOrderId: id } })
  const deletedOrder = await prisma.deliveryOrder.delete({ where: { id } })

  return { id: deletedOrder.id, doNumber: deletedOrder.doNumber }
}
