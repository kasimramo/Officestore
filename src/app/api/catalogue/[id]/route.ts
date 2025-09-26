import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSuccessResponse, createErrorResponse } from "@/lib/validation";
import { z } from "zod";

const updateCatalogueItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  unit: z.string().min(1).max(50).optional(),
  packSize: z.string().max(100).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  unitPrice: z.number().positive().nullable().optional(),
  currency: z.string().length(3).optional(),
  showPriceToUsers: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorResponse("Unauthorized"),
        { status: 401 }
      );
    }

    // Get user's current organization
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        createErrorResponse("No organization membership found"),
        { status: 404 }
      );
    }

    // Get catalogue item
    const item = await prisma.catalogueItem.findFirst({
      where: {
        id: params.id,
        orgId: membership.orgId
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        siteOverrides: {
          include: {
            site: { select: { id: true, name: true } }
          }
        }
      },
    });

    if (!item) {
      return NextResponse.json(
        createErrorResponse("Catalogue item not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse(item));
  } catch (error) {
    console.error("Get catalogue item error:", error);
    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorResponse("Unauthorized"),
        { status: 401 }
      );
    }

    // Get user's current organization
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        createErrorResponse("No organization membership found"),
        { status: 404 }
      );
    }

    // Check if user has permission to update catalogue items
    if (!["ADMIN", "PROCUREMENT"].includes(membership.role)) {
      return NextResponse.json(
        createErrorResponse("Insufficient permissions"),
        { status: 403 }
      );
    }

    // Verify item belongs to organization
    const existingItem = await prisma.catalogueItem.findFirst({
      where: {
        id: params.id,
        orgId: membership.orgId
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        createErrorResponse("Catalogue item not found"),
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateCatalogueItemSchema.parse(body);

    // Update catalogue item
    const item = await prisma.catalogueItem.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    // Create version record for tracking changes
    await prisma.catalogueVersion.create({
      data: {
        itemId: item.id,
        orgId: membership.orgId,
        actorId: session.user.id,
        diffJson: {
          action: "updated",
          changes: validatedData,
          previousValues: {
            name: existingItem.name,
            category: existingItem.category,
            unit: existingItem.unit,
            packSize: existingItem.packSize,
            imageUrl: existingItem.imageUrl,
            unitPrice: existingItem.unitPrice,
            currency: existingItem.currency,
            showPriceToUsers: existingItem.showPriceToUsers,
            active: existingItem.active,
          }
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CATALOGUE_ITEM_UPDATED",
        targetType: "CatalogueItem",
        targetId: item.id,
        meta: {
          sku: item.sku,
          name: item.name,
          changes: validatedData,
        },
      },
    });

    return NextResponse.json(createSuccessResponse(item));
  } catch (error) {
    console.error("Update catalogue item error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        createErrorResponse("Invalid input data"),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}