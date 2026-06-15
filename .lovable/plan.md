# Phase 2 — Database, RBAC & Academic Workflow

This phase is large. I'll deliver it in **one migration + one seed batch + one code pass**, but breaking the work into clear chunks below so you can confirm scope before I start.

## 1. Branding — Kenpoly Logo

- Save the uploaded `kenpoly-logo.png` as a CDN asset (`src/assets/kenpoly-logo.png.asset.json`) and import it into:
  - `PublicHeader`, `PublicFooter`
  - `/auth` and `/register` pages
  - `DashboardShell` sidebar (student, lecturer, admin)
- Replace the current placeholder GraduationCap icon mark next to the wordmark.

## 2. Database — what already exists vs. what's new

Already present (keep, no change): `academic_sessions`, `semesters`, `lecturer_ranks`, `courses`, `enrollments`, `materials`, `assignments`, `submissions`, `quizzes`, `quiz_questions`, `quiz_attempts`, `attendance_sessions`, `attendance_records`, `announcements`, `profiles`, `user_roles`.

Mapping notes (no rename — keep current names to avoid breaking 40+ files):
- `users` → existing `profiles` + `user_roles` (already implemented per security best practices).
- `levels` → existing `level_type` enum (ND1/ND2/HND1/HND2) — staying as an enum, no table needed.
- `learning_materials` → existing `materials` table.
- `assignment_submissions` → existing `submissions` table.
- `attendance` → existing `attendance_sessions` + `attendance_records`.

New tables this migration adds:
- `videos` (course_id, title, description, url, duration_sec, uploaded_by)
- `discussions` (course_id, author_id, title, body) + `discussion_replies`
- `messages` (sender_id, recipient_id, body, read_at)
- `certificates` (student_id, course_id, issued_at, certificate_no)
- `achievements` (student_id, type, title, earned_at)
- `events` (title, description, starts_at, ends_at, location, audience)
- `activity_logs` (actor_id, action, entity_type, entity_id, metadata)

Each new table gets: GRANTs, RLS enabled, role-scoped policies using `has_role()`, and `updated_at` triggers where relevant.

## 3. RBAC hardening

- Add a `<RoleGuard role="admin|lecturer|student">` wrapper and apply it to each `_authenticated/*` route via `beforeLoad` so a student cannot hit `/admin/*` or `/lecturer/*` by URL.
- Tighten RLS:
  - Students: SELECT only `courses` where `status='approved'` AND `level = profiles.level`; SELECT `materials/videos/assignments/quizzes` only for courses they're enrolled in.
  - Lecturers: full CRUD on their assigned courses' children (materials, videos, assignments, quizzes, attendance, announcements).
  - Admins: full access via `has_role(auth.uid(),'admin')`.

## 4. Seed data (CS Department)

Insert via the data tool (not migration):
- 4 sample lecturers (with ranks) + assign to existing seeded courses.
- 12 sample students (3 per level) — these are profile rows only; real auth users aren't created (would need server-side admin API; can do in a follow-up if you want loggable demo accounts).
- 8 sample assignments spread across ND1/ND2 courses.
- 6 announcements, 4 upcoming events.
- A handful of materials, videos, attendance sessions, submissions to make dashboards look alive.

## 5. Dashboard widgets fed by real data

Rewrite the three dashboard index pages to query the new/seeded tables:
- **Student**: enrolled-course progress, attendance %, pending assignments, recent quiz scores.
- **Lecturer**: assigned courses, submission rate, attendance rate, recent activity.
- **Admin**: student distribution by level (chart), course approval queue, active-user count, recent activity log.

Uses `recharts` (already installed via shadcn) for the bar/donut charts.

## Out of scope this turn (flag for later)

- Real auth accounts for demo students (needs `supabaseAdmin.auth.admin.createUser` server fn — can add next).
- Full UI for messages / discussions / certificate PDF generation — tables and stubs only.
- Mobile polish pass.

## Technical notes

- Schema changes go through one `supabase--migration` call; data goes through `supabase--insert`.
- Logo asset uploaded once via `lovable-assets create` from `/mnt/user-uploads/kenpoly-logo.png`.
- No renames of existing tables → zero churn in current code.

Approve to proceed, or tell me what to drop/add.
