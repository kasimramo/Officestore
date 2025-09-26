import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSiteSchema, createSuccessResponse, createErrorResponse } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorResponse("Unauthorized"),
        { status: 401 }
      );
    }

    // Get user's current organization (for now, get the first one)
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

    // Get organization sites (check if we need to filter by isActive)
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const whereClause = includeInactive
      ? { orgId: membership.orgId }
      : { orgId: membership.orgId, isActive: true };

    const sites = await prisma.site.findMany({
      where: whereClause,
      include: {
        areas: {
          where: includeInactive ? {} : { isActive: true },
          select: { id: true, name: true, type: true, isActive: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(createSuccessResponse(sites));
  } catch (error) {
    console.error("Get sites error:", error);
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

    // Check if user has permission to create sites
    if (!["ADMIN", "PROCUREMENT"].includes(membership.role)) {
      return NextResponse.json(
        createErrorResponse("Insufficient permissions"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createSiteSchema.parse(body);

    // Create site
    const site = await prisma.site.create({
      data: {
        orgId: membership.orgId,
        name: validatedData.name,
        timezone: validatedData.timezone,
        locale: validatedData.locale,
        isActive: validatedData.isActive,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "SITE_CREATED",
        targetType: "Site",
        targetId: site.id,
        meta: {
          siteName: site.name,
          timezone: site.timezone,
          locale: site.locale,
          isActive: site.isActive,
        },
      },
    });

    return NextResponse.json(
      createSuccessResponse(site),
      { status: 201 }
    );
  } catch (error) {
    console.error("Create site error:", error);

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