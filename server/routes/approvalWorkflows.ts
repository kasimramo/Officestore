import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { approvalWorkflows, approvalLevels, roles } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

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

// Update workflow
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, trigger_type, trigger_conditions, is_default, levels } = req.body;
    const organizationId = req.user?.organizationId;

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

    // If this is set as default, unset other defaults
    if (is_default) {
      await db
        .update(approvalWorkflows)
        .set({ is_default: false })
        .where(and(
          eq(approvalWorkflows.organization_id, organizationId!),
          eq(approvalWorkflows.id, id)
        ));
    }

    // Update workflow
    const [workflow] = await db
      .update(approvalWorkflows)
      .set({
        name,
        description,
        trigger_type: trigger_type || 'manual',
        trigger_conditions: trigger_conditions || {},
        is_default: is_default || false,
        updated_at: new Date()
      })
      .where(eq(approvalWorkflows.id, id))
      .returning();

    // Delete existing levels
    await db
      .delete(approvalLevels)
      .where(eq(approvalLevels.workflow_id, id));

    // Create new levels
    if (levels && levels.length > 0) {
      const levelValues = levels.map((level: any) => ({
        workflow_id: id,
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
      .where(eq(approvalLevels.workflow_id, id))
      .orderBy(approvalLevels.level_order);

    res.json({
      ...workflow,
      levels: levelsData
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
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
