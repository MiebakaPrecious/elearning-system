import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "create_announcement",
  title: "Create announcement",
  description:
    "Post a new announcement as the signed-in user. Only lecturers and admins are permitted; a course id scopes it to that course.",
  inputSchema: {
    title: z.string().describe("Announcement headline."),
    body: z.string().optional().describe("Announcement body text."),
    course_id: z.string().uuid().optional().describe("Course to scope the announcement to."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ title, body, course_id }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const clean = title.trim();
    if (!clean) return fail("Title is required.");
    const { data, error } = await supabaseForUser(ctx)
      .from("announcements")
      .insert({ title: clean, body: body ?? null, course_id: course_id ?? null, author_id: ctx.getUserId()! })
      .select("id, title, body, course_id, created_at")
      .maybeSingle();
    return error ? fail(error.message) : ok(data);
  },
});
