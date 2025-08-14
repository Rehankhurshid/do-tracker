export type UserRole = 'ADMIN' | 'AREA_OFFICE' | 'PROJECT_OFFICE' | 'CISF' | 'ROAD_SALE';

export type DOStatus = 
  | 'created' 
  | 'at_area_office' 
  | 'pending_approval'  // Waiting for both Project Office and CISF approval
  | 'at_project_office' // At Project Office
  | 'received_at_project_office' // Received at Project Office
  | 'project_approved'  // Project Office approved, waiting for CISF
  | 'cisf_approved'     // CISF approved, waiting for Project Office  
  | 'both_approved'     // Both approved, ready for Road Sale
  | 'at_road_sale';

export type IssueStatus = 'OPEN' | 'RESOLVED';

export interface User {
  id: string;
  username: string;
  email?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Party {
  id: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryOrder {
  id: string;
  doNumber: string;
  partyId: string;
  party?: Party;
  authorizedPerson: string;
  validFrom: Date;
  validTo: Date;
  status: DOStatus;
  projectApproved: boolean;
  cisfApproved: boolean;
  notes?: string | null;
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
  issues?: Issue[];
  workflowHistory?: WorkflowHistory[];
}

export interface Issue {
  id: string;
  deliveryOrderId: string;
  deliveryOrder?: DeliveryOrder;
  description: string;
  status: IssueStatus;
  reportedById: string;
  reportedBy?: User;
  resolvedById?: string | null;
  resolvedBy?: User | null;
  resolution?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowHistory {
  id: string;
  deliveryOrderId: string;
  deliveryOrder?: DeliveryOrder;
  fromStatus: DOStatus;
  toStatus: DOStatus;
  actionById: string;
  actionBy?: User;
  comments?: string | null;
  createdAt: Date;
}

export interface Session {
  user: {
    id: string;
    username: string;
    email?: string | null;
    role: UserRole;
  }
}