import { db } from '../db';
import { sql } from 'drizzle-orm';
import { approvalWorkflows, approvalLevels, workflowChangeLogs } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Get the active default workflow for an organization
 */
export async function getActiveWorkflow(organizationId: string): Promise<string | null> {
  // Query directly for active default workflow
  const workflows = await db
    .select({
      id: approvalWorkflows.id,
      name: approvalWorkflows.name,
      is_active: approvalWorkflows.is_active,
      is_default: approvalWorkflows.is_default
    })
    .from(approvalWorkflows)
    .where(
      and(
        eq(approvalWorkflows.organization_id, organizationId),
        eq(approvalWorkflows.is_active, true),
        eq(approvalWorkflows.is_default, true)
      )
    )
    .limit(1);

  console.log(`[workflow] getActiveWorkflow for org ${organizationId}:`, workflows);

  if (workflows.length === 0) {
    return null;
  }

  return workflows[0].id;
}

/**
 * Create a new version of a workflow
 * Archives the old version and creates a new one with incremented version number
 */
export async function createWorkflowVersion(
  workflowId: string,
  userId: string,
  changeSummary?: string
): Promise<string> {
  const result = await db.execute(sql`
    SELECT create_workflow_version(${workflowId}, ${userId}, ${changeSummary}) as new_workflow_id
  `);

  const newWorkflowId = result.rows[0]?.new_workflow_id;

  if (!newWorkflowId) {
    throw new Error('Failed to create workflow version');
  }

  // Copy approval levels from old workflow to new workflow
  const oldLevels = await db.select()
    .from(approvalLevels)
    .where(eq(approvalLevels.workflow_id, workflowId));

  for (const level of oldLevels) {
    await db.insert(approvalLevels).values({
      workflow_id: newWorkflowId,
      level_order: level.level_order,
      role_id: level.role_id
    });
  }

  return newWorkflowId;
}

/**
 * Get workflow version history (all versions of a workflow)
 */
export async function getWorkflowHistory(workflowId: string) {
  const versions = await db.execute(sql`
    WITH RECURSIVE workflow_history AS (
      SELECT * FROM approval_workflows WHERE id = ${workflowId}
      UNION ALL
      SELECT w.* FROM approval_workflows w
      INNER JOIN workflow_history wh ON w.id = wh.parent_workflow_id
    )
    SELECT * FROM workflow_history ORDER BY version DESC
  `);

  const changes = await db.select()
    .from(workflowChangeLogs)
    .where(eq(workflowChangeLogs.workflow_id, workflowId))
    .orderBy(desc(workflowChangeLogs.changed_at));

  return {
    versions: versions.rows,
    changes
  };
}

/**
 * Initialize approval entries for a request based on its workflow
 */
export async function initializeRequestApprovals(
  requestId: string,
  workflowId: string
): Promise<void> {
  const levels = await db.select()
    .from(approvalLevels)
    .where(eq(approvalLevels.workflow_id, workflowId))
    .orderBy(approvalLevels.level_order);

  for (const level of levels) {
    const status = level.level_order === 1 ? 'PENDING' : 'AWAITING';

    await db.execute(sql`
      INSERT INTO request_approvals (
        request_id,
        workflow_id,
        level_id,
        level_order,
        status
      ) VALUES (
        ${requestId},
        ${workflowId},
        ${level.id},
        ${level.level_order},
        ${status}
      )
    `);
  }
}
