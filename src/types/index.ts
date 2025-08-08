export type UserRole = 'ADMIN' | 'AREA_OFFICE' | 'PROJECT_OFFICE' | 'CISF' | 'ROAD_SALE';

export type DOStatus = 
  | 'CREATED' 
  | 'AT_AREA_OFFICE' 
  | 'PENDING_APPROVAL'  // Waiting for both Project Office and CISF approval
  | 'PROJECT_APPROVED'  // Project Office approved, waiting for CISF
  | 'CISF_APPROVED'     // CISF approved, waiting for Project Office  
  | 'BOTH_APPROVED'     // Both approved, ready for Road Sale
  | 'AT_ROAD_SALE';

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