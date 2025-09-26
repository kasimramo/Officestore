import { NextResponse } from "next/server";
import { getHttpStatusForError, getErrorMessage } from "./errors";
import { createErrorResponse } from "./validation";

export function handleApiError(error: Error): NextResponse {
  console.error("API Error:", error);

  const status = getHttpStatusForError(error);
  const message = getErrorMessage(error);

  return NextResponse.json(
    createErrorResponse(message),
    { status }
  );
}

export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error instanceof Error ? error : new Error(String(error)));
    }
  };
}