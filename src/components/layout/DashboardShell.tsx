import { Link, useRouterState, Navigate } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, Menu, Search, User } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard, BookOpen, CheckSquare, Calendar,
  Megaphone, BarChart3, FileText, ClipboardList, Award, Video,
  MessageSquare, ListChecks, Layers, Moon, Sun, Sparkles, CalendarClock
} from "lucide-react";
import { useEffect } from "react";

type Item = { to: string; label: string; icon: typeof LayoutDashboard };
type Group = { label: string; icon: typeof LayoutDashboard; items: Item[] };

const nav: Record<AppRole, Group[]> = {
  admin: [
    { label: "Overview", icon: LayoutDashboard, items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ]},
    { label: "Academic", icon: Calendar, items: [
      { to: "/admin/sessions", label: "Sessions & Semesters", icon: Calendar },
      { to: "/calendar", label: "Academic Calendar", icon: CalendarClock },
      { to: "/admin/courses", label: "Courses & Approvals", icon: BookOpen },
      { to: "/admin/ranks", label: "Lecturer Ranks", icon: Award },
    ]},
    { label: "People", icon: CheckSquare, items: [
      { to: "/admin/users", label: "User Approvals", icon: CheckSquare },
      { to: "/admin/seed", label: "Seed Demo Logins", icon: Layers },
    ]},
    { label: "Engagement", icon: Megaphone, items: [
      { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
    ]},
    { label: "Account", icon: User, items: [
      { to: "/admin/profile", label: "Profile Setup", icon: User },
    ]},
  ],
  lecturer: [
    { label: "Overview", icon: LayoutDashboard, items: [
      { to: "/lecturer", label: "Dashboard", icon: LayoutDashboard },
    ]},
    { label: "Teaching", icon: BookOpen, items: [
      { to: "/lecturer/courses", label: "My Courses", icon: BookOpen },
      { to: "/lecturer/materials", label: "Course Materials", icon: FileText },
      { to: "/lecturer/assignments", label: "Assignments", icon: ClipboardList },
      { to: "/lecturer/quizzes", label: "Quizzes", icon: ListChecks },
      { to: "/lecturer/attendance", label: "Attendance", icon: CheckSquare },
    ]},
    { label: "Communicate", icon: Megaphone, items: [
      { to: "/lecturer/announcements", label: "Announcements", icon: Megaphone },
    ]},
    { label: "Account", icon: User, items: [
      { to: "/lecturer/profile", label: "Profile Setup", icon: User },
      { to: "/calendar", label: "Academic Calendar", icon: CalendarClock },
    ]},
  ],
  student: [
    { label: "Overview", icon: LayoutDashboard, items: [
      { to: "/student", label: "Dashboard", icon: LayoutDashboard },
    ]},
    { label: "Learning", icon: BookOpen, items: [
      { to: "/student/courses", label: "Browse & Register", icon: Layers },
      { to: "/student/my-courses", label: "My Courses", icon: BookOpen },
      { to: "/student/materials", label: "Course Materials", icon: FileText },
      { to: "/student/videos", label: "Video Lessons", icon: Video },
      { to: "/student/assignments", label: "Assignments", icon: ClipboardList },
      { to: "/student/quizzes", label: "Quizzes", icon: ListChecks },
    ]},
    { label: "AI & Planning", icon: Sparkles, items: [
      { to: "/student/assistant", label: "AI Assistant", icon: Sparkles },
      { to: "/student/planner", label: "Study Planner", icon: CalendarClock },
      { to: "/calendar", label: "Academic Calendar", icon: Calendar },
    ]},
    { label: "Account", icon: User, items: [
      { to: "/student/profile", label: "Profile Setup", icon: User },
      { to: "/student/attendance", label: "Attendance", icon: CheckSquare },
      { to: "/student/messages", label: "Messages", icon: MessageSquare },
    ]},
  ],
};

export function DashboardShell({ children, title }: { children: ReactNode; title?: string }) {
  const { role, profile, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups = role ? nav[role] : [];

  const isActive = (to: string) =>
    pathname === to || (to !== "/admin" && to !== "/lecturer" && to !== "/student" && pathname.startsWith(to + "/"));

  // Which accordion groups are expanded — the group holding the active page starts open.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const groupOpen = (g: Group) => {
    const manual = collapsed[g.label];
    if (manual !== undefined) return manual;
    return g.items.some((i) => isActive(i.to)) || g.label === "Overview";
  };

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // Role-based route protection: redirect if URL prefix doesn't match user's role
  if (!loading && role) {
    const expectedPrefix = pathname.startsWith("/admin") ? "admin"
      : pathname.startsWith("/lecturer") ? "lecturer"
      : pathname.startsWith("/student") ? "student" : null;
    if (expectedPrefix && expectedPrefix !== role) {
      return <Navigate to="/dashboard" />;
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 -translate-x-full bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0 ${open ? "translate-x-0" : ""}`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <Logo className="h-10 w-10" />
          <div className="leading-tight">
            <p className="text-sm font-semibold">eLearning System</p>
            <p className="text-xs opacity-70 capitalize">{role} portal</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 overflow-y-auto p-3 pb-10">
          {groups.map((g) => {
            const expanded = groupOpen(g);
            const GroupIcon = g.icon;
            return (
              <div key={g.label} className="rounded-lg">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setCollapsed((c) => ({ ...c, [g.label]: !expanded }))}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[11px] font-semibold uppercase tracking-widest opacity-70 transition hover:bg-sidebar-accent/50 hover:opacity-100"
                >
                  <GroupIcon className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">{g.label}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "" : "-rotate-90"}`} />
                </button>
                <div
                  className={`grid transition-all duration-200 ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <div className="ml-4 flex flex-col gap-0.5 border-l border-sidebar-border pl-2 pt-1">
                      {g.items.map((it) => {
                        const Icon = it.icon;
                        const active = isActive(it.to);
                        return (
                          <Link
                            key={it.to}
                            to={it.to}
                            onClick={() => setOpen(false)}
                            className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"}`}
                          >
                            <Icon className="h-4 w-4 opacity-80" />
                            <span>{it.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}><Menu /></Button>
          <div className="relative hidden flex-1 max-w-md md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search courses, students, materials…" className="pl-9" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</Button>
            <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
            <Link
              to={role === "admin" ? "/admin/profile" : role === "lecturer" ? "/lecturer/profile" : "/student/profile"}
              className="hidden items-center gap-2 rounded-full border border-border bg-card px-2 py-1 transition hover:bg-accent sm:flex"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full gradient-brand text-xs font-semibold text-primary-foreground">
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
              <span className="text-sm">{profile?.full_name ?? "User"}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out"><LogOut className="h-5 w-5" /></Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {title && <h1 className="mb-5 text-2xl font-semibold tracking-tight">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
}
