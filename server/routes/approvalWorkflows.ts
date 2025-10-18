import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { approvalWorkflows, approvalLevels, roles } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { createWorkflowVersion, getWorkflowHistory } from '../services/workflowService.js';

const router = Router();

// Get all workflows for organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const workflowsData = await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.organization_id, organizationId));

    // Fetch levels for each workflow
    const workflowsWithLevels = await Promise.all(
      workflowsData.map(async (workflow) => {
        const levels = await db
          .select({
            id: approvalLevels.id,
            level_order: approvalLevels.level_order,
            role_id: approvalLevels.role_id,
            role_name: roles.name
          })
          .from(approvalLevels)
          .leftJoin(roles, eq(approvalLevels.role_id, roles.id))
          .where(eq(approvalLevels.workflow_id, workflow.id))
          .orderBy(approvalLevels.level_order);

        return {
          ...workflow,
          levels
        };
      })
    );

    res.json(workflowsWithLevels);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// Get workflow version history (must be before /:id route)
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    // Verify workflow belongs to organization
    const workflow = await db
      .select()
      .from(approvalWorkflows)
      .where(and(
        eq(approvalWorkflows.id, id),
        eq(approvalWorkflows.organization_id, organizationId!)
      ))
      .limit(1);

    if (workflow.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Get workflow history
    const history = await getWorkflowHistory(id);

    res.json(history);
  } catch (error) {
    console.error('Error fetching workflow history:', error);
    res.status(500).json({ error: 'Failed to fetch workflow history' });
  }
});

// Get single workflow
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const workflow = await db
      .select()
      .from(approvalWorkflows)
      .where(and(
        eq(approvalWorkflows.id, id),
        eq(approvalWorkflows.organization_id, organizationId!)
      ))
      .limit(1);

    if (workflow.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const levels = await db
      .select({
        id: approvalLevels.id,
        level_order: approvalLevels.level_order,
        role_id: approvalLevels.role_id,
        role_name: roles.name
      })
      .from(approvalLevels)
      .leftJoin(roles, eq(approvalLevels.role_id, roles.id))
      .where(eq(approvalLevels.workflow_id, id))
      .orderBy(approvalLevels.level_order);

    res.json({
      ...workflow[0],
      levels
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

// Create new workflow
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, trigger_type, trigger_conditions, is_default, levels } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await db
        .update(approvalWorkflows)
        .set({ is_default: false })
        .where(eq(approvalWorkflows.organization_id, organizationId));
    }

    // Create workflow
    const [workflow] = await db
      .insert(approvalWorkflows)
      .values({
        organization_id: organizationId,
        name,
        description,
        trigger_type: trigger_type || 'manual',
        trigger_conditions: trigger_conditions || {},
        is_default: is_default || false
      })
      .returning();

    // Create levels
    if (levels && levels.length > 0) {
      const levelValues = levels.map((level: any) => ({
        workflow_id: workflow.id,
        level_order: level.level_order,
        role_id: level.role_id
      }));

      await db.insert(approvalLevels).values(levelValues);
    }

    // Fetch the complete workflow with levels
    const levelsData = await db
      .select({
        id: approvalLevels.id,
        level_order: approvalLevels.level_order,
        role_id: approvalLevels.role_id,
        role_name: roles.name
      })
      .from(approvalLevels)
      .leftJoin(roles, eq(approvalLevels.role_id, roles.id))
      .where(eq(approvalLevels.workflow_id, workflow.id))
      .orderBy(approvalLevels.level_order);

    res.status(201).json({
      ...workflow,
      levels: levelsData
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// Update workflow (creates new version)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, trigger_type, trigger_conditions, is_default, levels, change_summary } = req.body;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // Verify workflow belongs to organization
    const existing = await db
      .select()
      .from(approvalWorkflows)
      .where(and(
        eq(approvalWorkflows.id, id),
        eq(approvalWorkflows.organization_id, organizationId!)
      ))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Temporarily unset is_default on the old workflow to avoid constraint violation
    if (existing[0].is_default) {
      await db
        .update(approvalWorkflows)
        .set({ is_default: false })
        .where(eq(approvalWorkflows.id, id));
    }

    // Create new version (archives old one)
    const newWorkflowId = await createWorkflowVersion(
      id,
      userId,
      change_summary || 'Workflow updated'
    );

    // If user explicitly set is_default to false, unset it on the new workflow
    // Otherwise, restore the default status from the original workflow
    const shouldBeDefault = is_default !== undefined ? is_default : existing[0].is_default;

    // Update the new workflow with provided changes
    const updatedWorkflow = await db
      .update(approvalWorkflows)
      .set({
        name: name || existing[0].name,
        description: description !== undefined ? description : existing[0].description,
        trigger_type: trigger_type || existing[0].trigger_type,
        trigger_conditions: trigger_conditions || existing[0].trigger_conditions,
        is_default: shouldBeDefault,
        updated_at: new Date()
      })
      .where(eq(approvalWorkflows.id, newWorkflowId))
      .returning();

    if (!updatedWorkflow || updatedWorkflow.length === 0) {
      throw new Error('Failed to update workflow version');
    }

    const workflow = updatedWorkflow[0];

    // Update levels if provided (already copied from old version in createWorkflowVersion)
    if (levels && levels.length > 0) {
      // Delete auto-copied levels
      await db
        .delete(approvalLevels)
        .where(eq(approvalLevels.workflow_id, newWorkflowId));

      // Insert new levels
      const levelValues = levels.map((level: any) => ({
        workflow_id: newWorkflowId,
        level_order: level.level_order,
        role_id: level.role_id
      }));

      await db.insert(approvalLevels).values(levelValues);
    }

    // Fetch the complete workflow with levels
    const levelsData = await db
      .select({
        id: approvalLevels.id,
        level_order: approvalLevels.level_order,
        role_id: approvalLevels.role_id,
        role_name: roles.name
      })
      .from(approvalLevels)
      .leftJoin(roles, eq(approvalLevels.role_id, roles.id))
      .where(eq(approvalLevels.workflow_id, newWorkflowId))
      .orderBy(approvalLevels.level_order);

    res.json({
      ...workflow,
      levels: levelsData,
      previous_version_id: id
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// Activate/Deactivate workflow
router.patch('/:id/activate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const organizationId = req.user?.organizationId;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }

    // Verify workflow belongs to organization
    const existing = await db
      .select()
      .from(approvalWorkflows)
      .where(and(
        eq(approvalWorkflows.id, id),
        eq(approvalWorkflows.organization_id, organizationId!)
      ))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // If activating a default workflow, deactivate all other workflows (only one default can be active)
    if (is_active && existing[0].is_default) {
      // First, deactivate ALL workflows for this organization
      await db
        .update(approvalWorkflows)
        .set({ is_active: false })
        .where(eq(approvalWorkflows.organization_id, organizationId!));

      // Then activate this one and make sure it's the only default
      await db
        .update(approvalWorkflows)
        .set({ is_default: false })
        .where(and(
          eq(approvalWorkflows.organization_id, organizationId!),
          eq(approvalWorkflows.is_default, true)
        ));
    }

    // Update the workflow
    const updated = await db
      .update(approvalWorkflows)
      .set({
        is_active,
        is_default: is_active && existing[0].is_default ? true : existing[0].is_default,
        updated_at: new Date()
      })
      .where(eq(approvalWorkflows.id, id))
      .returning();

    res.json({
      ...updated[0],
      message: `Workflow ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling workflow:', error);
    res.status(500).json({ error: 'Failed to toggle workflow' });
  }
});

// Delete workflow
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    // Verify workflow belongs to organization and is not default
    const existing = await db
      .select()
      .from(approvalWorkflows)
      .where(and(
        eq(approvalWorkflows.id, id),
        eq(approvalWorkflows.organization_id, organizationId!)
      ))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (existing[0].is_default) {
      return res.status(400).json({ error: 'Cannot delete default workflow' });
    }

    // Delete levels first (cascade should handle this, but being explicit)
    await db
      .delete(approvalLevels)
      .where(eq(approvalLevels.workflow_id, id));

    // Delete workflow
    await db
      .delete(approvalWorkflows)
      .where(eq(approvalWorkflows.id, id));

    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

export default router;
