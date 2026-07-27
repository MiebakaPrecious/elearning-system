import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_assignments",
  title: "List assignments",
  description:
    "List assignments visible to the signed-in user, optionally filtered to one course and to upcoming due dates only.",
  inputSchema: {
    course_id: z.string().uuid().optional().describe("Restrict to one course id."),
    upcoming_only: z.boolean().optional().describe("Only assignments due in the future."),
    limit: z.number().int().optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ course_id, upcoming_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    let query = supabaseForUser(ctx)
      .from("assignments")
      .select("id, title, description, due_at, max_score, course_id, courses(code, title)")
      .order("due_at", { ascending: true })
      .limit(Math.min(limit ?? 50, 200));
    if (course_id) query = query.eq("course_id", course_id);
    if (upcoming_only) query = query.gte("due_at", new Date().toISOString());
    const { data, error } = await query;
    return error ? fail(error.message) : ok(data);
  },
});
