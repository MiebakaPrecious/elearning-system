import { defineTool } from "@lovable.dev/mcp-js";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_my_enrollments",
  title: "List my enrolled courses",
  description: "List the courses the signed-in student is enrolled in.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("enrollments")
      .select("id, enrolled_at, courses(id, code, title, level, semester_no, status)")
      .eq("student_id", ctx.getUserId()!)
      .order("enrolled_at", { ascending: false });
    return error ? fail(error.message) : ok(data);
  },
});
