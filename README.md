# eLearning System

> Production-ready, AI-powered Learning Management System for the Department of Computer Science (ND1 → HND2).

Built with **TanStack Start v1**, **React 19**, **Supabase** and the **Lovable AI Gateway**, and deployed on **Cloudflare Workers**.

[Live demo](https://elearning-system.lovable.app) · [Demo accounts](https://elearning-system.lovable.app/demo-accounts) · [Case study](https://elearning-system.lovable.app/portfolio)

---

## ✨ Features

- **Role-based dashboards** — dedicated experiences for Admins, Lecturers and Students.
- **Full CS curriculum** — courses, materials, videos, announcements and discussions for ND1 → HND2.
- **CBT quizzes** — timed, auto-marked assessments with instant scoring.
- **Assignments** — file uploads, deadlines, grading and feedback.
- **Attendance** — QR-code sessions with semester-long analytics.
- **AI Learning Assistant** — course-aware, streaming chat tutor (Lovable AI Gateway).
- **Smart study planner** — personalised weekly plan built from deadlines and attendance.
- **Analytics** — enrolment trends, engagement heatmaps and performance charts (Recharts).
- **Security** — Postgres Row-Level Security, security-definer role checks and server-verified permissions.
- **Polish** — dark mode by default, responsive down to mobile, accessible components (shadcn/Radix).

## 📸 Screenshots

> Replace these placeholders with real screenshots after your first deploy.

| Landing | Student dashboard |
| --- | --- |
| _screenshot_ | _screenshot_ |

| AI Assistant | Admin analytics |
| --- | --- |
| _screenshot_ | _screenshot_ |

## 🧱 Tech stack

| Layer | Choice |
| --- | --- |
| Framework | TanStack Start v1 (SSR on Cloudflare Workers) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Radix UI |
| Data | TanStack Query, Supabase Postgres |
| Auth | Supabase Auth with RLS |
| Charts | Recharts |
| AI | Lovable AI Gateway (streaming SSE) |
| Tooling | Vite 7, Bun, TypeScript strict |

## 🚀 Getting started

```bash
# 1. Install dependencies
bun install

# 2. Copy environment variables
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY and (server-only) SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / LOVABLE_API_KEY

# 3. Run the dev server
bun run dev

# 4. Apply database migrations
bun run supabase db push
```

Open [http://localhost:8080](http://localhost:8080).

## 🧪 Demo accounts

Visit `/demo-accounts` in the running app, or use these directly:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@kenpoly.demo` | `Demo1234!` |
| Lecturer | `lecturer1@kenpoly.demo` | `Demo1234!` |
| Student | `student.nd1.1@kenpoly.demo` | `Demo1234!` |

> These are seeded from the Admin → Seed dashboard. Do not store real data.

## 🏗️ Architecture

```
Browser
  │  useSuspenseQuery / useServerFn
  ▼
TanStack Start (Cloudflare Worker)
  │  createServerFn + requireSupabaseAuth
  ▼
Supabase Postgres (RLS)
  │
  └──► Lovable AI Gateway (streaming) ──► Student assistant / planner
```

- `src/routes/**` — file-based routes (public + `_authenticated/` gated).
- `src/lib/api/*.functions.ts` — typed server RPCs via `createServerFn`.
- `src/routes/api/**` — raw HTTP endpoints (webhooks, streaming AI).
- `src/integrations/supabase/**` — auto-generated client, admin client and auth middleware.
- `supabase/migrations/**` — schema, RLS policies and grants.

## 🔐 Security

- Every table in `public` ships with an explicit `GRANT` block and RLS policies.
- Roles live in a dedicated `user_roles` table and are checked via a `SECURITY DEFINER` `has_role()` function to avoid recursive RLS.
- Admin-only server functions authorise via `requireSupabaseAuth` + `has_role`.

## 🚢 Deployment

The project auto-deploys to Lovable hosting (`*.lovable.app`) on every push. To self-host on Cloudflare Workers:

```bash
bun run build
bun run deploy
```

Ensure the following env vars are set in the Worker: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`.

## 🗺️ Project structure

```
src/
├─ assets/            # Static images + Lovable asset pointers
├─ components/        # Reusable UI (Logo, HeroSlideshow, StatCard, AIChat, ...)
├─ components/ui/     # shadcn primitives
├─ hooks/             # use-count-up, use-mobile, ...
├─ integrations/      # Supabase clients + auth middleware
├─ lib/api/           # createServerFn modules
├─ routes/            # File-based TanStack routes
│  └─ _authenticated/ # Role-gated pages (admin.*, lecturer.*, student.*)
└─ styles.css         # Tailwind v4 tokens + theme
supabase/migrations/  # SQL schema, RLS, seed
```

## 📄 License

Educational / portfolio project. Adapt freely for your own department.

---

Built with ♥ using [Lovable](https://lovable.dev).
