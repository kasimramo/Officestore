import { Router, Request, Response } from 'express';
import { eq, and, ilike, or } from 'drizzle-orm';
import { db } from '../config/database.js';
import { catalogueItems, categories } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get all catalogue items for the user's organization with optional filtering
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { search, category_id, status } = req.query;

    let query = db.select({
      id: catalogueItems.id,
      name: catalogueItems.name,
      description: catalogueItems.description,
      category: catalogueItems.category,
      category_id: catalogueItems.category_id,
      unit: catalogueItems.unit,
      cost_per_unit: catalogueItems.cost_per_unit,
      supplier: catalogueItems.supplier,
      minimum_stock: catalogueItems.minimum_stock,
      image_url: catalogueItems.image_url,
      is_active: catalogueItems.is_active,
      created_at: catalogueItems.created_at,
      updated_at: catalogueItems.updated_at,
      category_name: categories.name
    })
    .from(catalogueItems)
    .leftJoin(categories, eq(catalogueItems.category_id, categories.id))
    .where(and(
      eq(catalogueItems.organization_id, user.organizationId),
      status === 'active' ? eq(catalogueItems.is_active, true) :
      status === 'inactive' ? eq(catalogueItems.is_active, false) : undefined
    ));

    // Add search filter
    if (search && typeof search === 'string') {
      query = query.where(and(
        eq(catalogueItems.organization_id, user.organizationId),
        or(
          ilike(catalogueItems.name, `%${search}%`),
          ilike(catalogueItems.description, `%${search}%`),
          ilike(catalogueItems.supplier, `%${search}%`)
        )
      ));
    }

    // Add category filter
    if (category_id && typeof category_id === 'string') {
      query = query.where(and(
        eq(catalogueItems.organization_id, user.organizationId),
        eq(catalogueItems.category_id, category_id)
      ));
    }

    const items = await query.orderBy(catalogueItems.name);

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching catalogue items:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CATALOGUE_FETCH_ERROR',
        message: 'Failed to fetch catalogue items'
      }
    });
  }
});

// Get a specific catalogue item
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const [item] = await db.select({
      id: catalogueItems.id,
      name: catalogueItems.name,
      description: catalogueItems.description,
      category: catalogueItems.category,
      category_id: catalogueItems.category_id,
      unit: catalogueItems.unit,
      cost_per_unit: catalogueItems.cost_per_unit,
      supplier: catalogueItems.supplier,
      minimum_stock: catalogueItems.minimum_stock,
      image_url: catalogueItems.image_url,
      is_active: catalogueItems.is_active,
      created_at: catalogueItems.created_at,
      updated_at: catalogueItems.updated_at,
      category_name: categories.name
    })
    .from(catalogueItems)
    .leftJoin(categories, eq(catalogueItems.category_id, categories.id))
    .where(and(
      eq(catalogueItems.id, id),
      eq(catalogueItems.organization_id, user.organizationId)
    ))
    .limit(1);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Catalogue item not found'
        }
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching catalogue item:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CATALOGUE_ITEM_FETCH_ERROR',
        message: 'Failed to fetch catalogue item'
      }
    });
  }
});

// Create a new catalogue item
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      name,
      description,
      category_id,
      unit,
      cost_per_unit,
      supplier,
      minimum_stock,
      image_url
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Item name is required'
        }
      });
    }

    if (!unit || !unit.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unit is required'
        }
      });
    }

    // Validate category exists if provided
    if (category_id) {
      const [categoryExists] = await db.select()
        .from(categories)
        .where(and(
          eq(categories.id, category_id),
          eq(categories.organization_id, user.organizationId),
          eq(categories.is_active, true)
        ))
        .limit(1);

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: 'Category not found or inactive'
          }
        });
      }
    }

    // Check if item name already exists for this organization
    const existingItem = await db.select()
      .from(catalogueItems)
      .where(and(
        eq(catalogueItems.organization_id, user.organizationId),
        eq(catalogueItems.name, name.trim()),
        eq(catalogueItems.is_active, true)
      ))
      .limit(1);

    if (existingItem.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ITEM_EXISTS',
          message: 'Item with this name already exists'
        }
      });
    }

    const [newItem] = await db.insert(catalogueItems).values({
      organization_id: user.organizationId,
      name: name.trim(),
      description: description?.trim() || null,
      category_id: category_id || null,
      unit: unit.trim(),
      cost_per_unit: cost_per_unit ? String(cost_per_unit) : null,
      supplier: supplier?.trim() || null,
      minimum_stock: minimum_stock ? parseInt(minimum_stock) : null,
      image_url: image_url?.trim() || null
    }).returning();

    // Fetch the created item with category info
    const [itemWithCategory] = await db.select({
      id: catalogueItems.id,
      name: catalogueItems.name,
      description: catalogueItems.description,
      category: catalogueItems.category,
      category_id: catalogueItems.category_id,
      unit: catalogueItems.unit,
      cost_per_unit: catalogueItems.cost_per_unit,
      supplier: catalogueItems.supplier,
      minimum_stock: catalogueItems.minimum_stock,
      image_url: catalogueItems.image_url,
      is_active: catalogueItems.is_active,
      created_at: catalogueItems.created_at,
      updated_at: catalogueItems.updated_at,
      category_name: categories.name
    })
    .from(catalogueItems)
    .leftJoin(categories, eq(catalogueItems.category_id, categories.id))
    .where(eq(catalogueItems.id, newItem.id))
    .limit(1);

    res.status(201).json({
      success: true,
      data: itemWithCategory
    });
  } catch (error) {
    console.error('Error creating catalogue item:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CATALOGUE_CREATE_ERROR',
        message: 'Failed to create catalogue item'
      }
    });
  }
});

// Update a catalogue item
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const {
      name,
      description,
      category_id,
      unit,
      cost_per_unit,
      supplier,
      minimum_stock,
      image_url,
      is_active
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Item name is required'
        }
      });
    }

    if (!unit || !unit.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unit is required'
        }
      });
    }

    // Check if item exists and belongs to user's organization
    const existingItem = await db.select()
      .from(catalogueItems)
      .where(and(
        eq(catalogueItems.id, id),
        eq(catalogueItems.organization_id, user.organizationId)
      ))
      .limit(1);

    if (existingItem.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Catalogue item not found'
        }
      });
    }

    // Validate category exists if provided
    if (category_id) {
      const [categoryExists] = await db.select()
        .from(categories)
        .where(and(
          eq(categories.id, category_id),
          eq(categories.organization_id, user.organizationId),
          eq(categories.is_active, true)
        ))
        .limit(1);

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: 'Category not found or inactive'
          }
        });
      }
    }

    // Check if new name conflicts with existing items (excluding current one)
    const nameConflict = await db.select()
      .from(catalogueItems)
      .where(and(
        eq(catalogueItems.organization_id, user.organizationId),
        eq(catalogueItems.name, name.trim()),
        eq(catalogueItems.is_active, true)
      ))
      .limit(1);

    if (nameConflict.length > 0 && nameConflict[0].id !== id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ITEM_EXISTS',
          message: 'Item with this name already exists'
        }
      });
    }

    const [updatedItem] = await db.update(catalogueItems)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        category_id: category_id || null,
        unit: unit.trim(),
        cost_per_unit: cost_per_unit ? String(cost_per_unit) : null,
        supplier: supplier?.trim() || null,
        minimum_stock: minimum_stock ? parseInt(minimum_stock) : null,
        image_url: image_url?.trim() || null,
        is_active: is_active !== undefined ? is_active : existingItem[0].is_active,
        updated_at: new Date()
      })
      .where(and(
        eq(catalogueItems.id, id),
        eq(catalogueItems.organization_id, user.organizationId)
      ))
      .returning();

    // Fetch the updated item with category info
    const [itemWithCategory] = await db.select({
      id: catalogueItems.id,
      name: catalogueItems.name,
      description: catalogueItems.description,
      category: catalogueItems.category,
      category_id: catalogueItems.category_id,
      unit: catalogueItems.unit,
      cost_per_unit: catalogueItems.cost_per_unit,
      supplier: catalogueItems.supplier,
      minimum_stock: catalogueItems.minimum_stock,
      image_url: catalogueItems.image_url,
      is_active: catalogueItems.is_active,
      created_at: catalogueItems.created_at,
      updated_at: catalogueItems.updated_at,
      category_name: categories.name
    })
    .from(catalogueItems)
    .leftJoin(categories, eq(catalogueItems.category_id, categories.id))
    .where(eq(catalogueItems.id, updatedItem.id))
    .limit(1);

    res.json({
      success: true,
      data: itemWithCategory
    });
  } catch (error) {
    console.error('Error updating catalogue item:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CATALOGUE_UPDATE_ERROR',
        message: 'Failed to update catalogue item'
      }
    });
  }
});

// Delete a catalogue item (soft delete)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Check if item exists and belongs to user's organization
    const existingItem = await db.select()
      .from(catalogueItems)
      .where(and(
        eq(catalogueItems.id, id),
        eq(catalogueItems.organization_id, user.organizationId)
      ))
      .limit(1);

    if (existingItem.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Catalogue item not found'
        }
      });
    }

    // Soft delete the item
    await db.update(catalogueItems)
      .set({
        is_active: false,
        updated_at: new Date()
      })
      .where(and(
        eq(catalogueItems.id, id),
        eq(catalogueItems.organization_id, user.organizationId)
      ));

    res.json({
      success: true,
      message: 'Catalogue item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting catalogue item:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CATALOGUE_DELETE_ERROR',
        message: 'Failed to delete catalogue item'
      }
    });
  }
});

// Toggle catalogue item status (activate/deactivate)
router.patch('/:id/toggle-status', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Check if item exists and belongs to user's organization
    const existingItem = await db.select()
      .from(catalogueItems)
      .where(and(
        eq(catalogueItems.id, id),
        eq(catalogueItems.organization_id, user.organizationId)
      ))
      .limit(1);

    if (existingItem.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Catalogue item not found'
        }
      });
    }

    const currentItem = existingItem[0];
    const newStatus = !currentItem.is_active;

    const [updatedItem] = await db.update(catalogueItems)
      .set({
        is_active: newStatus,
        updated_at: new Date()
      })
      .where(and(
        eq(catalogueItems.id, id),
        eq(catalogueItems.organization_id, user.organizationId)
      ))
      .returning();

    // Fetch the updated item with category info
    const [itemWithCategory] = await db.select({
      id: catalogueItems.id,
      name: catalogueItems.name,
      description: catalogueItems.description,
      category: catalogueItems.category,
      category_id: catalogueItems.category_id,
      unit: catalogueItems.unit,
      cost_per_unit: catalogueItems.cost_per_unit,
      supplier: catalogueItems.supplier,
      minimum_stock: catalogueItems.minimum_stock,
      image_url: catalogueItems.image_url,
      is_active: catalogueItems.is_active,
      created_at: catalogueItems.created_at,
      updated_at: catalogueItems.updated_at,
      category_name: categories.name
    })
    .from(catalogueItems)
    .leftJoin(categories, eq(catalogueItems.category_id, categories.id))
    .where(eq(catalogueItems.id, updatedItem.id))
    .limit(1);

    res.json({
      success: true,
      data: itemWithCategory,
      message: `Catalogue item ${newStatus ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling catalogue item status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CATALOGUE_TOGGLE_ERROR',
        message: 'Failed to toggle catalogue item status'
      }
    });
  }
});

export { router as catalogueItemsRouter };