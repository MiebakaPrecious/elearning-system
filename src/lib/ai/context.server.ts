import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getDailyLimit } from "./provider.server";

type DB = SupabaseClient<Database>;

/** Throws unless the caller is enrolled in (or teaches / administers) the course. */
export async function assertCourseAccess(supabase: DB, userId: string, courseId: string) {
  const { data: course } = await supabase
    .from("courses")
    .select("id, code, title, description, level, semester_no, credit_units, lecturer_id")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) throw new Error("Course not found or not available to you.");

  if (course.lecturer_id === userId) return course;

  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (isAdmin) return course;

  const { data: enr } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (!enr) throw new Error("You are not registered for this course.");
  return course;
}

/** Course context string — only data the caller is already allowed to see. */
export async function buildCourseContext(supabase: DB, userId: string, courseId: string) {
  const course = await assertCourseAccess(supabase, userId, courseId);
  const [{ data: materials }, { data: videos }] = await Promise.all([
    supabase.from("materials").select("title, description").eq("course_id", courseId).limit(25),
    supabase.from("videos").select("title, description").eq("course_id", courseId).limit(25),
  ]);

  const lines = [
    `Course: ${course.code} — ${course.title}`,
    course.description ? `Description: ${course.description}` : null,
    `Level: ${course.level} · Semester ${course.semester_no ?? "—"} · ${course.credit_units ?? "—"} credit units`,
    materials?.length
      ? `Available learning materials: ${materials.map((m) => m.title).join("; ")}`
      : null,
    videos?.length ? `Video lessons: ${videos.map((v) => v.title).join("; ")}` : null,
  ].filter(Boolean);

  return { course, context: lines.join("\n") };
}

/** Material context — access-checked through the parent course. */
export async function buildMaterialContext(supabase: DB, userId: string, materialId: string) {
  const { data: material } = await supabase
    .from("materials")
    .select("id, title, description, file_type, course_id")
    .eq("id", materialId)
    .maybeSingle();
  if (!material) throw new Error("Material not found or not available to you.");
  const { course, context } = await buildCourseContext(supabase, userId, material.course_id);
  return {
    material,
    course,
    context: `${context}\n\nSelected learning material: "${material.title}"${material.description ? `\nMaterial description: ${material.description}` : ""}\nFile type: ${material.file_type ?? "unknown"}`,
  };
}

export type StudentSnapshot = Awaited<ReturnType<typeof buildStudentSnapshot>>;

/** Real, permission-scoped academic snapshot for planner / insights / risk. */
export async function buildStudentSnapshot(supabase: DB, userId: string) {
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, courses(code, title, level, semester_no)")
    .eq("student_id", userId);

  const courseIds = (enrollments ?? []).map((e) => e.course_id);

  const [assignments, submissions, attempts, attendance, sessions, events, videos, progress] = await Promise.all([
    courseIds.length
      ? supabase.from("assignments").select("id, title, due_date, course_id, max_score").in("course_id", courseIds)
      : Promise.resolve({ data: [] as never[] }),
    supabase.from("submissions").select("id, assignment_id, score, submitted_at").eq("student_id", userId),
    supabase.from("quiz_attempts").select("id, quiz_id, score, submitted_at").eq("student_id", userId),
    supabase.from("attendance_records").select("id, session_id, status").eq("student_id", userId),
    courseIds.length
      ? supabase.from("attendance_sessions").select("id, course_id, session_date").in("course_id", courseIds)
      : Promise.resolve({ data: [] as never[] }),
    supabase.from("events").select("title, event_type, start_at").gte("start_at", new Date().toISOString()).order("start_at").limit(15),
    courseIds.length
      ? supabase.from("videos").select("id, title, course_id").in("course_id", courseIds)
      : Promise.resolve({ data: [] as never[] }),
    supabase.from("video_progress").select("video_id, completed").eq("student_id", userId),
  ]);

  const courses = (enrollments ?? []).map((e) => {
    const c = e.courses as unknown as { code: string; title: string; level: string; semester_no: number | null } | null;
    return { id: e.course_id, code: c?.code ?? "—", title: c?.title ?? "—", level: c?.level ?? "—" };
  });

  const asg = assignments.data ?? [];
  const subs = submissions.data ?? [];
  const submittedIds = new Set(subs.map((s) => s.assignment_id));
  const now = Date.now();
  const upcoming = asg
    .filter((a) => a.due_date && new Date(a.due_date).getTime() > now && !submittedIds.has(a.id))
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
  const overdue = asg.filter((a) => a.due_date && new Date(a.due_date).getTime() < now && !submittedIds.has(a.id));

  const scored = subs.filter((s) => typeof s.score === "number");
  const avgAssignment = scored.length
    ? Math.round(scored.reduce((t, s) => t + (s.score ?? 0), 0) / scored.length)
    : null;

  const quizScored = (attempts.data ?? []).filter((a) => typeof a.score === "number");
  const avgQuiz = quizScored.length
    ? Math.round(quizScored.reduce((t, a) => t + (a.score ?? 0), 0) / quizScored.length)
    : null;

  const totalSessions = (sessions.data ?? []).length;
  const present = (attendance.data ?? []).filter((r) => r.status === "present").length;
  const attendanceRate = totalSessions ? Math.round((present / totalSessions) * 100) : null;

  const completedVideos = new Set((progress.data ?? []).filter((p) => p.completed).map((p) => p.video_id));
  const unfinishedVideos = (videos.data ?? []).filter((v) => !completedVideos.has(v.id));

  return {
    courses,
    assignmentCount: asg.length,
    submittedCount: subs.length,
    upcoming: upcoming.slice(0, 8).map((a) => ({ title: a.title, due: a.due_date })),
    overdueCount: overdue.length,
    overdue: overdue.slice(0, 5).map((a) => ({ title: a.title, due: a.due_date })),
    avgAssignment,
    avgQuiz,
    quizAttempts: quizScored.length,
    attendanceRate,
    totalSessions,
    unfinishedVideos: unfinishedVideos.slice(0, 6).map((v) => v.title),
    events: (events.data ?? []).map((e) => ({ title: e.title, type: e.event_type, at: e.start_at })),
  };
}

export function snapshotToPrompt(s: StudentSnapshot) {
  return [
    `Enrolled courses: ${s.courses.map((c) => `${c.code} ${c.title}`).join("; ") || "none registered yet"}`,
    `Assignments: ${s.assignmentCount} total, ${s.submittedCount} submitted, ${s.overdueCount} missed.`,
    s.upcoming.length ? `Upcoming assignment deadlines: ${s.upcoming.map((a) => `${a.title} (due ${a.due})`).join("; ")}` : "No upcoming assignment deadlines recorded.",
    s.avgAssignment !== null ? `Average assignment score: ${s.avgAssignment}%.` : "No graded assignments yet.",
    s.avgQuiz !== null ? `Average quiz score across ${s.quizAttempts} attempts: ${s.avgQuiz}%.` : "No quiz attempts yet.",
    s.attendanceRate !== null ? `Attendance: ${s.attendanceRate}% of ${s.totalSessions} recorded sessions.` : "No attendance sessions recorded.",
    s.unfinishedVideos.length ? `Unfinished video lessons: ${s.unfinishedVideos.join("; ")}` : "All video lessons completed or none available.",
    s.events.length ? `Upcoming academic events: ${s.events.map((e) => `${e.title} (${e.type}, ${e.at})`).join("; ")}` : "No upcoming academic events recorded.",
  ].join("\n");
}

/** Per-user, per-feature daily fair-use counter. Returns remaining requests. */
export async function consumeQuota(userId: string, feature: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const limit = getDailyLimit();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabaseAdmin
    .from("ai_usage")
    .select("id, request_count")
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("usage_date", today)
    .maybeSingle();

  const used = existing?.request_count ?? 0;
  if (used >= limit) {
    throw new Error(`You have reached today's AI usage limit (${limit} requests). Please try again tomorrow.`);
  }

  if (existing) {
    await supabaseAdmin.from("ai_usage").update({ request_count: used + 1 }).eq("id", existing.id);
  } else {
    await supabaseAdmin.from("ai_usage").insert({ user_id: userId, feature, usage_date: today, request_count: 1 });
  }
  return { used: used + 1, limit, remaining: limit - used - 1 };
}
