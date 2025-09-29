import { Router } from 'express';
import { db } from '../config/database.js';
import { areas, sites } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ensureOrganizationExists } from '../helpers/organizationHelper.js';

const router = Router();

// Get all areas for organization
router.get('/', async (req, res) => {
  try {
    // Ensure organization exists and get its ID
    const organizationId = await ensureOrganizationExists();

    const allAreas = await db
      .select({
        id: areas.id,
        siteId: areas.site_id,
        name: areas.name,
        description: areas.description,
        isActive: areas.is_active,
        createdAt: areas.created_at,
        siteName: sites.name
      })
      .from(areas)
      .leftJoin(sites, eq(areas.site_id, sites.id))
      .where(eq(areas.organization_id, organizationId));

    const formattedAreas = allAreas.map(area => ({
      id: area.id,
      siteId: area.siteId,
      name: area.name,
      description: area.description,
      isActive: area.isActive,
      createdAt: area.createdAt.toISOString(),
      siteName: area.siteName
    }));

    res.json({
      success: true,
      data: formattedAreas
    });
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_AREAS_ERROR',
        message: 'Failed to fetch areas'
      }
    });
  }
});

// Create new area
router.post('/', async (req, res) => {
  try {
    const { siteId, name, description } = req.body;

    if (!siteId || !name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Site ID and area name are required'
        }
      });
    }

    // Ensure organization exists and get its ID
    const organizationId = await ensureOrganizationExists();

    // Verify the site exists and belongs to the organization
    const site = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.organization_id, organizationId)))
      .limit(1);

    if (site.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SITE_NOT_FOUND',
          message: 'Site not found'
        }
      });
    }

    const newArea = await db
      .insert(areas)
      .values({
        id: randomUUID(),
        site_id: siteId,
        organization_id: organizationId,
        name,
        description,
        is_active: true
      })
      .returning();

    const areaData = {
      id: newArea[0].id,
      siteId: newArea[0].site_id,
      name: newArea[0].name,
      description: newArea[0].description,
      isActive: newArea[0].is_active,
      createdAt: newArea[0].created_at.toISOString(),
      siteName: site[0].name
    };

    res.status(201).json({
      success: true,
      data: areaData
    });
  } catch (error) {
    console.error('Error creating area:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_AREA_ERROR',
        message: 'Failed to create area'
      }
    });
  }
});

// Update area
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Area name is required'
        }
      });
    }

    // Ensure organization exists and get its ID
    const organizationId = await ensureOrganizationExists();

    // Verify the area exists and belongs to the organization
    const existingArea = await db
      .select()
      .from(areas)
      .where(and(eq(areas.id, id), eq(areas.organization_id, organizationId)))
      .limit(1);

    if (existingArea.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AREA_NOT_FOUND',
          message: 'Area not found'
        }
      });
    }

    const updatedArea = await db
      .update(areas)
      .set({
        name,
        description,
        updated_at: new Date()
      })
      .where(eq(areas.id, id))
      .returning();

    // Get the site name for the response
    const site = await db
      .select({ name: sites.name })
      .from(sites)
      .where(eq(sites.id, updatedArea[0].site_id))
      .limit(1);

    const areaData = {
      id: updatedArea[0].id,
      siteId: updatedArea[0].site_id,
      name: updatedArea[0].name,
      description: updatedArea[0].description,
      isActive: updatedArea[0].is_active,
      createdAt: updatedArea[0].created_at.toISOString(),
      siteName: site[0]?.name || 'Unknown Site'
    };

    res.json({
      success: true,
      data: areaData
    });
  } catch (error) {
    console.error('Error updating area:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_AREA_ERROR',
        message: 'Failed to update area'
      }
    });
  }
});

// Toggle area status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure organization exists and get its ID
    const organizationId = await ensureOrganizationExists();

    // Verify the area exists and belongs to the organization
    const existingArea = await db
      .select()
      .from(areas)
      .where(and(eq(areas.id, id), eq(areas.organization_id, organizationId)))
      .limit(1);

    if (existingArea.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AREA_NOT_FOUND',
          message: 'Area not found'
        }
      });
    }

    const newStatus = !existingArea[0].is_active;

    const updatedArea = await db
      .update(areas)
      .set({
        is_active: newStatus,
        updated_at: new Date()
      })
      .where(eq(areas.id, id))
      .returning();

    // Get the site name for the response
    const site = await db
      .select({ name: sites.name })
      .from(sites)
      .where(eq(sites.id, updatedArea[0].site_id))
      .limit(1);

    const areaData = {
      id: updatedArea[0].id,
      siteId: updatedArea[0].site_id,
      name: updatedArea[0].name,
      description: updatedArea[0].description,
      isActive: updatedArea[0].is_active,
      createdAt: updatedArea[0].created_at.toISOString(),
      siteName: site[0]?.name || 'Unknown Site'
    };

    res.json({
      success: true,
      data: areaData
    });
  } catch (error) {
    console.error('Error toggling area status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TOGGLE_AREA_STATUS_ERROR',
        message: 'Failed to toggle area status'
      }
    });
  }
});

export { router as areasRouter };