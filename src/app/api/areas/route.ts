import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAreaSchema, createSuccessResponse, createErrorResponse } from "@/lib/validation";

export async function GET(request: NextRequest) {
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

    // Get organization areas (check if we need to filter by isActive)
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const whereClause = includeInactive
      ? { orgId: membership.orgId }
      : { orgId: membership.orgId, isActive: true };

    const areas = await prisma.area.findMany({
      where: whereClause,
      include: {
        site: {
          select: { id: true, name: true, isActive: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(createSuccessResponse(areas));
  } catch (error) {
    console.error("Get areas error:", error);
    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Check if user has permission to create areas
    if (!["ADMIN", "PROCUREMENT"].includes(membership.role)) {
      return NextResponse.json(
        createErrorResponse("Insufficient permissions"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createAreaSchema.parse(body);

    // Verify the site belongs to the user's organization
    const site = await prisma.site.findFirst({
      where: {
        id: validatedData.siteId,
        orgId: membership.orgId,
      },
    });

    if (!site) {
      return NextResponse.json(
        createErrorResponse("Site not found or access denied"),
        { status: 404 }
      );
    }

    // Create area
    const area = await prisma.area.create({
      data: {
        orgId: membership.orgId,
        siteId: validatedData.siteId,
        name: validatedData.name,
        type: validatedData.type,
        inChargeUserId: validatedData.inChargeUserId,
        isActive: validatedData.isActive,
      },
      include: {
        site: {
          select: { name: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "AREA_CREATED",
        targetType: "Area",
        targetId: area.id,
        meta: {
          areaName: area.name,
          areaType: area.type,
          siteName: area.site.name,
          isActive: area.isActive,
        },
      },
    });

    return NextResponse.json(
      createSuccessResponse(area),
      { status: 201 }
    );
  } catch (error) {
    console.error("Create area error:", error);

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