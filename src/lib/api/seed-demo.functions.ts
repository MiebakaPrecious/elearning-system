import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-only: seed demo students, lecturers and an admin so dashboards
 * have realistic logins. Idempotent — re-running upserts the same accounts.
 *
 * Default password (configurable per call): Demo1234!
 */
export const seedDemoAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ password: z.string().min(8).default("Demo1234!") }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Caller MUST be an admin
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(`Role check failed: ${roleErr.message}`);
    if (!isAdmin) throw new Error("Forbidden: admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    type Seed = {
      email: string;
      full_name: string;
      role: "admin" | "lecturer" | "student";
      level?: "ND1" | "ND2" | "HND1" | "HND2";
      matric_number?: string;
      staff_id?: string;
    };

    const demos: Seed[] = [
      { email: "admin@kenpoly.demo", full_name: "Demo Admin", role: "admin", staff_id: "ADM-001" },
      // Lecturers
      { email: "lecturer1@kenpoly.demo", full_name: "Dr. Amaka Okafor", role: "lecturer", staff_id: "CSL-101" },
      { email: "lecturer2@kenpoly.demo", full_name: "Engr. Tunde Bello", role: "lecturer", staff_id: "CSL-102" },
      { email: "lecturer3@kenpoly.demo", full_name: "Mrs. Ifeoma Eze", role: "lecturer", staff_id: "CSL-103" },
      // Students (3 per level)
      ...(["ND1", "ND2", "HND1", "HND2"] as const).flatMap((level, li) =>
        [1, 2, 3].map((i) => ({
          email: `student.${level.toLowerCase()}.${i}@kenpoly.demo`,
          full_name: `Demo ${level} Student ${i}`,
          role: "student" as const,
          level,
          matric_number: `CS/${2025 - li}/${String(100 + li * 10 + i).padStart(4, "0")}`,
        })),
      ),
    ];

    const results: { email: string; status: "created" | "exists" | "error"; message?: string }[] = [];

    for (const seed of demos) {
      try {
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: seed.email,
          password: data.password,
          email_confirm: true,
          user_metadata: {
            full_name: seed.full_name,
            role: seed.role,
            level: seed.level,
            matric_number: seed.matric_number,
            staff_id: seed.staff_id,
          },
        });

        let uid = created?.user?.id;
        if (createErr) {
          // Already exists — look up id
          const msg = createErr.message.toLowerCase();
          if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
            const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
            uid = list?.users.find((u) => u.email === seed.email)?.id;
            results.push({ email: seed.email, status: "exists" });
          } else {
            results.push({ email: seed.email, status: "error", message: createErr.message });
            continue;
          }
        } else {
          results.push({ email: seed.email, status: "created" });
        }

        if (!uid) continue;

        // Approve profile + ensure role
        await supabaseAdmin.from("profiles").update({
          approval_status: "approved",
          full_name: seed.full_name,
          level: seed.level ?? null,
          matric_number: seed.matric_number ?? null,
          staff_id: seed.staff_id ?? null,
        }).eq("id", uid);

        await supabaseAdmin.from("user_roles").upsert(
          { user_id: uid, role: seed.role },
          { onConflict: "user_id,role" },
        );
      } catch (err) {
        results.push({
          email: seed.email,
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { password: data.password, total: demos.length, results };
  });
