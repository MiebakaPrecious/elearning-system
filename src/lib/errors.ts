/** Turns raw database / network errors into wording a student or lecturer can act on. */
export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw = typeof err === "string" ? err : (err as { message?: string })?.message ?? "";
  const msg = raw.trim();
  if (!msg) return fallback;

  // Messages we raise ourselves in the database are already user-facing.
  const known = [
    "deadline", "not enrolled", "already been graded", "not open for registration",
    "not available for your level", "attendance session has closed", "another student",
  ];
  if (known.some((k) => msg.toLowerCase().includes(k))) return msg.replace(/^.*?:\s*/, "");

  const lower = msg.toLowerCase();
  if (lower.includes("duplicate key") || lower.includes("already exists")) {
    if (lower.includes("matric")) return "That matric number is already registered.";
    if (lower.includes("staff")) return "That staff ID is already registered.";
    if (lower.includes("enrollments")) return "You are already registered for this course.";
    return "This record already exists.";
  }
  if (lower.includes("foreign key")) return "Unable to complete this action. Please check the selected course and try again.";
  if (lower.includes("row-level security") || lower.includes("permission denied") || lower.includes("not authorized")) {
    return "You do not have permission to do this.";
  }
  if (lower.includes("violates check constraint") || lower.includes("invalid input")) {
    return "Some of the information entered is not valid. Please review and try again.";
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "Connection problem. Check your internet and try again.";
  }
  if (lower.includes("invalid login credentials")) return "Incorrect sign-in details. Please check and try again.";
  if (lower.includes("email not confirmed")) return "Please confirm your email address before signing in.";
  return msg.length > 140 ? fallback : msg;
}
