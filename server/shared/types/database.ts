export interface User {
  id: string;
  username: string;
  email: string | null;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  organization_id: string | null;
  is_active: boolean;
  email_verified: boolean;
  force_password_change: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  settings: OrganizationSettings;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Site {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  address: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Area {
  id: string;
  site_id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CatalogueItem {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  cost_per_unit: number | null;
  supplier: string | null;
  minimum_stock: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Request {
  id: string;
  organization_id: string;
  requester_id: string;
  site_id: string;
  area_id: string;
  status: RequestStatus;
  priority: RequestPriority;
  notes: string | null;
  requested_by_date: Date | null;
  approved_at: Date | null;
  approved_by: string | null;
  fulfilled_at: Date | null;
  fulfilled_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface RequestItem {
  id: string;
  request_id: string;
  catalogue_item_id: string;
  quantity: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Stock {
  id: string;
  organization_id: string;
  catalogue_item_id: string;
  site_id: string;
  area_id: string;
  quantity: number;
  last_updated_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  user_id: string;
  refresh_token: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  PROCUREMENT = 'PROCUREMENT',
  APPROVER_L1 = 'APPROVER_L1',
  APPROVER_L2 = 'APPROVER_L2',
  STAFF = 'STAFF'
}

export enum RequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED'
}

export enum RequestPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Nested types
export interface OrganizationSettings {
  require_approval: boolean;
  approval_levels: number;
  allow_staff_requests: boolean;
  email_notifications: boolean;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Authentication types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  // Username is optional; email is the canonical identifier
  username?: string;
  email?: string;
  role: UserRole;
  organizationId?: string;
  iat: number;
  exp: number;
}

// Dashboard types
export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  fulfilledRequests: number;
  totalUsers: number;
  totalItems: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'request_created' | 'request_approved' | 'request_fulfilled' | 'user_created' | 'item_added';
  description: string;
  user: string;
  timestamp: Date;
}
