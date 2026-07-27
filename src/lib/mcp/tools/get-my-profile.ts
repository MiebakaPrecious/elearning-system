import { defineTool } from "@lovable.dev/mcp-js";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "get_my_profile",
  title: "Get my profile",
  description:
    "Get the signed-in user's eLearning System profile: name, email, level, matric/staff ID, approval status and roles.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const [{ data: profile, error }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, level, matric_number, staff_id, phone, approval_status")
        .eq("id", userId!)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId!),
    ]);
    if (error) return fail(error.message);
    return ok({ profile, roles: (roles ?? []).map((r) => r.role) });
  },
});
