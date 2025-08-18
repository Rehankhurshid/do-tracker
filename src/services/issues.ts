import { supabase } from '@/lib/supabase'
import { UserRole } from '@/types'

export interface AuthPayload { userId: string; username: string; role: UserRole }

export async function getRoleScopedDeliveryOrderIds(user: AuthPayload) {
  let statuses: string[] = []
  
  if (user.role === 'AREA_OFFICE') {
    statuses = ['created', 'at_area_office']
  } else if (user.role === 'PROJECT_OFFICE') {
    statuses = ['at_project_office', 'received_at_project_office', 'at_road_sale']
  } else if (user.role === 'CISF') {
    statuses = ['at_project_office', 'received_at_project_office', 'cisf_approved', 'both_approved']
  } else if (user.role === 'ROAD_SALE') {
    statuses = ['at_road_sale']
  }

  if (statuses.length === 0 && user.role !== 'ADMIN') {
    return []
  }

  if (user.role === 'ADMIN') {
    return null // Admin can see all
  }

  const { data, error } = await supabase
    .from('DeliveryOrder')
    .select('id')
    .in('status', statuses)

  if (error) {
    console.error('Error fetching delivery order IDs:', error)
    return []
  }

  return data?.map(d => d.id) || []
}

export async function listForUser(user: AuthPayload, filters: { deliveryOrderId?: string | null; status?: string | null }) {
  // If specific deliveryOrderId is provided, check access
  if (filters.deliveryOrderId) {
    const allowedIds = await getRoleScopedDeliveryOrderIds(user)
    if (allowedIds !== null && !allowedIds.includes(filters.deliveryOrderId)) {
      return []
    }
  }

  // Build query
  let query = supabase
    .from('Issue')
    .select(`
      *,
      deliveryOrder:DeliveryOrder!deliveryOrderId (
        *,
        party:Party!partyId (*)
      ),
      reportedBy:User!reportedById (id, username, role),
      resolvedBy:User!resolvedById (id, username, role)
    `)
    .order('createdAt', { ascending: false })

  // Apply filters
  if (filters.deliveryOrderId) {
    query = query.eq('deliveryOrderId', filters.deliveryOrderId)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  // Apply role-based filtering if no specific deliveryOrderId
  if (!filters.deliveryOrderId && user.role !== 'ADMIN') {
    const allowedIds = await getRoleScopedDeliveryOrderIds(user)
    if (allowedIds !== null && allowedIds.length === 0) {
      return []
    }
    if (allowedIds !== null) {
      query = query.in('deliveryOrderId', allowedIds)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching issues:', error)
    throw new Error('Failed to fetch issues')
  }

  return data || []
}

export async function createIssue(user: AuthPayload, input: { deliveryOrderId: string; issueType?: string; description: string }) {
  // Ensure DO exists
  const { data: exists, error: checkError } = await supabase
    .from('DeliveryOrder')
    .select('id')
    .eq('id', input.deliveryOrderId)
    .single()

  if (checkError || !exists) {
    throw new Error('Delivery order not found')
  }

  // Create the issue
  const { data, error } = await supabase
    .from('Issue')
    .insert({
      deliveryOrderId: input.deliveryOrderId,
      issueType: input.issueType || 'OTHER',
      description: input.description,
      status: 'OPEN',
      reportedById: user.userId,
    })
    .select(`
      *,
      deliveryOrder:DeliveryOrder!deliveryOrderId (
        *,
        party:Party!partyId (*)
      ),
      reportedBy:User!reportedById (id, username, role)
    `)
    .single()

  if (error) {
    console.error('Error creating issue:', error)
    throw new Error('Failed to create issue')
  }

  return data
}
