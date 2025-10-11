// Assignment Node Processor
// Assigns tasks to users/roles and pauses workflow

import { AssignmentNode, ExecutionContext } from '../../shared/types/workflow.js';
import { db, sql } from '../../db/index.js';

export interface NodeProcessResult {
  nextNodeId: string | null;
  shouldPause: boolean;
  resumeAt?: Date;
  contextUpdates?: Partial<ExecutionContext>;
  error?: string;
}

/**
 * Process assignment node - assigns task to user/role and pauses workflow
 */
export async function processAssignmentNode(
  node: AssignmentNode,
  context: ExecutionContext
): Promise<NodeProcessResult> {
  const { assignTo, slaHours, escalateTo, allowedActions, taskType, requireAll } = node.config;

  console.log(`    👤 Assigning task to: ${assignTo}`);

  // Parse assignment target (role:uuid, user:uuid, or dynamic:site_manager)
  const [targetType, targetValue] = assignTo.split(':');

  // Calculate SLA deadline
  const slaDeadline = slaHours
    ? new Date(Date.now() + slaHours * 60 * 60 * 1000)
    : undefined;

  // Create task assignment
  await createWorkflowTask({
    executionId: context.requestId!, // TODO: Get from actual execution context
    nodeId: node.id,
    assignTo,
    taskType,
    allowedActions,
    slaDeadline,
    escalateTo
  });

  // Pause workflow until user takes action
  return {
    nextNodeId: node.next || null, // Will be used when resumed
    shouldPause: true,
    resumeAt: slaDeadline
  };
}

/**
 * Create workflow task and insert into database
 */
async function createWorkflowTask(data: {
  executionId: string;
  nodeId: string;
  assignTo: string;
  taskType: string;
  allowedActions: string[];
  slaDeadline?: Date;
  escalateTo?: string;
}): Promise<void> {
  const dbInstance = db();

  // Parse assignment target (role:uuid, user:uuid, or dynamic:site_manager)
  const [targetType, targetValue] = data.assignTo.split(':');

  let assignedToUserId: string | null = null;
  let assignedToRoleId: string | null = null;

  if (targetType === 'user') {
    assignedToUserId = targetValue;
  } else if (targetType === 'role') {
    assignedToRoleId = targetValue;
  } else if (targetType === 'dynamic') {
    // TODO: Resolve dynamic assignments (e.g., site_manager, requestor_manager)
    // For now, just log
    console.log(`    ⚠️ Dynamic assignment not fully implemented: ${targetValue}`);
  }

  // Prepare task data JSON
  const taskData = {
    allowedActions: data.allowedActions,
    assignmentType: targetType,
    assignmentValue: targetValue
  };

  // Insert task into workflow_tasks table
  await dbInstance.execute(
    sql`INSERT INTO workflow_tasks (
          execution_id,
          node_id,
          assigned_to_user_id,
          assigned_to_role_id,
          task_type,
          task_data,
          sla_deadline,
          escalated_to,
          status
        ) VALUES (
          ${data.executionId},
          ${data.nodeId},
          ${assignedToUserId},
          ${assignedToRoleId},
          ${data.taskType},
          ${JSON.stringify(taskData)},
          ${data.slaDeadline || null},
          ${data.escalateTo || null},
          'pending'
        )`
  );

  console.log(`    📋 Created task for ${data.assignTo} (SLA: ${data.slaDeadline?.toISOString() || 'none'})`);
}

/**
 * Resolve dynamic assignment targets
 * (e.g., site_manager, requestor_manager, budget_approver)
 */
async function resolveDynamicAssignment(
  dynamicTarget: string,
  context: ExecutionContext
): Promise<string | null> {
  const dbInstance = db();

  switch (dynamicTarget) {
    case 'requestor':
      return context.requestData?.requestorId || null;

    case 'site_manager':
      // Find site manager for the request's site
      if (!context.requestData?.siteId) return null;

      const siteManager = await dbInstance.execute(
        sql`SELECT u.id
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.site_id = ${context.requestData.siteId}
            AND r.name = 'Site Manager'
            LIMIT 1`
      );

      return siteManager && siteManager.length > 0
        ? (siteManager[0] as any).id
        : null;

    case 'requestor_manager':
      // Find requestor's manager (would require org hierarchy)
      // TODO: Implement manager hierarchy
      console.warn('Requestor manager assignment not yet implemented');
      return null;

    default:
      console.warn(`Unknown dynamic assignment: ${dynamicTarget}`);
      return null;
  }
}
