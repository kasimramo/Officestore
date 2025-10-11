// Workflow Execution Engine
// Date: 2025-10-09
// Description: Core workflow engine for executing and managing workflows

import { db } from '../db/index.js';
import { eq, and, isNull, lt } from 'drizzle-orm';
import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowExecution,
  ExecutionContext,
  WorkflowExecutionStatus,
  WorkflowNodeType,
  DecisionNode,
  ActionNode,
  AssignmentNode,
  NotificationNode,
  DelayNode,
  IntegrationNode
} from '../shared/types/workflow.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  requestId: string | null;
  prId: string | null;
  currentNodeId: string | null;
  status: string;
  contextData: any;
  errorMessage: string | null;
  retryCount: number;
  startedAt: Date;
  completedAt: Date | null;
  pausedAt: Date | null;
  resumeAt: Date | null;
  lastActivityAt: Date;
  createdAt: Date;
}

interface WorkflowRecord {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  triggerEvent: string;
  appliesTo: any;
  workflowJson: any;
  isActive: boolean;
  version: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of node processing
 */
interface NodeProcessResult {
  nextNodeId: string | null; // null = workflow complete
  shouldPause: boolean; // true = pause workflow (assignment/delay nodes)
  resumeAt?: Date; // For delay nodes
  contextUpdates?: Partial<ExecutionContext>; // Updates to context
  error?: string; // Error message if node failed
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ITERATIONS = 100; // Prevent infinite loops
const MAX_RETRIES = 3; // Max retry attempts per node
const WORKFLOW_TIMEOUT_HOURS = 24; // Max workflow execution time
const NODE_TIMEOUT_MS = 30000; // 30 seconds per node

// ============================================================================
// MAIN WORKFLOW EXECUTION FUNCTIONS
// ============================================================================

/**
 * Execute a workflow from the beginning
 * @param workflowId - UUID of workflow to execute
 * @param requestId - UUID of request triggering workflow (optional)
 * @param initialContext - Initial execution context
 * @returns Execution ID
 */
export async function executeWorkflow(
  workflowId: string,
  requestId?: string,
  initialContext?: Partial<ExecutionContext>
): Promise<string> {
  console.log(`\n🚀 Starting workflow execution: ${workflowId}`);

  // Load workflow definition
  const workflow = await loadWorkflow(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  if (!workflow.isActive) {
    throw new Error(`Workflow is not active: ${workflow.name}`);
  }

  const workflowDef = workflow.workflowJson as WorkflowDefinition;

  // Validate workflow has nodes
  if (!workflowDef.nodes || workflowDef.nodes.length === 0) {
    throw new Error(`Workflow has no nodes: ${workflow.name}`);
  }

  // Create execution record
  const execution = await createExecution({
    workflowId,
    requestId: requestId || null,
    contextData: initialContext || {},
    currentNodeId: workflowDef.nodes[0].id // Start at first node
  });

  console.log(`✅ Created execution: ${execution.id}`);

  // Start processing nodes
  try {
    await processWorkflow(execution.id, workflowDef);
  } catch (error) {
    console.error(`❌ Workflow execution failed:`, error);
    await markExecutionFailed(execution.id, (error as Error).message);
    throw error;
  }

  return execution.id;
}

/**
 * Resume a paused workflow (after user action or delay)
 * @param executionId - UUID of execution to resume
 * @param userAction - User action data (for assignment nodes)
 */
export async function resumeWorkflow(
  executionId: string,
  userAction?: {
    actorId: string;
    action: string; // 'approve', 'reject', etc.
    notes?: string;
  }
): Promise<void> {
  console.log(`\n▶️ Resuming workflow execution: ${executionId}`);

  // Load execution
  const execution = await loadExecution(executionId);
  if (!execution) {
    throw new Error(`Execution not found: ${executionId}`);
  }

  if (execution.status !== WorkflowExecutionStatus.PAUSED) {
    throw new Error(`Execution is not paused: ${execution.status}`);
  }

  // Load workflow definition
  const workflow = await loadWorkflow(execution.workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${execution.workflowId}`);
  }

  const workflowDef = workflow.workflowJson as WorkflowDefinition;

  // Update execution status
  await updateExecutionStatus(executionId, WorkflowExecutionStatus.IN_PROGRESS);

  // Log user action if provided
  if (userAction) {
    await logWorkflowHistory(executionId, execution.currentNodeId!, 'assignment', {
      action: `User ${userAction.actorId} performed: ${userAction.action}`,
      actorId: userAction.actorId,
      metadata: {
        action: userAction.action,
        notes: userAction.notes
      }
    });

    // Update context with user action
    const updatedContext = {
      ...execution.contextData,
      lastUserAction: userAction
    };
    await updateExecutionContext(executionId, updatedContext);
  }

  // Continue processing from next node
  try {
    await processWorkflow(executionId, workflowDef);
  } catch (error) {
    console.error(`❌ Workflow resume failed:`, error);
    await markExecutionFailed(executionId, (error as Error).message);
    throw error;
  }
}

/**
 * Process workflow nodes sequentially until pause or completion
 */
async function processWorkflow(
  executionId: string,
  workflowDef: WorkflowDefinition
): Promise<void> {
  let iterations = 0;
  let execution = await loadExecution(executionId);

  if (!execution) {
    throw new Error(`Execution not found: ${executionId}`);
  }

  while (execution.currentNodeId && iterations < MAX_ITERATIONS) {
    iterations++;

    // Check for timeout
    const executionAge = Date.now() - execution.startedAt.getTime();
    if (executionAge > WORKFLOW_TIMEOUT_HOURS * 60 * 60 * 1000) {
      throw new Error(`Workflow timeout exceeded: ${WORKFLOW_TIMEOUT_HOURS} hours`);
    }

    // Find current node
    const currentNode = workflowDef.nodes.find(n => n.id === execution.currentNodeId);
    if (!currentNode) {
      throw new Error(`Node not found: ${execution.currentNodeId}`);
    }

    console.log(`  📍 Processing node: ${currentNode.id} (${currentNode.type})`);

    // Process the node
    let result: NodeProcessResult;
    try {
      result = await processNode(currentNode, execution.contextData);
    } catch (error) {
      // Handle node failure with retry logic
      console.error(`  ❌ Node failed: ${(error as Error).message}`);

      if (execution.retryCount < MAX_RETRIES) {
        console.log(`  🔄 Retrying (${execution.retryCount + 1}/${MAX_RETRIES})...`);
        await incrementRetryCount(executionId);
        execution = await loadExecution(executionId);
        continue; // Retry same node
      } else {
        throw new Error(`Node failed after ${MAX_RETRIES} retries: ${(error as Error).message}`);
      }
    }

    // Reset retry count on success
    if (execution.retryCount > 0) {
      await resetRetryCount(executionId);
    }

    // Update context if node modified it
    if (result.contextUpdates) {
      const updatedContext = { ...execution.contextData, ...result.contextUpdates };
      await updateExecutionContext(executionId, updatedContext);
    }

    // Check if workflow should pause
    if (result.shouldPause) {
      console.log(`  ⏸️ Pausing workflow at node: ${currentNode.id}`);
      await pauseExecution(executionId, result.resumeAt);
      return; // Exit - workflow will resume later
    }

    // Move to next node
    if (result.nextNodeId === null) {
      // Workflow complete
      console.log(`  ✅ Workflow completed`);
      await markExecutionCompleted(executionId);
      return;
    }

    // Update current node
    await updateCurrentNode(executionId, result.nextNodeId);
    execution = await loadExecution(executionId);
  }

  if (iterations >= MAX_ITERATIONS) {
    throw new Error(`Workflow exceeded maximum iterations: ${MAX_ITERATIONS} (possible infinite loop)`);
  }
}

/**
 * Process a single workflow node
 */
export async function processNode(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<NodeProcessResult> {
  // Import node processors dynamically to avoid circular dependencies
  const { processDecisionNode } = await import('./nodeProcessors/decisionProcessor.js');
  const { processActionNode } = await import('./nodeProcessors/actionProcessor.js');
  const { processAssignmentNode } = await import('./nodeProcessors/assignmentProcessor.js');
  const { processNotificationNode } = await import('./nodeProcessors/notificationProcessor.js');
  const { processDelayNode } = await import('./nodeProcessors/delayProcessor.js');
  const { processIntegrationNode } = await import('./nodeProcessors/integrationProcessor.js');

  // Execute node with timeout protection
  const nodePromise = (async () => {
    switch (node.type) {
      case WorkflowNodeType.DECISION:
        return processDecisionNode(node as DecisionNode, context);

      case WorkflowNodeType.ACTION:
        return processActionNode(node as ActionNode, context);

      case WorkflowNodeType.ASSIGNMENT:
        return processAssignmentNode(node as AssignmentNode, context);

      case WorkflowNodeType.NOTIFICATION:
        return processNotificationNode(node as NotificationNode, context);

      case WorkflowNodeType.DELAY:
        return processDelayNode(node as DelayNode, context);

      case WorkflowNodeType.INTEGRATION:
        return processIntegrationNode(node as IntegrationNode, context);

      default:
        throw new Error(`Unknown node type: ${(node as any).type}`);
    }
  })();

  // Timeout protection
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Node timeout: ${NODE_TIMEOUT_MS}ms`)), NODE_TIMEOUT_MS);
  });

  return Promise.race([nodePromise, timeoutPromise]);
}

// ============================================================================
// DATABASE HELPER FUNCTIONS
// ============================================================================

/**
 * Load workflow from database
 */
async function loadWorkflow(workflowId: string): Promise<WorkflowRecord | null> {
  const result = await db.execute(
    `SELECT * FROM workflows WHERE id = $1`,
    [workflowId]
  );
  return result.rows[0] as WorkflowRecord || null;
}

/**
 * Load execution from database
 */
async function loadExecution(executionId: string): Promise<WorkflowExecutionRecord | null> {
  const result = await db.execute(
    `SELECT * FROM workflow_executions WHERE id = $1`,
    [executionId]
  );
  return result.rows[0] as WorkflowExecutionRecord || null;
}

/**
 * Create new execution record
 */
async function createExecution(data: {
  workflowId: string;
  requestId: string | null;
  contextData: any;
  currentNodeId: string;
}): Promise<WorkflowExecutionRecord> {
  const result = await db.execute(
    `INSERT INTO workflow_executions
     (workflow_id, request_id, context_data, current_node_id, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.workflowId,
      data.requestId,
      JSON.stringify(data.contextData),
      data.currentNodeId,
      WorkflowExecutionStatus.IN_PROGRESS
    ]
  );
  return result.rows[0] as WorkflowExecutionRecord;
}

/**
 * Update execution status
 */
async function updateExecutionStatus(executionId: string, status: string): Promise<void> {
  await db.execute(
    `UPDATE workflow_executions SET status = $1, last_activity_at = NOW() WHERE id = $2`,
    [status, executionId]
  );
}

/**
 * Update current node
 */
async function updateCurrentNode(executionId: string, nodeId: string): Promise<void> {
  await db.execute(
    `UPDATE workflow_executions SET current_node_id = $1, last_activity_at = NOW() WHERE id = $2`,
    [nodeId, executionId]
  );
}

/**
 * Update execution context
 */
async function updateExecutionContext(executionId: string, context: any): Promise<void> {
  await db.execute(
    `UPDATE workflow_executions SET context_data = $1, last_activity_at = NOW() WHERE id = $2`,
    [JSON.stringify(context), executionId]
  );
}

/**
 * Pause execution
 */
async function pauseExecution(executionId: string, resumeAt?: Date): Promise<void> {
  await db.execute(
    `UPDATE workflow_executions
     SET status = $1, paused_at = NOW(), resume_at = $2, last_activity_at = NOW()
     WHERE id = $3`,
    [WorkflowExecutionStatus.PAUSED, resumeAt || null, executionId]
  );
}

/**
 * Mark execution as completed
 */
async function markExecutionCompleted(executionId: string): Promise<void> {
  await db.execute(
    `UPDATE workflow_executions
     SET status = $1, completed_at = NOW(), last_activity_at = NOW()
     WHERE id = $2`,
    [WorkflowExecutionStatus.COMPLETED, executionId]
  );
}

/**
 * Mark execution as failed
 */
async function markExecutionFailed(executionId: string, errorMessage: string): Promise<void> {
  await db.execute(
    `UPDATE workflow_executions
     SET status = $1, error_message = $2, last_activity_at = NOW()
     WHERE id = $3`,
    [WorkflowExecutionStatus.FAILED, errorMessage, executionId]
  );
}

/**
 * Increment retry count
 */
async function incrementRetryCount(executionId: string): Promise<void> {
  await db.execute(
    `UPDATE workflow_executions SET retry_count = retry_count + 1 WHERE id = $1`,
    [executionId]
  );
}

/**
 * Reset retry count
 */
async function resetRetryCount(executionId: string): Promise<void> {
  await db.execute(
    `UPDATE workflow_executions SET retry_count = 0 WHERE id = $1`,
    [executionId]
  );
}

/**
 * Log workflow history
 */
export async function logWorkflowHistory(
  executionId: string,
  nodeId: string,
  nodeType: string,
  data: {
    action: string;
    actorId?: string;
    metadata?: any;
  }
): Promise<void> {
  await db.execute(
    `INSERT INTO workflow_history
     (execution_id, node_id, node_type, action_taken, actor_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      executionId,
      nodeId,
      nodeType,
      data.action,
      data.actorId || null,
      data.metadata ? JSON.stringify(data.metadata) : null
    ]
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Find workflows that apply to a given request
 */
export async function findApplicableWorkflows(
  organizationId: string,
  triggerEvent: string,
  filters?: {
    categoryId?: string;
    siteId?: string;
  }
): Promise<WorkflowRecord[]> {
  // This is simplified - in production, you'd use JSONB queries
  const result = await db.execute(
    `SELECT * FROM workflows
     WHERE organization_id = $1
     AND trigger_event = $2
     AND is_active = true
     ORDER BY created_at DESC`,
    [organizationId, triggerEvent]
  );

  return result.rows as WorkflowRecord[];
}

/**
 * Get workflow execution status
 */
export async function getExecutionStatus(executionId: string): Promise<{
  status: string;
  currentNode: string | null;
  progress: number;
  history: any[];
} | null> {
  const execution = await loadExecution(executionId);
  if (!execution) return null;

  // Get history
  const historyResult = await db.execute(
    `SELECT * FROM workflow_history WHERE execution_id = $1 ORDER BY timestamp ASC`,
    [executionId]
  );

  // Calculate progress (simplified)
  const progress = execution.status === WorkflowExecutionStatus.COMPLETED ? 100 :
                  execution.status === WorkflowExecutionStatus.FAILED ? 0 :
                  50; // TODO: Calculate based on nodes processed

  return {
    status: execution.status,
    currentNode: execution.currentNodeId,
    progress,
    history: historyResult.rows
  };
}

/**
 * Cancel a running workflow
 */
export async function cancelWorkflow(executionId: string): Promise<void> {
  await db.execute(
    `UPDATE workflow_executions
     SET status = $1, last_activity_at = NOW()
     WHERE id = $2`,
    [WorkflowExecutionStatus.CANCELLED, executionId]
  );

  console.log(`⚠️ Workflow cancelled: ${executionId}`);
}
