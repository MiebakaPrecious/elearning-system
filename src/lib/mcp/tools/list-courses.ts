import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_courses",
  title: "List courses",
  description:
    "List Computer Science courses, optionally filtered by academic level (ND1, ND2, HND1, HND2) or semester number (1 or 2).",
  inputSchema: {
    level: z.enum(["ND1", "ND2", "HND1", "HND2"]).optional().describe("Academic level filter."),
    semester_no: z.number().int().optional().describe("Semester number: 1 or 2."),
    limit: z.number().int().optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ level, semester_no, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    let query = supabaseForUser(ctx)
      .from("courses")
      .select("id, code, title, description, level, semester_no, status")
      .order("code")
      .limit(Math.min(limit ?? 50, 200));
    if (level) query = query.eq("level", level);
    if (semester_no) query = query.eq("semester_no", semester_no);
    const { data, error } = await query;
    return error ? fail(error.message) : ok(data);
  },
});
