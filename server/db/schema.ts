import { pgTable, text, uuid, timestamp, boolean, integer, numeric, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { UserRole, RequestStatus, RequestPriority, OrganizationSettings } from '../shared';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  password_hash: text('password_hash'), // Optional for OAuth users
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  role: text('role').$type<UserRole>().notNull(), // Legacy - will migrate to role_id
  role_id: uuid('role_id'), // New role reference
  organization_id: uuid('organization_id'),
  // Google OAuth fields
  google_id: text('google_id').unique(),
  google_email: text('google_email'),
  google_name: text('google_name'),
  google_picture: text('google_picture'),
  auth_provider: text('auth_provider').notNull().default('local'), // 'local' or 'google'
  is_active: boolean('is_active').notNull().default(true),
  email_verified: boolean('email_verified').notNull().default(false),
  force_password_change: boolean('force_password_change').notNull().default(false),
  created_by: uuid('created_by'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Organizations table
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  settings: jsonb('settings').$type<OrganizationSettings>().notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Sites table
export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  organization_id: uuid('organization_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  address: text('address'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Areas table
export const areas = pgTable('areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  site_id: uuid('site_id').notNull(),
  organization_id: uuid('organization_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Catalogue items table
export const catalogueItems = pgTable('catalogue_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  organization_id: uuid('organization_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'), // Legacy field
  category_id: uuid('category_id'), // New category reference
  unit: text('unit').notNull(),
  cost_per_unit: numeric('cost_per_unit', { precision: 10, scale: 2 }),
  supplier: text('supplier'),
  minimum_stock: integer('minimum_stock'),
  image_url: text('image_url'), // Image URL for item photos
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Requests table
export const requests = pgTable('requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  organization_id: uuid('organization_id').notNull(),
  requester_id: uuid('requester_id').notNull(),
  site_id: uuid('site_id').notNull(),
  area_id: uuid('area_id').notNull(),
  status: text('status').$type<RequestStatus>().notNull(),
  priority: text('priority').$type<RequestPriority>().notNull(),
  notes: text('notes'),
  requested_by_date: timestamp('requested_by_date'),
  approved_at: timestamp('approved_at'),
  approved_by: uuid('approved_by'),
  fulfilled_at: timestamp('fulfilled_at'),
  fulfilled_by: uuid('fulfilled_by'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Request items table
export const requestItems = pgTable('request_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  request_id: uuid('request_id').notNull(),
  catalogue_item_id: uuid('catalogue_item_id').notNull(),
  quantity: integer('quantity').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Stock table
export const stock = pgTable('stock', {
  id: uuid('id').primaryKey().defaultRandom(),
  organization_id: uuid('organization_id').notNull(),
  catalogue_item_id: uuid('catalogue_item_id').notNull(),
  site_id: uuid('site_id').notNull(),
  area_id: uuid('area_id').notNull(),
  quantity: integer('quantity').notNull().default(0),
  last_updated_by: uuid('last_updated_by').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  refresh_token: text('refresh_token').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// User invitations table
export const userInvitations = pgTable('user_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organization_id: uuid('organization_id').notNull(),
  email: text('email').notNull(),
  role: text('role').$type<UserRole>().notNull(),
  invited_by: uuid('invited_by').notNull(),
  invitation_token: text('invitation_token').notNull().unique(),
  accepted: boolean('accepted').notNull().default(false),
  expires_at: timestamp('expires_at').notNull(),
  accepted_at: timestamp('accepted_at'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// End users table (staff users created by admins)
export const endUsers = pgTable('end_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organization_id: uuid('organization_id').notNull(),
  username: text('username').notNull(),
  password_hash: text('password_hash').notNull(),
  email: text('email'),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  role: text('role').$type<'STAFF' | 'PROCUREMENT' | 'APPROVER_L1' | 'APPROVER_L2'>().notNull(), // Legacy - will migrate to role_id
  role_id: uuid('role_id'), // New role reference
  is_active: boolean('is_active').notNull().default(true),
  force_password_change: boolean('force_password_change').notNull().default(true),
  created_by: uuid('created_by').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  last_login_at: timestamp('last_login_at')
});

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  organization_id: uuid('organization_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// End user sites mapping
export const endUserSites = pgTable('end_user_sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  end_user_id: uuid('end_user_id').notNull(),
  site_id: uuid('site_id').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow()
});

// End user areas mapping
export const endUserAreas = pgTable('end_user_areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  end_user_id: uuid('end_user_id').notNull(),
  area_id: uuid('area_id').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow()
});

// End user categories mapping
export const endUserCategories = pgTable('end_user_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  end_user_id: uuid('end_user_id').notNull(),
  category_id: uuid('category_id').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow()
});

// End user sessions table
export const endUserSessions = pgTable('end_user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  end_user_id: uuid('end_user_id').notNull(),
  refresh_token: text('refresh_token').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organization_id],
    references: [organizations.id]
  }),
  role: one(roles, {
    fields: [users.role_id],
    references: [roles.id]
  }),
  createdBy: one(users, {
    fields: [users.created_by],
    references: [users.id]
  }),
  requests: many(requests),
  approvedRequests: many(requests),
  fulfilledRequests: many(requests),
  sessions: many(sessions),
  createdUsers: many(users),
  userSites: many(userSites)
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  sites: many(sites),
  areas: many(areas),
  catalogueItems: many(catalogueItems),
  requests: many(requests),
  stock: many(stock),
  roles: many(roles)
}));

export const sitesRelations = relations(sites, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [sites.organization_id],
    references: [organizations.id]
  }),
  areas: many(areas),
  requests: many(requests),
  stock: many(stock),
  userSites: many(userSites)
}));

export const areasRelations = relations(areas, ({ one, many }) => ({
  site: one(sites, {
    fields: [areas.site_id],
    references: [sites.id]
  }),
  organization: one(organizations, {
    fields: [areas.organization_id],
    references: [organizations.id]
  }),
  requests: many(requests),
  stock: many(stock)
}));

export const catalogueItemsRelations = relations(catalogueItems, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [catalogueItems.organization_id],
    references: [organizations.id]
  }),
  requestItems: many(requestItems),
  stock: many(stock)
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [requests.organization_id],
    references: [organizations.id]
  }),
  requester: one(users, {
    fields: [requests.requester_id],
    references: [users.id]
  }),
  site: one(sites, {
    fields: [requests.site_id],
    references: [sites.id]
  }),
  area: one(areas, {
    fields: [requests.area_id],
    references: [areas.id]
  }),
  approvedBy: one(users, {
    fields: [requests.approved_by],
    references: [users.id]
  }),
  fulfilledBy: one(users, {
    fields: [requests.fulfilled_by],
    references: [users.id]
  }),
  items: many(requestItems)
}));

export const requestItemsRelations = relations(requestItems, ({ one }) => ({
  request: one(requests, {
    fields: [requestItems.request_id],
    references: [requests.id]
  }),
  catalogueItem: one(catalogueItems, {
    fields: [requestItems.catalogue_item_id],
    references: [catalogueItems.id]
  })
}));

export const stockRelations = relations(stock, ({ one }) => ({
  organization: one(organizations, {
    fields: [stock.organization_id],
    references: [organizations.id]
  }),
  catalogueItem: one(catalogueItems, {
    fields: [stock.catalogue_item_id],
    references: [catalogueItems.id]
  }),
  site: one(sites, {
    fields: [stock.site_id],
    references: [sites.id]
  }),
  area: one(areas, {
    fields: [stock.area_id],
    references: [areas.id]
  }),
  lastUpdatedBy: one(users, {
    fields: [stock.last_updated_by],
    references: [users.id]
  })
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.user_id],
    references: [users.id]
  })
}));

export const userInvitationsRelations = relations(userInvitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [userInvitations.organization_id],
    references: [organizations.id]
  }),
  invitedBy: one(users, {
    fields: [userInvitations.invited_by],
    references: [users.id]
  })
}));

// Roles table
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  organization_id: uuid('organization_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  permissions: jsonb('permissions').notNull().default({}),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// User sites mapping table (many-to-many)
export const userSites = pgTable('user_sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  site_id: uuid('site_id').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow()
});

// Roles relations
export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [roles.organization_id],
    references: [organizations.id]
  }),
  users: many(users)
}));

// User sites relations
export const userSitesRelations = relations(userSites, ({ one }) => ({
  user: one(users, {
    fields: [userSites.user_id],
    references: [users.id]
  }),
  site: one(sites, {
    fields: [userSites.site_id],
    references: [sites.id]
  })
}));

// Simple approval workflows table
export const approvalWorkflows = pgTable('approval_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  organization_id: uuid('organization_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  trigger_type: text('trigger_type').notNull().default('manual'), // manual, request, procurement, etc.
  trigger_conditions: jsonb('trigger_conditions').default({}), // Additional conditions
  is_default: boolean('is_default').notNull().default(false),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Approval levels table (Level 1, Level 2, Level 3...)
export const approvalLevels = pgTable('approval_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflow_id: uuid('workflow_id').notNull(),
  level_order: integer('level_order').notNull(), // 1, 2, 3...
  role_id: uuid('role_id').notNull(), // Which role approves at this level
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Request approvals tracking table
export const requestApprovals = pgTable('request_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  request_id: uuid('request_id').notNull(),
  workflow_id: uuid('workflow_id').notNull(),
  level_id: uuid('level_id').notNull(),
  level_order: integer('level_order').notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED
  approved_by: uuid('approved_by'),
  approved_at: timestamp('approved_at'),
  rejection_reason: text('rejection_reason'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Approval workflows relations
export const approvalWorkflowsRelations = relations(approvalWorkflows, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [approvalWorkflows.organization_id],
    references: [organizations.id]
  }),
  levels: many(approvalLevels),
  requestApprovals: many(requestApprovals)
}));

// Approval levels relations
export const approvalLevelsRelations = relations(approvalLevels, ({ one }) => ({
  workflow: one(approvalWorkflows, {
    fields: [approvalLevels.workflow_id],
    references: [approvalWorkflows.id]
  }),
  role: one(roles, {
    fields: [approvalLevels.role_id],
    references: [roles.id]
  })
}));

// Request approvals relations
export const requestApprovalsRelations = relations(requestApprovals, ({ one }) => ({
  request: one(requests, {
    fields: [requestApprovals.request_id],
    references: [requests.id]
  }),
  workflow: one(approvalWorkflows, {
    fields: [requestApprovals.workflow_id],
    references: [approvalWorkflows.id]
  }),
  level: one(approvalLevels, {
    fields: [requestApprovals.level_id],
    references: [approvalLevels.id]
  }),
  approvedBy: one(users, {
    fields: [requestApprovals.approved_by],
    references: [users.id]
  })
}));
