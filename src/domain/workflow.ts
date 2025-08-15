import { DOStatus } from '@/types'

// Human-friendly labels for UI copy
export const STATUS_LABELS: Record<DOStatus, string> = {
  created: 'Created',
  at_area_office: 'At Area Office',
  pending_approval: 'Pending Dual Approval',
  at_project_office: 'At Project Office',
  received_at_project_office: 'Received at Project Office',
  project_approved: 'Project Approved',
  cisf_approved: 'CISF Approved',
  both_approved: 'Both Approved',
  at_road_sale: 'Completed (Road Sale)'
}

// Valid forward transitions (approval path handled separately)
export const FORWARD_TRANSITIONS: Record<DOStatus, DOStatus[]> = {
  created: ['at_area_office'],
  at_area_office: ['at_project_office'],
  at_project_office: ['received_at_project_office'],
  received_at_project_office: ['at_road_sale'], // legacy fast-path; approvals preferred
  pending_approval: [],
  project_approved: [],
  cisf_approved: [],
  both_approved: ['at_road_sale'],
  at_road_sale: []
}

export function isValidForwardTransition(from: DOStatus, to: DOStatus): boolean {
  return FORWARD_TRANSITIONS[from]?.includes(to) ?? false
}
