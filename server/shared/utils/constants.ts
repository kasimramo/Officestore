export const API_ENDPOINTS = {
  // Auth
  SIGN_UP: '/api/auth/signup',
  SIGN_IN: '/api/auth/signin',
  SIGN_OUT: '/api/auth/signout',
  REFRESH: '/api/auth/refresh',
  PROFILE: '/api/auth/profile',

  // Organizations
  ORGANIZATIONS: '/api/organizations',
  ORGANIZATION_BY_ID: (id: string) => `/api/organizations/${id}`,

  // Sites
  SITES: '/api/sites',
  SITE_BY_ID: (id: string) => `/api/sites/${id}`,

  // Areas
  AREAS: '/api/areas',
  AREA_BY_ID: (id: string) => `/api/areas/${id}`,
  SITE_AREAS: (siteId: string) => `/api/sites/${siteId}/areas`,

  // Catalogue
  CATALOGUE: '/api/catalogue',
  CATALOGUE_ITEM_BY_ID: (id: string) => `/api/catalogue/${id}`,

  // Requests
  REQUESTS: '/api/requests',
  REQUEST_BY_ID: (id: string) => `/api/requests/${id}`,
  REQUEST_APPROVE: (id: string) => `/api/requests/${id}/approve`,

  // Dashboard
  DASHBOARD_STATS: '/api/dashboard/stats',
  DASHBOARD_ACTIVITY: '/api/dashboard/activity'
} as const;

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  ALGORITHM: 'HS256'
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
  INVALID_UUID: 'Invalid ID format',
  QUANTITY_MIN: 'Quantity must be at least 1',
  COST_MIN: 'Cost must be positive',
  NAME_TOO_LONG: 'Name is too long',
  DESCRIPTION_TOO_LONG: 'Description is too long'
} as const;

export const ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  ORGANIZATION_SLUG_EXISTS: 'ORGANIZATION_SLUG_EXISTS',

  // Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Business Logic
  INVALID_REQUEST_STATUS: 'INVALID_REQUEST_STATUS',
  CANNOT_APPROVE_OWN_REQUEST: 'CANNOT_APPROVE_OWN_REQUEST',
  REQUEST_ALREADY_PROCESSED: 'REQUEST_ALREADY_PROCESSED',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',

  // Server
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const;

export const ORGANIZATION_DEFAULTS = {
  SETTINGS: {
    require_approval: true,
    approval_levels: 1,
    allow_staff_requests: true,
    email_notifications: true
  }
} as const;

export const REQUEST_DEFAULTS = {
  PRIORITY: 'NORMAL' as const,
  STATUS: 'DRAFT' as const
} as const;