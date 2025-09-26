import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateCatalogueSku } from "@/lib/catalogue";
import { createCatalogueItemSchema, createSuccessResponse, createErrorResponse } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(createErrorResponse("Unauthorized"), { status: 401 });
    }

    // Get user's current organization
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(createErrorResponse("No organization membership found"), { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const skip = (page - 1) * limit;

    // Build where clause for Prisma
    const whereClause: any = {
      orgId: membership.orgId,
      active: true,
    };

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { vendorSku: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    const [items, totalCount, categories] = await Promise.all([
      // Get paginated results
      prisma.catalogueItem.findMany({
        where: whereClause,
        include: {
          creator: { select: { name: true } },
        },
        orderBy: { name: "asc" },
        take: limit,
        skip,
      }),

      // Get total count
      prisma.catalogueItem.count({ where: whereClause }),

      // Get categories for filtering
      prisma.catalogueItem
        .findMany({
          where: { orgId: membership.orgId, active: true },
          select: { category: true },
          distinct: ["category"],
          orderBy: { category: "asc" },
        })
        .then((cats) => cats.map((c) => c.category)),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const catalogueData = {
      items: items.map((item) => ({
        id: item.id,
        sku: item.sku,
        vendor_sku: item.vendorSku,
        name: item.name,
        category: item.category,
        unit: item.unit,
        pack_size: item.packSize,
        image_url: item.imageUrl,
        unit_price: item.unitPrice,
        currency: item.currency,
        show_price_to_users: item.showPriceToUsers,
        active: item.active,
        created_at: item.createdAt.toISOString(),
        creator_name: item.creator?.name,
      })),
      categories,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    };

    return NextResponse.json(createSuccessResponse(catalogueData.items, catalogueData.meta));
  } catch (error) {
    console.error("Get catalogue error:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(createErrorResponse("Unauthorized"), { status: 401 });
    }

    // Get user's current organization
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(createErrorResponse("No organization membership found"), { status: 404 });
    }

    const body = await request.json();
    const validatedData = createCatalogueItemSchema.parse(body);

    const generatedSku = await generateCatalogueSku(membership.orgId);

    // Create the catalogue item
    const item = await prisma.catalogueItem.create({
      data: {
        orgId: membership.orgId,
        sku: generatedSku,
        vendorSku: validatedData.vendorSku,
        name: validatedData.name,
        category: validatedData.category,
        unit: validatedData.unit,
        packSize: validatedData.packSize,
        imageUrl: validatedData.imageUrl,
        unitPrice: validatedData.unitPrice,
        currency: validatedData.currency,
        showPriceToUsers: validatedData.showPriceToUsers,
        createdBy: session.user.id,
      },
    });

    // Create version record
    await prisma.catalogueVersion.create({
      data: {
        itemId: item.id,
        orgId: membership.orgId,
        actorId: session.user.id,
        diffJson: {
          action: "created",
          data: {
            ...validatedData,
            sku: generatedSku,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CATALOGUE_ITEM_CREATED",
        targetType: "CatalogueItem",
        targetId: item.id,
        meta: {
          sku: generatedSku,
          vendorSku: validatedData.vendorSku,
          name: validatedData.name,
          category: validatedData.category,
          unitPrice: validatedData.unitPrice,
          currency: validatedData.currency,
          showPriceToUsers: validatedData.showPriceToUsers,
        },
      },
    });

    return NextResponse.json(createSuccessResponse(item), { status: 201 });
  } catch (error: any) {
    console.error("Create catalogue item error:", error);

    if (error?.name === "ZodError") {
      return NextResponse.json(createErrorResponse("Invalid input data"), { status: 400 });
    }

    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}
