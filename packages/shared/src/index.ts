// Re-export all modules
export * from './types/index.js';
export * from './schemas/index.js';
export * from './utils/index.js';

// Convenience re-exports for commonly used items
export type {
  User,
  Organization,
  Site,
  Area,
  CatalogueItem,
  Request,
  RequestItem,
  Stock,
  ApiResponse,
  AuthTokens,
  JWTPayload,
  DashboardStats,
  ActivityItem
} from './types/index.js';

export {
  UserRole,
  RequestStatus,
  RequestPriority
} from './types/index.js';

export type {
  SignUpInput,
  SignInInput,
  CreateOrganizationInput,
  CreateSiteInput,
  CreateAreaInput,
  CreateCatalogueItemInput,
  CreateRequestInput
} from './schemas/index.js';

export {
  API_ENDPOINTS,
  ERROR_CODES,
  createSuccessResponse,
  createErrorResponse,
  generateId,
  createSlug,
  formatDate,
  formatRelativeTime
} from './utils/index.js';