import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get all categories for the user's organization
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const organizationCategories = await db.select()
      .from(categories)
      .where(and(
        eq(categories.organization_id, user.organizationId),
        eq(categories.is_active, true)
      ))
      .orderBy(categories.name);

    res.json({
      success: true,
      data: organizationCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CATEGORIES_FETCH_ERROR',
        message: 'Failed to fetch categories'
      }
    });
  }
});

// Create a new category
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category name is required'
        }
      });
    }

    // Check if category name already exists for this organization
    const existingCategory = await db.select()
      .from(categories)
      .where(and(
        eq(categories.organization_id, user.organizationId),
        eq(categories.name, name.trim()),
        eq(categories.is_active, true)
      ))
      .limit(1);

    if (existingCategory.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_EXISTS',
          message: 'Category with this name already exists'
        }
      });
    }

    const [newCategory] = await db.insert(categories).values({
      organization_id: user.organizationId,
      name: name.trim(),
      description: description?.trim() || null
    }).returning();

    res.status(201).json({
      success: true,
      data: newCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CATEGORY_CREATE_ERROR',
        message: 'Failed to create category'
      }
    });
  }
});

// Update a category
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category name is required'
        }
      });
    }

    // Check if category exists and belongs to user's organization
    const existingCategory = await db.select()
      .from(categories)
      .where(and(
        eq(categories.id, id),
        eq(categories.organization_id, user.organizationId)
      ))
      .limit(1);

    if (existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found'
        }
      });
    }

    // Check if new name conflicts with existing categories (excluding current one)
    const nameConflict = await db.select()
      .from(categories)
      .where(and(
        eq(categories.organization_id, user.organizationId),
        eq(categories.name, name.trim()),
        eq(categories.is_active, true)
      ))
      .limit(1);

    if (nameConflict.length > 0 && nameConflict[0].id !== id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_EXISTS',
          message: 'Category with this name already exists'
        }
      });
    }

    const [updatedCategory] = await db.update(categories)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        is_active: is_active !== undefined ? is_active : existingCategory[0].is_active,
        updated_at: new Date()
      })
      .where(and(
        eq(categories.id, id),
        eq(categories.organization_id, user.organizationId)
      ))
      .returning();

    res.json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CATEGORY_UPDATE_ERROR',
        message: 'Failed to update category'
      }
    });
  }
});

// Delete a category (soft delete)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Check if category exists and belongs to user's organization
    const existingCategory = await db.select()
      .from(categories)
      .where(and(
        eq(categories.id, id),
        eq(categories.organization_id, user.organizationId)
      ))
      .limit(1);

    if (existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found'
        }
      });
    }

    // Soft delete the category
    await db.update(categories)
      .set({
        is_active: false,
        updated_at: new Date()
      })
      .where(and(
        eq(categories.id, id),
        eq(categories.organization_id, user.organizationId)
      ));

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CATEGORY_DELETE_ERROR',
        message: 'Failed to delete category'
      }
    });
  }
});

export { router as categoriesRouter };