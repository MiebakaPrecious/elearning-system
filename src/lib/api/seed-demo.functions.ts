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

    const lecturerNames = [
      "Dr. Amaka Okafor",
      "Engr. Tunde Bello",
      "Mrs. Ifeoma Eze",
      "Mr. Chukwuma Nwosu",
      "Dr. Blessing Wike",
      "Mr. Barinua Kpea",
    ];

    const demos: Seed[] = [
      { email: "admin@kenpoly.demo", full_name: "Demo Admin", role: "admin", staff_id: "ADM-001" },
      ...lecturerNames.map((full_name, idx) => ({
        email: `lecturer${idx + 1}@kenpoly.demo`,
        full_name,
        role: "lecturer" as const,
        staff_id: `CSL-${101 + idx}`,
      })),
      ...(["ND1", "ND2", "HND1", "HND2"] as const).flatMap((level, li) =>
        [1, 2, 3, 4, 5].map((i) => ({
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

/**
 * Admin-only: populate the CS Department with realistic academic data —
 * assigns lecturers to courses, enrolls demo students, and inserts
 * materials, videos, quizzes, announcements, events, discussions,
 * attendance history, achievements and certificates.
 * Idempotent: existing rows are left alone.
 */
export const seedAcademicData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const counts = {
      lecturers_assigned: 0, courses_approved: 0, enrollments: 0,
      materials: 0, videos: 0, announcements: 0, events: 0,
      discussions: 0, replies: 0, quizzes: 0, questions: 0,
      attendance_sessions: 0, attendance_records: 0,
      achievements: 0, certificates: 0,
    };

    // Fetch demo users
    const { data: lecturerRows } = await supabaseAdmin
      .from("profiles").select("id,email,full_name")
      .like("email", "lecturer%@kenpoly.demo").order("email");
    const { data: studentRows } = await supabaseAdmin
      .from("profiles").select("id,email,full_name,level")
      .like("email", "student.%@kenpoly.demo");
    const { data: adminRow } = await supabaseAdmin
      .from("profiles").select("id").eq("email", "admin@kenpoly.demo").maybeSingle();

    const lecturers = lecturerRows ?? [];
    const students = studentRows ?? [];
    if (lecturers.length === 0) {
      throw new Error("Run 'Seed demo accounts' first — no lecturer accounts found.");
    }

    // Approve + assign lecturers to all courses (round-robin)
    const { data: courses } = await supabaseAdmin
      .from("courses").select("id,code,title,level,semester_no,lecturer_id,status")
      .order("level").order("semester_no").order("code");
    const courseList = courses ?? [];

    for (let idx = 0; idx < courseList.length; idx++) {
      const c = courseList[idx];
      const patch: { status?: "approved"; lecturer_id?: string } = {};
      if (c.status !== "approved") { patch.status = "approved"; counts.courses_approved++; }
      if (!c.lecturer_id) {
        patch.lecturer_id = lecturers[idx % lecturers.length].id;
        counts.lecturers_assigned++;
      }
      if (Object.keys(patch).length) {
        await supabaseAdmin.from("courses").update(patch).eq("id", c.id);
      }
    }

    // Refresh course list w/ lecturer_id
    const { data: freshCourses } = await supabaseAdmin
      .from("courses").select("id,code,title,level,semester_no,lecturer_id")
      .eq("status", "approved");
    const cs = freshCourses ?? [];
    const csByLevel = (level: string) => cs.filter((c) => c.level === level);
    const csById = new Map(cs.map((c) => [c.id, c] as const));

    // Enrollments — each student in every course at their level
    const enrollRows: { student_id: string; course_id: string }[] = [];
    for (const s of students) {
      if (!s.level) continue;
      for (const c of csByLevel(s.level)) {
        enrollRows.push({ student_id: s.id, course_id: c.id });
      }
    }
    if (enrollRows.length) {
      const { data: existing } = await supabaseAdmin
        .from("enrollments").select("student_id,course_id");
      const seen = new Set((existing ?? []).map((e) => `${e.student_id}:${e.course_id}`));
      const fresh = enrollRows.filter((r) => !seen.has(`${r.student_id}:${r.course_id}`));
      if (fresh.length) {
        const { error } = await supabaseAdmin.from("enrollments").insert(fresh);
        if (!error) counts.enrollments = fresh.length;
      }
    }

    // Utility: only insert per-course rows when the course has none yet
    const admin: any = supabaseAdmin;
    async function ensurePerCourse<T>(
      table: string,
      rowsFor: (c: (typeof cs)[number]) => T[],
    ) {
      const { data: existing } = await admin.from(table).select("course_id");
      const seen = new Set((existing ?? []).map((r: any) => r.course_id));
      const rows: T[] = [];
      for (const c of cs) if (!seen.has(c.id)) rows.push(...rowsFor(c));
      if (!rows.length) return 0;
      const { error } = await admin.from(table).insert(rows);
      if (error) throw new Error(`${table}: ${error.message}`);
      return rows.length;
    }

    // Materials — 3 per fresh course
    counts.materials = await ensurePerCourse("materials", (c) => [
      { course_id: c.id, title: `${c.code} — Course Outline & Syllabus`, description: `Official syllabus, lecture schedule and grading policy for ${c.title}.`, file_type: "pdf", file_url: "https://kbsp.edu.ng/materials/outline.pdf", uploaded_by: c.lecturer_id },
      { course_id: c.id, title: `${c.code} — Week 1–4 Lecture Notes`, description: `Consolidated lecture notes covering foundational topics in ${c.title}.`, file_type: "pdf", file_url: "https://kbsp.edu.ng/materials/notes-w1-4.pdf", uploaded_by: c.lecturer_id },
      { course_id: c.id, title: `${c.code} — Lab Manual`, description: `Practical exercises and lab work for ${c.title}.`, file_type: "pdf", file_url: "https://kbsp.edu.ng/materials/lab-manual.pdf", uploaded_by: c.lecturer_id },
    ]);

    // Videos — 2 per fresh course
    counts.videos = await ensurePerCourse("videos", (c) => [
      { course_id: c.id, title: `Introduction to ${c.title}`, description: `Kick-off lecture: what to expect and how the course is structured.`, url: "https://www.youtube.com/embed/rfscVS0vtbw", duration_sec: 1800, uploaded_by: c.lecturer_id },
      { course_id: c.id, title: `${c.title} — Core Concepts Walkthrough`, description: `A guided walkthrough of the most important concepts in ${c.title}.`, url: "https://www.youtube.com/embed/8jLOx1hD3_o", duration_sec: 2700, uploaded_by: c.lecturer_id },
    ]);

    // Announcements — 1 per fresh course + a few global (course_id null)
    counts.announcements = await ensurePerCourse("announcements", (c) => [
      { course_id: c.id, author_id: c.lecturer_id, title: `${c.code}: Week 1 Kick-off`, body: `Welcome to ${c.title}. Class begins Monday. Please review the course outline and download the Week 1 lecture notes before the first session.` },
    ]);

    // Global announcements — only if no null-course announcements yet
    const { data: globals } = await supabaseAdmin.from("announcements").select("id").is("course_id", null);
    if ((globals?.length ?? 0) === 0 && adminRow) {
      const globalAnn = [
        { author_id: adminRow.id, course_id: null, title: "2025/2026 Session Resumption", body: "All ND and HND students are to resume for the new academic session on Monday, October 6th. Course registration closes October 24th." },
        { author_id: adminRow.id, course_id: null, title: "Mid-Semester Test Schedule", body: "The Mid-Semester Test week begins November 17th. Please check your dashboard for the full timetable and venues." },
        { author_id: adminRow.id, course_id: null, title: "SIWES Registration Open", body: "ND2 students proceeding on SIWES should submit placement letters at the departmental office by November 30th." },
        { author_id: adminRow.id, course_id: null, title: "HND2 Project Defense Schedule", body: "Final year project defense holds January 12th – 16th. Ensure your project chapters 1–5 are approved by your supervisor two weeks before your slot." },
        { author_id: adminRow.id, course_id: null, title: "First Semester Examination Timetable", body: "The First Semester examination timetable has been published. Please cross-check your matric number, level and venue on the exams portal." },
      ];
      const { error } = await supabaseAdmin.from("announcements").insert(globalAnn);
      if (!error) counts.announcements += globalAnn.length;
    }

    // Events — insert a canonical set if events count is small
    const { count: evtCount } = await supabaseAdmin.from("events").select("*", { count: "exact", head: true });
    if ((evtCount ?? 0) < 10 && adminRow) {
      const now = new Date();
      const daysFrom = (n: number, h = 10) => {
        const d = new Date(now); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return d.toISOString();
      };
      const evtRows = [
        { title: "Departmental Orientation for New Students", description: "Welcome program for freshly admitted ND1 students of the CS Department.", location: "CS Auditorium", audience: "students", starts_at: daysFrom(3, 9), ends_at: daysFrom(3, 13), created_by: adminRow.id },
        { title: "Coding Competition — CodeSprint 2026", description: "Inter-level coding contest sponsored by the Department. Cash prizes and internship placements for winners.", location: "ICT Lab 2", audience: "students", starts_at: daysFrom(14, 10), ends_at: daysFrom(14, 17), created_by: adminRow.id },
        { title: "Tech Workshop: Building with the MERN Stack", description: "Hands-on workshop for HND1 and HND2 on production-ready MERN development.", location: "ICT Lab 1", audience: "students", starts_at: daysFrom(21, 11), ends_at: daysFrom(21, 15), created_by: adminRow.id },
        { title: "HND2 Project Defense Week", description: "Final year project defenses across all supervisors.", location: "CS Seminar Room", audience: "all", starts_at: daysFrom(28, 9), ends_at: daysFrom(32, 16), created_by: adminRow.id },
        { title: "Career Seminar: Landing Your First Tech Job", description: "Industry panel with alumni working at Andela, Interswitch, Flutterwave and Paystack.", location: "Main Auditorium", audience: "all", starts_at: daysFrom(35, 10), ends_at: daysFrom(35, 13), created_by: adminRow.id },
        { title: "Cybersecurity Hackathon", description: "48-hour CTF-style hackathon co-hosted with the KBSP ICT Directorate.", location: "ICT Complex", audience: "students", starts_at: daysFrom(45, 9), ends_at: daysFrom(47, 18), created_by: adminRow.id },
      ];
      const { error } = await supabaseAdmin.from("events").insert(evtRows);
      if (!error) counts.events += evtRows.length;
    }

    // Discussions — 1 per fresh course + first-reply from lecturer
    const { data: existingDisc } = await supabaseAdmin.from("discussions").select("course_id");
    const seenDisc = new Set((existingDisc ?? []).map((r) => r.course_id));
    const discRows: any[] = [];
    for (const c of cs) if (!seenDisc.has(c.id)) discRows.push({
      course_id: c.id, author_id: c.lecturer_id,
      title: `Discussion — ${c.title}`,
      body: `Use this thread to ask questions, share resources and discuss weekly topics for ${c.code}. Be respectful and cite your sources.`,
    });
    if (discRows.length) {
      const { data: inserted, error } = await supabaseAdmin.from("discussions").insert(discRows).select("id,course_id,author_id");
      if (!error && inserted) {
        counts.discussions = inserted.length;
        // Add 1–2 replies each
        const replies: any[] = [];
        for (const d of inserted) {
          const c = csById.get(d.course_id);
          if (!c) continue;
          // Reply from a student enrolled in this course level
          const student = students.find((s) => s.level === c.level);
          if (student) replies.push({ discussion_id: d.id, author_id: student.id, body: `Thanks Sir/Ma — really looking forward to ${c.title}. Where can we find last year's past questions?` });
          if (d.author_id) replies.push({ discussion_id: d.id, author_id: d.author_id, body: `Past questions are pinned on the course materials page. Please read the Week 1 notes before Friday's tutorial.` });
        }
        if (replies.length) {
          const { error: rerr } = await supabaseAdmin.from("discussion_replies").insert(replies);
          if (!rerr) counts.replies = replies.length;
        }
      }
    }

    // Quizzes + questions — 1 per fresh course
    const { data: existingQuizzes } = await supabaseAdmin.from("quizzes").select("course_id");
    const seenQz = new Set((existingQuizzes ?? []).map((r) => r.course_id));
    const quizRows: any[] = [];
    for (const c of cs) if (!seenQz.has(c.id)) quizRows.push({
      course_id: c.id, title: `${c.code} — Chapter 1 Quiz`,
      description: `Short assessment covering the foundational topics of ${c.title}.`,
      time_limit_min: 20, max_attempts: 2,
    });
    if (quizRows.length) {
      const { data: inserted, error } = await supabaseAdmin.from("quizzes").insert(quizRows).select("id,course_id");
      if (!error && inserted) {
        counts.quizzes = inserted.length;
        const questions: any[] = [];
        for (const q of inserted) {
          const c = csById.get(q.course_id);
          const topic = c?.title ?? "the course";
          questions.push(
            { quiz_id: q.id, type: "mcq", prompt: `Which of the following BEST describes ${topic}?`, options: ["A specialised branch of biology", "A field of computer science", "A branch of civil engineering", "None of the above"], correct: [1], points: 2, sort_order: 1 },
            { quiz_id: q.id, type: "true_false", prompt: `${topic} requires strong problem-solving and logical reasoning skills.`, options: ["True", "False"], correct: [0], points: 1, sort_order: 2 },
            { quiz_id: q.id, type: "mcq", prompt: `Which of these is a common tool used when studying ${topic}?`, options: ["Compiler / IDE", "Microscope", "Stethoscope", "Theodolite"], correct: [0], points: 2, sort_order: 3 },
          );
        }
        const { error: qerr } = await supabaseAdmin.from("quiz_questions").insert(questions);
        if (!qerr) counts.questions = questions.length;
      }
    }

    // Attendance sessions — 8 past sessions per fresh course + records for enrolled students
    const { data: existingAtt } = await supabaseAdmin.from("attendance_sessions").select("course_id");
    const seenAtt = new Set((existingAtt ?? []).map((r) => r.course_id));
    const attRows: any[] = [];
    for (const c of cs) if (!seenAtt.has(c.id) && c.lecturer_id) {
      for (let w = 8; w >= 1; w--) {
        const created = new Date(); created.setDate(created.getDate() - w * 7);
        const expires = new Date(created); expires.setMinutes(created.getMinutes() + 30);
        attRows.push({
          course_id: c.id, lecturer_id: c.lecturer_id,
          code: `${c.code.replace(/\s+/g, "")}-W${9 - w}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          created_at: created.toISOString(), expires_at: expires.toISOString(),
        });
      }
    }
    if (attRows.length) {
      const { data: inserted, error } = await supabaseAdmin.from("attendance_sessions").insert(attRows).select("id,course_id,created_at");
      if (!error && inserted) {
        counts.attendance_sessions = inserted.length;
        // Records — simulate excellent/average/poor attendance per student
        const records: any[] = [];
        const bySession = new Map<string, { courseId: string; created_at: string }>();
        inserted.forEach((s) => bySession.set(s.id, { courseId: s.course_id, created_at: s.created_at }));

        for (const s of students) {
          if (!s.level) continue;
          const enrolledCourseIds = new Set(csByLevel(s.level).map((c) => c.id));
          // Attendance rate driven by matric last-digit for realistic spread
          const digit = Number((s as any).matric_number?.slice(-1) ?? "5");
          const attendanceRate = digit <= 2 ? 0.45 : digit <= 6 ? 0.78 : 0.95;
          for (const [sid, info] of bySession) {
            if (!enrolledCourseIds.has(info.courseId)) continue;
            if (Math.random() < attendanceRate) {
              records.push({ session_id: sid, student_id: s.id, marked_at: info.created_at });
            }
          }
        }
        if (records.length) {
          // Chunk to avoid huge payloads
          for (let i = 0; i < records.length; i += 500) {
            const chunk = records.slice(i, i + 500);
            const { error: rerr } = await supabaseAdmin.from("attendance_records").insert(chunk);
            if (!rerr) counts.attendance_records += chunk.length;
          }
        }
      }
    }

    // Achievements — 3 per HND2 student, once
    const { data: existingAch } = await supabaseAdmin.from("achievements").select("student_id");
    const seenAch = new Set((existingAch ?? []).map((r) => r.student_id));
    const achRows: any[] = [];
    for (const s of students) {
      if (seenAch.has(s.id)) continue;
      achRows.push(
        { student_id: s.id, type: "streak", title: "7-Day Study Streak", description: "Logged in and completed at least one learning task on 7 consecutive days." },
        { student_id: s.id, type: "milestone", title: "First Quiz Passed", description: "Scored 70% or higher on your first CBT quiz." },
        { student_id: s.id, type: "badge", title: "Rising Star", description: "Ranked in the top 25% of your level this month." },
      );
    }
    if (achRows.length) {
      const { error } = await supabaseAdmin.from("achievements").insert(achRows);
      if (!error) counts.achievements = achRows.length;
    }

    // Certificates — for HND2 students on 2 completed courses each
    const { data: existingCert } = await supabaseAdmin.from("certificates").select("student_id,course_id");
    const seenCert = new Set((existingCert ?? []).map((r) => `${r.student_id}:${r.course_id}`));
    const certRows: any[] = [];
    const hnd2Courses = csByLevel("HND2").slice(0, 2);
    for (const s of students.filter((x) => x.level === "HND2")) {
      for (const c of hnd2Courses) {
        const key = `${s.id}:${c.id}`;
        if (seenCert.has(key)) continue;
        certRows.push({
          student_id: s.id, course_id: c.id,
          certificate_no: `CERT/${c.code.replace(/\s+/g, "")}/${s.id.slice(0, 6).toUpperCase()}`,
          issued_by: adminRow?.id ?? null,
        });
      }
    }
    if (certRows.length) {
      const { error } = await supabaseAdmin.from("certificates").insert(certRows);
      if (!error) counts.certificates = certRows.length;
    }

    return counts;
  });
