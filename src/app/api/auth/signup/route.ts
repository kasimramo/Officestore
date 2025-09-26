import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signUpSchema, createSuccessResponse, createErrorResponse } from "@/lib/validation";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Validate input
    const validatedData = signUpSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        createErrorResponse("User with this email already exists"),
        { status: 400 }
      );
    }

    // TODO: Verify hCaptcha token if provided
    // if (validatedData.hcaptchaToken) {
    //   const isValidCaptcha = await verifyHCaptcha(validatedData.hcaptchaToken);
    //   if (!isValidCaptcha) {
    //     return NextResponse.json(
    //       createErrorResponse("Invalid captcha"),
    //       { status: 400 }
    //     );
    //   }
    // }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user with credentials in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
        },
      });

      await tx.userCredential.create({
        data: {
          userId: newUser.id,
          hashedPassword,
        },
      });

      return newUser;
    });

    // Record terms acceptance
    await prisma.userAgreement.create({
      data: {
        userId: user.id,
        termsVersion: "v1.0",
        ip,
        userAgent,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "USER_SIGNUP",
        targetType: "User",
        targetId: user.id,
        meta: {
          email: user.email,
          ip,
        },
      },
    });

    return NextResponse.json(
      createSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);

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