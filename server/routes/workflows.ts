// Workflow Routes
// API endpoints for workflow management
// Date: 2025-10-09

import express, { Request, Response } from 'express';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';
import {
  WorkflowDefinitionSchema,
  CreateWorkflowSchema,
  UpdateWorkflowSchema,
  WorkflowTriggerEvent
} from '../shared/types/workflow.js';
import { executeWorkflow, getExecutionStatus } from '../helpers/workflowEngine.js';
import { validateCondition } from '../helpers/conditionEvaluator.js';

const router = express.Router();

// ============================================================================
// GET /api/workflows - List all workflows
// ============================================================================

router.get('/', requireAuth, checkPermission('workflows.view_workflows'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const organizationId = user.organizationId;

    // Use db directly (Proxy)

    // Get all workflows for organization
    const workflows = await db.execute(
      sql`SELECT
            id,
            organization_id,
            name,
            description,
            trigger_event,
            applies_to,
            is_active,
            version,
            created_by,
            created_at,
            updated_at
          FROM workflows
          WHERE organization_id = ${organizationId}
          ORDER BY created_at DESC`
    ) as any[];

    // Parse JSON fields if they're strings
    const parsedWorkflows = workflows.map(w => {
      if (typeof w.applies_to === 'string') {
        w.applies_to = JSON.parse(w.applies_to);
      }
      return w;
    });

    res.json({
      success: true,
      data: parsedWorkflows
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflows',
      error: (error as Error).message
    });
  }
});

// ============================================================================
// GET /api/workflows/:id - Get workflow details
// ============================================================================

router.get('/:id', requireAuth, checkPermission('workflows.view_workflows'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const organizationId = user.organizationId;

    // Use db directly (Proxy)

    // Get workflow with full JSON
    const result = await db.execute(
      sql`SELECT * FROM workflows
          WHERE id = ${id}
          AND organization_id = ${organizationId}
          LIMIT 1`
    );

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    const workflow = result[0] as any;

    // Parse JSON fields if they're strings
    if (typeof workflow.workflow_json === 'string') {
      workflow.workflow_json = JSON.parse(workflow.workflow_json);
    }
    if (typeof workflow.applies_to === 'string') {
      workflow.applies_to = JSON.parse(workflow.applies_to);
    }

    console.log('[workflow] GET /:id - Parsed workflow_json type:', typeof workflow.workflow_json);
    console.log('[workflow] GET /:id - Has nodes?', !!workflow.workflow_json?.nodes);
    console.log('[workflow] GET /:id - Nodes count:', workflow.workflow_json?.nodes?.length);

    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow',
      error: (error as Error).message
    });
  }
});

// ============================================================================
// POST /api/workflows - Create new workflow
// ============================================================================

router.post('/', requireAuth, checkPermission('workflows.create_workflows'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const organizationId = user.organizationId;
    const userId = user.userId;

    // Validate request body
    const validation = CreateWorkflowSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow data',
        errors: validation.error.errors
      });
    }

    const data = validation.data;

    // Validate workflow JSON structure
    const workflowValidation = WorkflowDefinitionSchema.safeParse(data.workflowJson);
    if (!workflowValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow definition',
        errors: workflowValidation.error.errors
      });
    }

    // Validate all conditions in decision nodes
    const conditionErrors: string[] = [];
    for (const node of data.workflowJson.nodes) {
      if (node.type === 'decision') {
        const conditionCheck = validateCondition((node as any).config.condition);
        if (!conditionCheck.valid) {
          conditionErrors.push(`Node ${node.id}: ${conditionCheck.error}`);
        }
      }
    }

    if (conditionErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conditions in workflow',
        errors: conditionErrors
      });
    }

    // Use db directly (Proxy)

    // Check for duplicate name
    const existing = await db.execute(
      sql`SELECT id FROM workflows
          WHERE organization_id = ${organizationId}
          AND name = ${data.name}
          LIMIT 1`
    );

    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Workflow with this name already exists'
      });
    }

    // Insert workflow
    const result = await db.execute(
      sql`INSERT INTO workflows (
            organization_id,
            name,
            description,
            trigger_event,
            applies_to,
            workflow_json,
            is_active,
            created_by
          ) VALUES (
            ${organizationId},
            ${data.name},
            ${data.description || null},
            ${data.triggerEvent},
            ${data.appliesTo ? JSON.stringify(data.appliesTo) : null},
            ${JSON.stringify(data.workflowJson)},
            ${data.isActive ?? true},
            ${userId}
          )
          RETURNING *`
    );

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      data: result[0]
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create workflow',
      error: (error as Error).message
    });
  }
});

// ============================================================================
// PUT /api/workflows/:id - Update workflow
// ============================================================================

router.put('/:id', requireAuth, checkPermission('workflows.edit_workflows'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const organizationId = user.organizationId;

    // Validate request body
    const validation = UpdateWorkflowSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow data',
        errors: validation.error.errors
      });
    }

    const data = validation.data;

    // Use db directly (Proxy)

    // Check workflow exists and belongs to organization
    const existing = await db.execute(
      sql`SELECT id FROM workflows
          WHERE id = ${id}
          AND organization_id = ${organizationId}
          LIMIT 1`
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${values.length + 1}`);
      values.push(data.description);
    }
    if (data.triggerEvent !== undefined) {
      updates.push(`trigger_event = $${values.length + 1}`);
      values.push(data.triggerEvent);
    }
    if (data.appliesTo !== undefined) {
      updates.push(`applies_to = $${values.length + 1}`);
      values.push(data.appliesTo ? JSON.stringify(data.appliesTo) : null);
    }
    if (data.workflowJson !== undefined) {
      // Validate workflow JSON
      const workflowValidation = WorkflowDefinitionSchema.safeParse(data.workflowJson);
      if (!workflowValidation.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid workflow definition',
          errors: workflowValidation.error.errors
        });
      }

      updates.push(`workflow_json = $${values.length + 1}`);
      values.push(JSON.stringify(data.workflowJson));
      updates.push(`version = version + 1`);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${values.length + 1}`);
      values.push(data.isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push('updated_at = NOW()');

    // Execute update
    const result = await db.execute(
      sql.raw(`UPDATE workflows
               SET ${updates.join(', ')}
               WHERE id = '${id}'
               RETURNING *`)
    );

    res.json({
      success: true,
      message: 'Workflow updated successfully',
      data: result[0]
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workflow',
      error: (error as Error).message
    });
  }
});

// ============================================================================
// DELETE /api/workflows/:id - Delete workflow
// ============================================================================

router.delete('/:id', requireAuth, checkPermission('workflows.delete_workflows'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const organizationId = user.organizationId;

    // Use db directly (Proxy)

    // Check if workflow has active executions
    const activeExecutions = await db.execute(
      sql`SELECT COUNT(*) as count
          FROM workflow_executions
          WHERE workflow_id = ${id}
          AND status IN ('in_progress', 'paused')`
    );

    const count = parseInt((activeExecutions[0] as any)?.count || '0');
    if (count > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete workflow with ${count} active execution(s). Deactivate it instead.`
      });
    }

    // Delete workflow (cascade will delete executions, history, tasks)
    const result = await db.execute(
      sql`DELETE FROM workflows
          WHERE id = ${id}
          AND organization_id = ${organizationId}
          RETURNING id`
    );

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workflow',
      error: (error as Error).message
    });
  }
});

// ============================================================================
// POST /api/workflows/:id/test - Test workflow with sample data
// ============================================================================

router.post('/:id/test', requireAuth, checkPermission('workflows.test_workflows'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sampleData } = req.body;
    const user = (req as any).user;
    const organizationId = user.organizationId;

    // Use db directly (Proxy)

    // Get workflow
    const result = await db.execute(
      sql`SELECT * FROM workflows
          WHERE id = ${id}
          AND organization_id = ${organizationId}
          LIMIT 1`
    );

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    const workflow = result[0] as any;
    const workflowDef = workflow.workflow_json;

    // Simulate execution (dry run - don't actually modify database)
    const executionPath: any[] = [];
    let currentNodeId = workflowDef.nodes[0]?.id;
    let iterations = 0;
    const maxIterations = 100;

    while (currentNodeId && iterations < maxIterations) {
      iterations++;

      const node = workflowDef.nodes.find((n: any) => n.id === currentNodeId);
      if (!node) break;

      executionPath.push({
        nodeId: node.id,
        nodeType: node.type,
        timestamp: new Date().toISOString()
      });

      // Simulate node processing
      if (node.type === 'decision') {
        try {
          const { evaluateCondition } = await import('../helpers/conditionEvaluator.js');
          const result = evaluateCondition(node.config.condition, sampleData);
          currentNodeId = result ? node.config.trueNodeId : node.config.falseNodeId;

          executionPath[executionPath.length - 1].decision = {
            condition: node.config.condition,
            result
          };
        } catch (error) {
          executionPath[executionPath.length - 1].error = (error as Error).message;
          break;
        }
      } else if (node.type === 'assignment') {
        // Would pause in real execution
        executionPath[executionPath.length - 1].action = 'Would pause for user action';
        currentNodeId = node.next;
        break; // Stop simulation at assignment
      } else if (node.next) {
        currentNodeId = node.next;
      } else {
        currentNodeId = null; // Terminal node
      }
    }

    res.json({
      success: true,
      message: 'Workflow test completed',
      data: {
        workflowName: workflow.name,
        executionPath,
        iterations,
        completed: currentNodeId === null,
        warning: iterations >= maxIterations ? 'Max iterations reached (possible loop)' : null
      }
    });
  } catch (error) {
    console.error('Error testing workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test workflow',
      error: (error as Error).message
    });
  }
});

// ============================================================================
// GET /api/workflows/:id/executions - Get workflow execution history
// ============================================================================

router.get('/:id/executions', requireAuth, checkPermission('workflows.view_workflows'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const organizationId = user.organizationId;

    // Use db directly (Proxy)

    // Verify workflow belongs to organization
    const workflow = await db.execute(
      sql`SELECT id FROM workflows
          WHERE id = ${id}
          AND organization_id = ${organizationId}
          LIMIT 1`
    );

    if (!workflow || workflow.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    // Get executions
    const executions = await db.execute(
      sql`SELECT
            we.*,
            r.id as request_id,
            r.status as request_status
          FROM workflow_executions we
          LEFT JOIN requests r ON we.request_id = r.id
          WHERE we.workflow_id = ${id}
          ORDER BY we.started_at DESC
          LIMIT 100`
    );

    res.json({
      success: true,
      data: executions
    });
  } catch (error) {
    console.error('Error fetching workflow executions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow executions',
      error: (error as Error).message
    });
  }
});

// ============================================================================
// POST /api/workflows/:id/duplicate - Duplicate workflow
// ============================================================================

router.post('/:id/duplicate', requireAuth, checkPermission('workflows.create_workflows'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const organizationId = user.organizationId;
    const userId = user.userId;

    // Use db directly (Proxy)

    // Get original workflow
    const result = await db.execute(
      sql`SELECT * FROM workflows
          WHERE id = ${id}
          AND organization_id = ${organizationId}
          LIMIT 1`
    );

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    const original = result[0] as any;

    // Create duplicate with " (Copy)" suffix
    const newName = `${original.name} (Copy)`;

    const duplicate = await db.execute(
      sql`INSERT INTO workflows (
            organization_id,
            name,
            description,
            trigger_event,
            applies_to,
            workflow_json,
            is_active,
            created_by
          ) VALUES (
            ${organizationId},
            ${newName},
            ${original.description},
            ${original.trigger_event},
            ${original.applies_to ? JSON.stringify(original.applies_to) : null},
            ${JSON.stringify(original.workflow_json)},
            false,
            ${userId}
          )
          RETURNING *`
    );

    res.status(201).json({
      success: true,
      message: 'Workflow duplicated successfully',
      data: duplicate[0]
    });
  } catch (error) {
    console.error('Error duplicating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate workflow',
      error: (error as Error).message
    });
  }
});

export default router;
