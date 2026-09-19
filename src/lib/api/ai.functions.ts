import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Secure AI endpoints. Every handler body runs server-side only:
 * credentials, prompts and provider selection never reach the browser.
 */

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const DISCLAIMER = "AI-generated responses may contain errors. Verify important academic information with your lecturer or approved course materials.";

/** Provider status for the UI (demo badge / disabled states). */
export const getAIStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getAIProviderInfo, getDailyLimit } = await import("@/lib/ai/provider.server");
  const info = getAIProviderInfo();
  return { demo: info.demo, label: info.label, dailyLimit: getDailyLimit(), disclaimer: DISCLAIMER };
});

/** Conversational assistant with optional course awareness and persistence. */
export const aiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      messages: z.array(messageSchema).min(1).max(40),
      conversationId: z.string().uuid().nullable().default(null),
      courseId: z.string().uuid().nullable().default(null),
      persist: z.boolean().default(true),
      systemExtra: z.string().max(4000).nullable().default(null),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { getAIAdapter, AI_SAFETY_PROMPT, getMaxOutputTokens } = await import("@/lib/ai/provider.server");
    const { buildCourseContext, consumeQuota } = await import("@/lib/ai/context.server");

    let courseContext = "";
    if (data.courseId) {
      const built = await buildCourseContext(supabase, userId, data.courseId);
      courseContext = `\n\nActive course context:\n${built.context}`;
    }

    const usage = await consumeQuota(userId, "chat");
    const adapter = getAIAdapter();

    const reply = await adapter.complete(
      [
        { role: "system", content: `${AI_SAFETY_PROMPT}${courseContext}${data.systemExtra ? `\n\n${data.systemExtra}` : ""}` },
        ...data.messages,
      ],
      { maxOutputTokens: getMaxOutputTokens() },
    );

    let conversationId = data.conversationId;
    if (data.persist) {
      const lastUser = [...data.messages].reverse().find((m) => m.role === "user")?.content ?? "";
      if (!conversationId) {
        const { data: conv, error } = await supabase
          .from("ai_conversations")
          .insert({
            user_id: userId,
            course_id: data.courseId,
            title: lastUser.slice(0, 60) || "New conversation",
          })
          .select("id")
          .single();
        if (error) throw new Error("Could not save this conversation.");
        conversationId = conv.id;
      } else {
        await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      }
      await supabase.from("ai_messages").insert([
        { conversation_id: conversationId, role: "user", content: lastUser },
        { conversation_id: conversationId, role: "assistant", content: reply },
      ]);
    }

    return { content: reply, conversationId, usage, demo: adapter.info.demo };
  });

/* ---------------- Conversation history ---------------- */

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("ai_conversations")
      .select("id, title, course_id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    return data ?? [];
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("ai_messages")
      .select("role, content, created_at")
      .eq("conversation_id", data.id)
      .order("created_at");
    return (rows ?? []).filter((r) => r.role !== "system") as { role: "user" | "assistant"; content: string }[];
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ai_conversations").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete that conversation.");
    return { ok: true };
  });

/* ---------------- Study tools ---------------- */

const toolSchema = z.object({
  tool: z.enum(["notes", "flashcards", "quiz", "summary", "keypoints", "explain"]),
  courseId: z.string().uuid().nullable().default(null),
  materialId: z.string().uuid().nullable().default(null),
  topic: z.string().max(400).default(""),
  count: z.number().int().min(1).max(20).default(10),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).default("Intermediate"),
  questionType: z.enum(["Multiple Choice", "True/False", "Short Answer", "Mixed"]).default("Multiple Choice"),
  depth: z.enum(["Short summary", "Detailed notes", "Exam revision guide", "Key definitions"]).default("Detailed notes"),
});

export const generateStudyTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(toolSchema)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { getAIAdapter, AI_SAFETY_PROMPT, getMaxOutputTokens } = await import("@/lib/ai/provider.server");
    const { buildCourseContext, buildMaterialContext, consumeQuota } = await import("@/lib/ai/context.server");

    let ctx = "";
    if (data.materialId) ctx = (await buildMaterialContext(supabase, userId, data.materialId)).context;
    else if (data.courseId) ctx = (await buildCourseContext(supabase, userId, data.courseId)).context;

    const instructions: Record<string, string> = {
      notes: `Produce ${data.depth.toLowerCase()} on the topic below. Use clear headings, bullet points, key definitions, important concepts and 3 short self-test questions at the end.`,
      flashcards: `Create exactly ${data.count} flashcards on the topic below. Output ONLY a markdown list where each line is "Q: <question> || A: <answer>". No preamble.`,
      quiz: `Create exactly ${data.count} ${data.difficulty} practice questions (${data.questionType}) on the topic below. Number each question, list options A–D for multiple choice, and put a section "## Answer Key" at the end with brief explanations. These are PRACTICE questions only.`,
      summary: "Summarize the material below into: Short Summary, Detailed Summary, and Key Takeaways.",
      keypoints: "Extract the key points of the material below as a concise, well-ordered bullet list.",
      explain: "Explain the topic below in simple terms, then give a worked example and a common mistake to avoid.",
    };

    await consumeQuota(userId, `tool:${data.tool}`);
    const adapter = getAIAdapter();
    const content = await adapter.complete(
      [
        { role: "system", content: `${AI_SAFETY_PROMPT}${ctx ? `\n\nCourse context:\n${ctx}` : ""}` },
        { role: "user", content: `${instructions[data.tool]}\n\nTopic / focus: ${data.topic || "the course context above"}` },
      ],
      { maxOutputTokens: getMaxOutputTokens() },
    );
    return { content, demo: adapter.info.demo };
  });

/* ---------------- Saved study area ---------------- */

export const saveNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      kind: z.enum(["notes", "flashcards", "quiz"]),
      title: z.string().min(1).max(200),
      content: z.string().min(1),
      courseId: z.string().uuid().nullable().default(null),
    }),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ai_saved_notes").insert({
      user_id: context.userId,
      kind: data.kind,
      title: data.title,
      content: data.content,
      course_id: data.courseId,
    });
    if (error) throw new Error("Could not save this to your study area.");
    return { ok: true };
  });

export const listSavedNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("ai_saved_notes")
      .select("id, kind, title, content, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    return data ?? [];
  });

export const deleteSavedNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await context.supabase.from("ai_saved_notes").delete().eq("id", data.id);
    return { ok: true };
  });

/* ---------------- Planner, recommendations, insights ---------------- */

export const generateStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ hours: z.number().int().min(1).max(60).default(12), notes: z.string().max(1000).default("") }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { getAIAdapter, AI_SAFETY_PROMPT, getMaxOutputTokens } = await import("@/lib/ai/provider.server");
    const { buildStudentSnapshot, snapshotToPrompt, consumeQuota } = await import("@/lib/ai/context.server");

    const snapshot = await buildStudentSnapshot(supabase, userId);
    await consumeQuota(userId, "planner");
    const adapter = getAIAdapter();

    const content = await adapter.complete(
      [
        { role: "system", content: `${AI_SAFETY_PROMPT} You are also a realistic study planner. Never schedule study that clashes with a listed academic event. Use only the real data provided; do not invent grades or deadlines.` },
        {
          role: "user",
          content: [
            `Today is ${new Date().toDateString()}.`,
            `Available study hours per week: ${data.hours}.`,
            data.notes ? `Student notes: ${data.notes}` : "",
            "",
            "Real academic data:",
            snapshotToPrompt(snapshot),
            "",
            "Produce markdown with: 1) Priorities (High/Medium/Low) with reasons, 2) a Monday–Sunday schedule naming the course code, hours and specific topic per day, 3) exam/assessment preparation, 4) next 24 hours actions.",
          ].join("\n"),
        },
      ],
      { maxOutputTokens: getMaxOutputTokens() },
    );
    return { content, snapshot, demo: adapter.info.demo };
  });

/** Rule-based (never invented) recommendations + risk level, with optional AI phrasing. */
export const getStudentInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { buildStudentSnapshot } = await import("@/lib/ai/context.server");
    const s = await buildStudentSnapshot(context.supabase, context.userId);

    const recommendations: { tag: string; text: string }[] = [];
    if (s.overdueCount > 0)
      recommendations.push({ tag: "Overdue", text: `You have ${s.overdueCount} unsubmitted assignment${s.overdueCount > 1 ? "s" : ""} past the deadline. Speak to your lecturer and prioritise these.` });
    if (s.upcoming.length)
      recommendations.push({ tag: "Upcoming", text: `Next deadline: ${s.upcoming[0]!.title}${s.upcoming[0]!.due ? ` (due ${new Date(s.upcoming[0]!.due!).toDateString()})` : ""}.` });
    if (s.avgQuiz !== null && s.avgQuiz < 60)
      recommendations.push({ tag: "Practice", text: `Your quiz average is ${s.avgQuiz}%. Generate practice questions on your weakest topics before the next assessment.` });
    if (s.attendanceRate !== null && s.attendanceRate < 75)
      recommendations.push({ tag: "Attendance", text: `Your attendance is ${s.attendanceRate}%. Improving it usually improves continuous assessment scores.` });
    if (s.unfinishedVideos.length)
      recommendations.push({ tag: "Watch", text: `Unfinished lesson: "${s.unfinishedVideos[0]}". Completing it will close a gap in your course progress.` });
    if (!recommendations.length)
      recommendations.push({ tag: "On track", text: "No issues detected in your available academic data. Keep up the steady pace." });

    let score = 0;
    if (s.attendanceRate !== null && s.attendanceRate < 75) score += s.attendanceRate < 50 ? 2 : 1;
    if (s.overdueCount >= 3) score += 2;
    else if (s.overdueCount > 0) score += 1;
    if (s.avgQuiz !== null && s.avgQuiz < 50) score += 2;
    else if (s.avgQuiz !== null && s.avgQuiz < 60) score += 1;
    const risk: "low" | "moderate" | "high" = score >= 4 ? "high" : score >= 2 ? "moderate" : "low";

    const insights: string[] = [];
    if (s.courses.length) insights.push(`You are registered for ${s.courses.length} course${s.courses.length > 1 ? "s" : ""} this semester.`);
    if (s.assignmentCount) insights.push(`You have submitted ${s.submittedCount} of ${s.assignmentCount} assignments.`);
    if (s.avgAssignment !== null) insights.push(`Your average assignment score is ${s.avgAssignment}%.`);
    if (s.avgQuiz !== null) insights.push(`Your average quiz score across ${s.quizAttempts} attempts is ${s.avgQuiz}%.`);
    if (s.attendanceRate !== null) insights.push(`Attendance stands at ${s.attendanceRate}% of recorded sessions.`);
    if (s.events.length) insights.push(`There ${s.events.length === 1 ? "is" : "are"} ${s.events.length} upcoming academic event${s.events.length > 1 ? "s" : ""} in the calendar.`);

    return {
      snapshot: s,
      recommendations,
      insights,
      risk,
      riskNote: risk === "low" ? "No academic attention needed based on available data." : "Academic attention recommended based on available data.",
    };
  });

/* ---------------- Lecturer tools ---------------- */

export const lecturerAITool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      tool: z.enum(["quiz-draft", "assignment-ideas", "summarize", "discussion", "lesson-outline", "revision"]),
      courseId: z.string().uuid().nullable().default(null),
      topic: z.string().max(600).default(""),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isLecturer } = await supabase.rpc("has_role", { _user_id: userId, _role: "lecturer" });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isLecturer && !isAdmin) throw new Error("This tool is available to lecturers only.");

    const { getAIAdapter, AI_SAFETY_PROMPT, getMaxOutputTokens } = await import("@/lib/ai/provider.server");
    const { buildCourseContext, consumeQuota } = await import("@/lib/ai/context.server");

    const ctx = data.courseId ? (await buildCourseContext(supabase, userId, data.courseId)).context : "";
    const prompts: Record<string, string> = {
      "quiz-draft": "Draft 10 assessment questions with an answer key and marking guidance. Mark the draft as requiring lecturer review.",
      "assignment-ideas": "Propose 5 assignment ideas with learning outcomes, task description, deliverables and a marking rubric outline.",
      summarize: "Summarize the course materials listed in the context into a teaching brief with key topics and suggested sequencing.",
      discussion: "Write 8 discussion prompts that provoke critical thinking, each with a short facilitation note.",
      "lesson-outline": "Produce a 2-hour lesson outline: objectives, timing breakdown, activities, examples, and assessment of understanding.",
      revision: "Produce 12 revision questions of mixed difficulty with concise model answers.",
    };

    await consumeQuota(userId, `lecturer:${data.tool}`);
    const adapter = getAIAdapter();
    const content = await adapter.complete(
      [
        { role: "system", content: `${AI_SAFETY_PROMPT} You are assisting a lecturer. All output is a DRAFT that requires lecturer review before becoming official academic content.${ctx ? `\n\nCourse context:\n${ctx}` : ""}` },
        { role: "user", content: `${prompts[data.tool]}\n\nTopic / focus: ${data.topic || "the course context above"}` },
      ],
      { maxOutputTokens: getMaxOutputTokens() },
    );
    return { content, demo: adapter.info.demo };
  });

/* ---------------- Admin insights ---------------- */

export const getAdminAIInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Administrators only.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: courses }, { data: enrollments }, { data: assignments }, { data: submissions }, { data: usage }] =
      await Promise.all([
        supabaseAdmin.from("courses").select("id, code, title, level, status"),
        supabaseAdmin.from("enrollments").select("course_id"),
        supabaseAdmin.from("assignments").select("id, course_id"),
        supabaseAdmin.from("submissions").select("id, assignment_id"),
        supabaseAdmin.from("ai_usage").select("feature, request_count, usage_date").order("usage_date", { ascending: false }).limit(500),
      ]);

    const enrolCount = new Map<string, number>();
    (enrollments ?? []).forEach((e) => enrolCount.set(e.course_id, (enrolCount.get(e.course_id) ?? 0) + 1));

    const approved = (courses ?? []).filter((c) => c.status === "approved");
    const engagement = approved
      .map((c) => ({ code: c.code, title: c.title, level: c.level, students: enrolCount.get(c.id) ?? 0 }))
      .sort((a, b) => a.students - b.students);

    const byLevel = new Map<string, number>();
    approved.forEach((c) => byLevel.set(c.level, (byLevel.get(c.level) ?? 0) + (enrolCount.get(c.id) ?? 0)));

    const submissionRate = (assignments ?? []).length
      ? Math.round(((submissions ?? []).length / ((assignments ?? []).length * Math.max(1, (enrollments ?? []).length / Math.max(1, approved.length)))) * 100)
      : 0;

    const usageByFeature = new Map<string, number>();
    (usage ?? []).forEach((u) => usageByFeature.set(u.feature, (usageByFeature.get(u.feature) ?? 0) + u.request_count));
    const usageByDate = new Map<string, number>();
    (usage ?? []).forEach((u) => usageByDate.set(u.usage_date, (usageByDate.get(u.usage_date) ?? 0) + u.request_count));

    return {
      totals: {
        courses: approved.length,
        pendingCourses: (courses ?? []).length - approved.length,
        enrollments: (enrollments ?? []).length,
        assignments: (assignments ?? []).length,
        submissions: (submissions ?? []).length,
        submissionRate: Math.min(100, submissionRate),
      },
      lowEngagement: engagement.slice(0, 6),
      topEngagement: [...engagement].reverse().slice(0, 6),
      byLevel: [...byLevel.entries()].map(([level, students]) => ({ level, students })),
      aiUsage: {
        byFeature: [...usageByFeature.entries()].map(([feature, count]) => ({ feature, count })).sort((a, b) => b.count - a.count),
        byDate: [...usageByDate.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)).slice(-14),
        total: [...usageByFeature.values()].reduce((t, n) => t + n, 0),
      },
    };
  });
