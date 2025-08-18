import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for your database tables
export type User = {
  id: string
  username: string
  password: string
  role: 'admin' | 'area_office' | 'project_office' | 'road_sale'
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export type Party = {
  id: string
  name: string
  created_at: Date
  updated_at: Date
}

export type DeliveryOrder = {
  id: string
  do_number: string
  party_id: string
  authorized_person: string
  valid_from: Date
  valid_to: Date
  status: 'created' | 'at_area_office' | 'at_project_office' | 'received_at_project_office' | 'at_road_sale'
  created_by: string
  created_at: Date
  updated_at: Date
}

export type Issue = {
  id: string
  delivery_order_id: string
  description: string
  status: 'open' | 'resolved'
  reported_by: string
  resolved_by?: string | null
  resolution?: string | null
  reported_at: Date
  resolved_at?: Date | null
  created_at: Date
  updated_at: Date
}

export type WorkflowHistory = {
  id: string
  delivery_order_id: string
  from_status: string
  to_status: string
  action_by: string
  action_at: Date
  created_at: Date
}
