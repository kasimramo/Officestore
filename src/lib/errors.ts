export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "Insufficient permissions") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class OrganizationMembershipError extends Error {
  constructor(message: string = "No organization membership found") {
    super(message);
    this.name = "OrganizationMembershipError";
  }
}

export function getHttpStatusForError(error: Error): number {
  if (error instanceof AuthenticationError) {
    return 401;
  }
  if (error instanceof AuthorizationError) {
    return 403;
  }
  if (error instanceof OrganizationMembershipError) {
    return 403;
  }
  return 500;
}

export function getErrorMessage(error: Error): string {
  if (error instanceof AuthenticationError) {
    return "Authentication required";
  }
  if (error instanceof AuthorizationError) {
    return "Insufficient permissions";
  }
  if (error instanceof OrganizationMembershipError) {
    return "Organization membership required";
  }
  return "Internal server error";
}