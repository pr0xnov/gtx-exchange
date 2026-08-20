import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/session";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

/** Central error handler for API route try/catch blocks. */
export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError("Validation failed", 422, error.flatten().fieldErrors);
  }
  if (error instanceof UnauthorizedError) {
    return apiError(error.message, 401);
  }
  if (error instanceof ForbiddenError) {
    return apiError(error.message, 403);
  }
  if (error instanceof Error) {
    // eslint-disable-next-line no-console
    console.error("[API_ERROR]", error.message);
    return apiError(
      process.env.NODE_ENV === "development" ? error.message : "Internal server error",
      500
    );
  }
  // eslint-disable-next-line no-console
  console.error("[API_ERROR]", "Unknown error", error);
  return apiError("Internal server error", 500);
}
