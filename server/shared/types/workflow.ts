// Workflow system types
// Date: 2025-10-09
// Description: TypeScript types for dynamic workflow builder and execution engine

import { z } from 'zod';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Events that can trigger a workflow execution
 */
export const WorkflowTriggerEvent = {
  REQUEST_SUBMITTED: 'request_submitted',
  PR_CREATED: 'pr_created',
  STOCK_LOW: 'stock_low',
  MANUAL: 'manual'
} as const;

export type WorkflowTriggerEventType = typeof WorkflowTriggerEvent[keyof typeof WorkflowTriggerEvent];

/**
 * Types of workflow nodes
 */
export const WorkflowNodeType = {
  DECISION: 'decision',
  ACTION: 'action',
  ASSIGNMENT: 'assignment',
  NOTIFICATION: 'notification',
  DELAY: 'delay',
  INTEGRATION: 'integration'
} as const;

export type WorkflowNodeTypeEnum = typeof WorkflowNodeType[keyof typeof WorkflowNodeType];

/**
 * Workflow execution status
 */
export const WorkflowExecutionStatus = {
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

export type WorkflowExecutionStatusType = typeof WorkflowExecutionStatus[keyof typeof WorkflowExecutionStatus];

/**
 * Task status for workflow assignments
 */
export const WorkflowTaskStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ESCALATED: 'escalated'
} as const;

export type WorkflowTaskStatusType = typeof WorkflowTaskStatus[keyof typeof WorkflowTaskStatus];

/**
 * Task types for workflow assignments
 */
export const WorkflowTaskType = {
  APPROVE_REQUEST: 'approve_request',
  REJECT_REQUEST: 'reject_request',
  REVIEW_REQUEST: 'review_request',
  FULFILL_REQUEST: 'fulfill_request',
  CUSTOM: 'custom'
} as const;

export type WorkflowTaskTypeEnum = typeof WorkflowTaskType[keyof typeof WorkflowTaskType];

/**
 * Action types for action nodes
 */
export const WorkflowActionType = {
  AUTO_APPROVE: 'auto_approve',
  AUTO_REJECT: 'auto_reject',
  FULFILL_REQUEST: 'fulfill_request',
  CREATE_PR: 'create_pr',
  RESERVE_STOCK: 'reserve_stock',
  UPDATE_STATUS: 'update_status'
} as const;

export type WorkflowActionTypeEnum = typeof WorkflowActionType[keyof typeof WorkflowActionType];

/**
 * Notification channels
 */
export const NotificationChannel = {
  EMAIL: 'email',
  IN_APP: 'in_app',
  SMS: 'sms',
  SLACK: 'slack'
} as const;

export type NotificationChannelType = typeof NotificationChannel[keyof typeof NotificationChannel];

// ============================================================================
// NODE CONFIGURATION TYPES
// ============================================================================

/**
 * Configuration for decision nodes (conditional branching)
 */
export interface DecisionNodeConfig {
  condition: string; // JavaScript expression (e.g., "total_value < 100")
  trueNodeId?: string; // Node to execute if condition is true
  falseNodeId?: string; // Node to execute if condition is false
}

/**
 * Configuration for action nodes (automated actions)
 */
export interface ActionNodeConfig {
  action: WorkflowActionTypeEnum;
  reason?: string; // For auto_reject
  vendorId?: string; // For create_pr
  status?: string; // For update_status
  metadata?: Record<string, any>; // Additional action-specific data
}

/**
 * Configuration for assignment nodes (task assignment)
 */
export interface AssignmentNodeConfig {
  assignTo: string; // Format: "role:role_id" or "user:user_id" or "dynamic:site_manager"
  slaHours?: number; // SLA in hours
  escalateTo?: string; // User/role to escalate to if SLA breached
  allowedActions: string[]; // e.g., ['approve', 'reject', 'request_info']
  taskType: WorkflowTaskTypeEnum;
  requireAll?: boolean; // If multiple assignees, require all to act (default: false)
}

/**
 * Configuration for notification nodes
 */
export interface NotificationNodeConfig {
  channel: NotificationChannelType;
  sendTo: string; // Format: "role:role_id" or "user:user_id" or "dynamic:requestor"
  template: string; // Notification template name
  customMessage?: string; // Custom message override
  metadata?: Record<string, any>; // Additional data for template
}

/**
 * Configuration for delay nodes
 */
export interface DelayNodeConfig {
  delayType: 'hours' | 'days' | 'until';
  delayValue?: number; // Number of hours/days
  delayUntil?: string; // ISO date string for 'until' type
  escalateTo?: string; // User/role to escalate to if delay expires
}

/**
 * Configuration for integration nodes (external API calls)
 */
export interface IntegrationNodeConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: Record<string, any>;
  responseKey: string; // Key to store response in context (e.g., "budgetCheckResult")
  timeoutMs?: number; // Request timeout in milliseconds
}

/**
 * Union type for all node configurations
 */
export type WorkflowNodeConfig =
  | DecisionNodeConfig
  | ActionNodeConfig
  | AssignmentNodeConfig
  | NotificationNodeConfig
  | DelayNodeConfig
  | IntegrationNodeConfig;

// ============================================================================
// WORKFLOW NODE DEFINITIONS
// ============================================================================

/**
 * Base workflow node structure
 */
export interface WorkflowNodeBase {
  id: string; // Unique node ID within workflow
  type: WorkflowNodeTypeEnum;
  label?: string; // Display label for UI
  position?: { x: number; y: number }; // Position in visual designer
}

/**
 * Decision node (conditional branching)
 */
export interface DecisionNode extends WorkflowNodeBase {
  type: 'decision';
  config: DecisionNodeConfig;
}

/**
 * Action node (automated actions)
 */
export interface ActionNode extends WorkflowNodeBase {
  type: 'action';
  config: ActionNodeConfig;
  next?: string; // Next node ID (for linear flow)
}

/**
 * Assignment node (assign task to user/role)
 */
export interface AssignmentNode extends WorkflowNodeBase {
  type: 'assignment';
  config: AssignmentNodeConfig;
  next?: string; // Next node after task completion
}

/**
 * Notification node (send notification)
 */
export interface NotificationNode extends WorkflowNodeBase {
  type: 'notification';
  config: NotificationNodeConfig;
  next?: string; // Next node ID
}

/**
 * Delay node (pause workflow)
 */
export interface DelayNode extends WorkflowNodeBase {
  type: 'delay';
  config: DelayNodeConfig;
  next?: string; // Next node after delay
}

/**
 * Integration node (external API call)
 */
export interface IntegrationNode extends WorkflowNodeBase {
  type: 'integration';
  config: IntegrationNodeConfig;
  next?: string; // Next node ID
}

/**
 * Union type for all workflow nodes
 */
export type WorkflowNode =
  | DecisionNode
  | ActionNode
  | AssignmentNode
  | NotificationNode
  | DelayNode
  | IntegrationNode;

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

/**
 * Filter to determine when workflow applies
 */
export interface WorkflowAppliesTo {
  categories?: string[] | null; // Category UUIDs (null = all)
  sites?: string[] | null; // Site UUIDs (null = all)
}

/**
 * Complete workflow definition (stored in workflows.workflow_json)
 */
export interface WorkflowDefinition {
  name: string;
  description?: string;
  triggerEvent: WorkflowTriggerEventType;
  appliesTo: WorkflowAppliesTo | null; // null = applies to all
  nodes: WorkflowNode[];
  version?: number;
}

/**
 * Workflow record from database
 */
export interface Workflow {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  triggerEvent: WorkflowTriggerEventType;
  appliesTo: WorkflowAppliesTo | null;
  workflowJson: WorkflowDefinition;
  isActive: boolean;
  version: number;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// WORKFLOW EXECUTION
// ============================================================================

/**
 * Execution context (runtime variables accessible to nodes)
 */
export interface ExecutionContext {
  // Request data
  requestId?: string;
  requestData?: {
    totalValue: number;
    categoryId: string;
    categoryName: string;
    siteId: string;
    siteName: string;
    areaId: string;
    areaName: string;
    requestorId: string;
    requestorName: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
    notes?: string;
  };

  // User data
  user?: {
    id: string;
    role: string;
    roleId?: string;
    organizationId: string;
    siteId?: string;
    permissions?: string[];
  };

  // Stock data
  stockData?: {
    allItemsInStock: boolean;
    outOfStockItems: string[];
  };

  // Dynamic calculated values
  [key: string]: any; // Allow custom context variables
}

/**
 * Workflow execution record
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  requestId?: string | null;
  prId?: string | null;
  currentNodeId?: string | null;
  status: WorkflowExecutionStatusType;
  contextData: ExecutionContext;
  errorMessage?: string | null;
  retryCount: number;
  startedAt: Date;
  completedAt?: Date | null;
  pausedAt?: Date | null;
  resumeAt?: Date | null;
  lastActivityAt: Date;
  createdAt: Date;
}

// ============================================================================
// WORKFLOW HISTORY
// ============================================================================

/**
 * Workflow history record (audit trail)
 */
export interface WorkflowHistory {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: WorkflowNodeTypeEnum;
  actionTaken: string; // Human-readable description
  actorId?: string | null; // User who took action
  metadata?: Record<string, any> | null;
  timestamp: Date;
}

// ============================================================================
// WORKFLOW TASKS
// ============================================================================

/**
 * Workflow task (assignment to user/role)
 */
export interface WorkflowTask {
  id: string;
  executionId: string;
  nodeId: string;
  assignedToUserId?: string | null;
  assignedToRoleId?: string | null;
  taskType: WorkflowTaskTypeEnum;
  taskData?: Record<string, any> | null;
  status: WorkflowTaskStatusType;
  completedBy?: string | null;
  completedAt?: Date | null;
  actionTaken?: string | null;
  actionNotes?: string | null;
  slaDeadline?: Date | null;
  escalatedTo?: string | null;
  escalatedAt?: Date | null;
  createdAt: Date;
}

// ============================================================================
// ZOD VALIDATORS
// ============================================================================

/**
 * Zod schema for DecisionNodeConfig
 */
export const DecisionNodeConfigSchema = z.object({
  condition: z.string().min(1, 'Condition is required'),
  trueNodeId: z.string().optional(),
  falseNodeId: z.string().optional()
});

/**
 * Zod schema for ActionNodeConfig
 */
export const ActionNodeConfigSchema = z.object({
  action: z.enum([
    WorkflowActionType.AUTO_APPROVE,
    WorkflowActionType.AUTO_REJECT,
    WorkflowActionType.FULFILL_REQUEST,
    WorkflowActionType.CREATE_PR,
    WorkflowActionType.RESERVE_STOCK,
    WorkflowActionType.UPDATE_STATUS
  ]),
  reason: z.string().optional(),
  vendorId: z.string().uuid().optional(),
  status: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Zod schema for AssignmentNodeConfig
 */
export const AssignmentNodeConfigSchema = z.object({
  assignTo: z.string().min(1, 'Assignment target is required'),
  slaHours: z.number().positive().optional(),
  escalateTo: z.string().optional(),
  allowedActions: z.array(z.string()).min(1, 'At least one action required'),
  taskType: z.enum([
    WorkflowTaskType.APPROVE_REQUEST,
    WorkflowTaskType.REJECT_REQUEST,
    WorkflowTaskType.REVIEW_REQUEST,
    WorkflowTaskType.FULFILL_REQUEST,
    WorkflowTaskType.CUSTOM
  ]),
  requireAll: z.boolean().optional()
});

/**
 * Zod schema for NotificationNodeConfig
 */
export const NotificationNodeConfigSchema = z.object({
  channel: z.enum([
    NotificationChannel.EMAIL,
    NotificationChannel.IN_APP,
    NotificationChannel.SMS,
    NotificationChannel.SLACK
  ]),
  sendTo: z.string().min(1, 'Recipient is required'),
  template: z.string().min(1, 'Template is required'),
  customMessage: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Zod schema for DelayNodeConfig
 */
export const DelayNodeConfigSchema = z.object({
  delayType: z.enum(['hours', 'days', 'until']),
  delayValue: z.number().positive().optional(),
  delayUntil: z.string().optional(),
  escalateTo: z.string().optional()
});

/**
 * Zod schema for IntegrationNodeConfig
 */
export const IntegrationNodeConfigSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string().url('Invalid URL'),
  headers: z.record(z.string()).optional(),
  body: z.record(z.any()).optional(),
  responseKey: z.string().min(1, 'Response key is required'),
  timeoutMs: z.number().positive().optional()
});

/**
 * Zod schema for WorkflowNode (base)
 */
const WorkflowNodeBaseSchema = z.object({
  id: z.string().min(1, 'Node ID is required'),
  type: z.enum([
    WorkflowNodeType.DECISION,
    WorkflowNodeType.ACTION,
    WorkflowNodeType.ASSIGNMENT,
    WorkflowNodeType.NOTIFICATION,
    WorkflowNodeType.DELAY,
    WorkflowNodeType.INTEGRATION
  ]),
  label: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional()
});

/**
 * Zod schema for complete WorkflowNode (discriminated union)
 */
export const WorkflowNodeSchema = z.discriminatedUnion('type', [
  WorkflowNodeBaseSchema.extend({
    type: z.literal(WorkflowNodeType.DECISION),
    config: DecisionNodeConfigSchema
  }),
  WorkflowNodeBaseSchema.extend({
    type: z.literal(WorkflowNodeType.ACTION),
    config: ActionNodeConfigSchema,
    next: z.string().optional()
  }),
  WorkflowNodeBaseSchema.extend({
    type: z.literal(WorkflowNodeType.ASSIGNMENT),
    config: AssignmentNodeConfigSchema,
    next: z.string().optional()
  }),
  WorkflowNodeBaseSchema.extend({
    type: z.literal(WorkflowNodeType.NOTIFICATION),
    config: NotificationNodeConfigSchema,
    next: z.string().optional()
  }),
  WorkflowNodeBaseSchema.extend({
    type: z.literal(WorkflowNodeType.DELAY),
    config: DelayNodeConfigSchema,
    next: z.string().optional()
  }),
  WorkflowNodeBaseSchema.extend({
    type: z.literal(WorkflowNodeType.INTEGRATION),
    config: IntegrationNodeConfigSchema,
    next: z.string().optional()
  })
]);

/**
 * Zod schema for WorkflowAppliesTo
 */
export const WorkflowAppliesToSchema = z.object({
  categories: z.array(z.string().uuid()).nullable().optional(),
  sites: z.array(z.string().uuid()).nullable().optional()
});

/**
 * Zod schema for WorkflowDefinition
 */
export const WorkflowDefinitionSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  triggerEvent: z.enum([
    WorkflowTriggerEvent.REQUEST_SUBMITTED,
    WorkflowTriggerEvent.PR_CREATED,
    WorkflowTriggerEvent.STOCK_LOW,
    WorkflowTriggerEvent.MANUAL
  ]),
  appliesTo: WorkflowAppliesToSchema.nullable(),
  nodes: z.array(WorkflowNodeSchema).min(1, 'At least one node is required'),
  version: z.number().optional()
});

/**
 * Zod schema for creating a new workflow
 */
export const CreateWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(100),
  description: z.string().max(500).optional(),
  triggerEvent: z.enum([
    WorkflowTriggerEvent.REQUEST_SUBMITTED,
    WorkflowTriggerEvent.PR_CREATED,
    WorkflowTriggerEvent.STOCK_LOW,
    WorkflowTriggerEvent.MANUAL
  ]),
  appliesTo: WorkflowAppliesToSchema.nullable().optional(),
  workflowJson: WorkflowDefinitionSchema,
  isActive: z.boolean().default(true)
});

/**
 * Zod schema for updating a workflow
 */
export const UpdateWorkflowSchema = CreateWorkflowSchema.partial();
