import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_announcements",
  title: "List announcements",
  description: "List the most recent announcements visible to the signed-in user.",
  inputSchema: {
    course_id: z.string().uuid().optional().describe("Restrict to one course id."),
    limit: z.number().int().optional().describe("Max rows to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ course_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    let query = supabaseForUser(ctx)
      .from("announcements")
      .select("id, title, body, course_id, created_at, courses(code, title)")
      .order("created_at", { ascending: false })
      .limit(Math.min(limit ?? 20, 100));
    if (course_id) query = query.eq("course_id", course_id);
    const { data, error } = await query;
    return error ? fail(error.message) : ok(data);
  },
});
