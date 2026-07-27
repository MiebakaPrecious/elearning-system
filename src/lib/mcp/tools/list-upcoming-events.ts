import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_upcoming_events",
  title: "List upcoming events",
  description: "List upcoming academic events (lectures, exams, deadlines) on the department calendar.",
  inputSchema: { limit: z.number().int().optional().describe("Max rows to return (default 20).") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("events")
      .select("id, title, description, location, audience, starts_at, ends_at")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(Math.min(limit ?? 20, 100));
    return error ? fail(error.message) : ok(data);
  },
});
