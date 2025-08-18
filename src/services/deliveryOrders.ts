import { supabase } from '@/lib/supabase'
import { DOStatus, UserRole } from '@/types'
import { isValidForwardTransition } from '@/domain/workflow'

export interface AuthPayload { userId: string; username: string; role: UserRole }

export function roleBasedDOQuery(role: UserRole) {
  switch (role) {
    case 'AREA_OFFICE':
      return supabase.from('DeliveryOrder').select().or(
        'status.in.(created,at_area_office),status.in.(at_project_office,received_at_project_office,project_approved,cisf_approved,both_approved,at_road_sale)'
      )
    case 'PROJECT_OFFICE':
    case 'CISF':
      return supabase.from('DeliveryOrder').select().in(
        'status', 
        ['at_project_office', 'received_at_project_office', 'project_approved', 'cisf_approved', 'both_approved', 'at_road_sale']
      )
    case 'ROAD_SALE':
      return supabase.from('DeliveryOrder').select().eq('status', 'at_road_sale')
    default:
      return supabase.from('DeliveryOrder').select()
  }
}

export async function listForUser(
  user: AuthPayload,
  filters: { status?: string | null; partyId?: string | null }
) {
  let query = roleBasedDOQuery(user.role)

  if (filters.partyId) {
    query = query.eq('partyId', filters.partyId)
  }
  if (filters.status && user.role !== 'AREA_OFFICE') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
    .select(`
      *,
      party:Party!partyId (*),
      createdBy:User!createdById (id, username, role),
      issues:Issue (*,
        reportedBy:User!reportedById (id, username)
      ),
      workflowHistory:WorkflowHistory (*, 
        actionBy:User!actionById (id, username, role)
      )
    `)
    .order('createdAt', { ascending: false })
  
  if (error) throw error
  
  // Sort workflow history
  return data?.map(order => ({
    ...order,
    workflowHistory: order.workflowHistory?.sort((a: { createdAt: string }, b: { createdAt: string }) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  })) || []
}

export async function getById(id: string) {
  const { data, error } = await supabase
    .from('DeliveryOrder')
    .select(`
      *,
      issues:Issue (*),
      party:Party!partyId (*)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function hasOpenIssues(id: string) {
  const { count, error } = await supabase
    .from('Issue')
    .select('*', { count: 'exact', head: true })
    .eq('deliveryOrderId', id)
    .eq('status', 'OPEN')
  
  if (error) throw error
  return (count || 0) > 0
}

export async function createDO(
  user: AuthPayload,
  data: { doNumber: string; partyId: string; authorizedPerson: string; validTo: string; notes?: string | null }
) {
  // Check if DO number already exists
  const { data: existing, error: checkError } = await supabase
    .from('DeliveryOrder')
    .select('id')
    .eq('doNumber', data.doNumber)
    .single()
  
  if (checkError && checkError.code !== 'PGRST116') throw checkError
  if (existing) {
    throw new Error(`DO number ${data.doNumber} already exists`)
  }

  // Create delivery order
  const { data: deliveryOrder, error: createError } = await supabase
    .from('DeliveryOrder')
    .insert({
      doNumber: data.doNumber,
      partyId: data.partyId,
      authorizedPerson: data.authorizedPerson,
      validFrom: new Date().toISOString(),
      validTo: new Date(data.validTo).toISOString(),
      status: 'at_area_office',
      notes: data.notes || null,
      createdById: user.userId,
    })
    .select(`
      *,
      party:Party!partyId (*),
      createdBy:User!createdById (username)
    `)
    .single()
  
  if (createError) throw createError

  // Create workflow history
  const { error: historyError } = await supabase
    .from('WorkflowHistory')
    .insert({
      deliveryOrderId: deliveryOrder.id,
      fromStatus: 'created',
      toStatus: 'at_area_office',
      actionById: user.userId,
      notes: 'Delivery order created',
    })
  
  if (historyError) throw historyError

  return deliveryOrder
}

export async function forward(user: AuthPayload, id: string, toStatus: DOStatus) {
  // Get current order with open issues
  const { data: current, error: fetchError } = await supabase
    .from('DeliveryOrder')
    .select(`
      *,
      issues:Issue!inner (*)
    `)
    .eq('id', id)
    .eq('issues.status', 'OPEN')
    .single()
  
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError
  
  // Also get the order without issue filter to check if it exists
  const { data: order, error: orderError } = await supabase
    .from('DeliveryOrder')
    .select('*')
    .eq('id', id)
    .single()
  
  if (orderError || !order) throw new Error('Delivery order not found')
  if (current?.issues?.length > 0) throw new Error('Cannot forward DO with unresolved issues')
  if (!isValidForwardTransition(order.status as DOStatus, toStatus)) throw new Error('Invalid status transition')

  // Update status
  const { data: updated, error: updateError } = await supabase
    .from('DeliveryOrder')
    .update({ status: toStatus })
    .eq('id', id)
    .select(`
      *,
      party:Party!partyId (*),
      issues:Issue (*)
    `)
    .single()
  
  if (updateError) throw updateError

  // Create workflow history
  const { error: historyError } = await supabase
    .from('WorkflowHistory')
    .insert({
      deliveryOrderId: id,
      fromStatus: order.status as DOStatus,
      toStatus,
      actionById: user.userId,
      notes: `Forwarded from ${order.status} to ${toStatus}`,
    })
  
  if (historyError) throw historyError

  return updated
}

export async function receiveAtProjectOffice(user: AuthPayload, id: string) {
  // Only Project Office or Admin can receive
  if (user.role !== 'PROJECT_OFFICE' && user.role !== 'ADMIN') {
    throw new Error('Only Project Office can receive delivery orders')
  }
  
  // Check for open issues
  const { data: openIssues, error: issueError } = await supabase
    .from('Issue')
    .select('id')
    .eq('deliveryOrderId', id)
    .eq('status', 'OPEN')
    
  if (issueError) throw issueError
  
  // Get current order
  const { data: current, error: fetchError } = await supabase
    .from('DeliveryOrder')
    .select('*')
    .eq('id', id)
    .single()
  
  if (fetchError || !current) throw new Error('Delivery order not found')
  if (current.status !== 'at_project_office') throw new Error('Delivery order is not available for receipt')
  if (openIssues && openIssues.length > 0) throw new Error('Cannot receive DO with open issues')

  // Update status
  const { data: updated, error: updateError } = await supabase
    .from('DeliveryOrder')
    .update({ status: 'received_at_project_office' })
    .eq('id', id)
    .select(`
      *,
      party:Party!partyId (*),
      createdBy:User!createdById (id, username, role),
      issues:Issue (*)
    `)
    .single()
  
  if (updateError) throw updateError

  // Create workflow history
  const { error: historyError } = await supabase
    .from('WorkflowHistory')
    .insert({
      deliveryOrderId: id,
      fromStatus: 'at_project_office',
      toStatus: 'received_at_project_office',
      actionById: user.userId,
      notes: 'Received at Project Office',
    })
  
  if (historyError) throw historyError

  return updated
}

export async function forwardToRoadSale(user: AuthPayload, id: string, notes?: string | null) {
  // Admin, Project Office, or CISF may trigger after both approvals
  if (!['ADMIN', 'PROJECT_OFFICE', 'CISF'].includes(user.role)) {
    throw new Error("You don't have permission to forward to Road Sale")
  }
  
  // Check for open issues
  const { data: openIssues, error: issueError } = await supabase
    .from('Issue')
    .select('id')
    .eq('deliveryOrderId', id)
    .eq('status', 'OPEN')
    
  if (issueError) throw issueError
  
  // Get current order
  const { data: current, error: fetchError } = await supabase
    .from('DeliveryOrder')
    .select('*')
    .eq('id', id)
    .single()
  
  if (fetchError || !current) throw new Error('Delivery order not found')
  if (current.status !== 'both_approved') {
    throw new Error('Both Project Office and CISF must approve before forwarding to Road Sale')
  }
  if (openIssues && openIssues.length > 0) throw new Error('Cannot forward order with open issues')

  // Update status
  const { data: updated, error: updateError } = await supabase
    .from('DeliveryOrder')
    .update({ 
      status: 'at_road_sale',
      updatedAt: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (updateError) throw updateError

  // Create workflow history
  const { error: historyError } = await supabase
    .from('WorkflowHistory')
    .insert({
      deliveryOrderId: id,
      fromStatus: current.status as DOStatus,
      toStatus: 'at_road_sale',
      actionById: user.userId,
      notes: notes || 'Forwarded to Road Sale after dual approval',
    })
  
  if (historyError) throw historyError

  return updated
}

export async function deleteDO(user: AuthPayload, id: string) {
  // Only Area Office or Admin can delete DOs in early states
  if (user.role !== 'AREA_OFFICE' && user.role !== 'ADMIN') {
    throw new Error('Only Area Office can delete delivery orders')
  }

  // Get delivery order with issues and workflow history
  const { data: deliveryOrder, error: fetchError } = await supabase
    .from('DeliveryOrder')
    .select(`
      *,
      issues:Issue (*),
      workflowHistory:WorkflowHistory (*)
    `)
    .eq('id', id)
    .single()
  
  if (fetchError || !deliveryOrder) throw new Error('Delivery order not found')
  if (deliveryOrder.status !== 'at_area_office' && deliveryOrder.status !== 'created') {
    throw new Error('Cannot delete delivery order that has been forwarded')
  }
  const hasWorkflowHistory = (deliveryOrder.workflowHistory?.length || 0) > 1
  if (hasWorkflowHistory) throw new Error('Cannot delete delivery order with workflow history')

  // Delete issues if any
  if (deliveryOrder.issues && deliveryOrder.issues.length > 0) {
    const { error: deleteIssuesError } = await supabase
      .from('Issue')
      .delete()
      .eq('deliveryOrderId', id)
    
    if (deleteIssuesError) throw deleteIssuesError
  }
  
  // Delete workflow history
  const { error: deleteHistoryError } = await supabase
    .from('WorkflowHistory')
    .delete()
    .eq('deliveryOrderId', id)
  
  if (deleteHistoryError) throw deleteHistoryError
  
  // Delete delivery order
  const { error: deleteOrderError } = await supabase
    .from('DeliveryOrder')
    .delete()
    .eq('id', id)
  
  if (deleteOrderError) throw deleteOrderError

  return { id: deliveryOrder.id, doNumber: deliveryOrder.doNumber }
}
