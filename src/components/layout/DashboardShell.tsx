import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, GraduationCap, LogOut, Menu, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard, BookOpen, CheckSquare, Calendar,
  Megaphone, BarChart3, FileText, ClipboardList, Award, Video,
  MessageSquare, ListChecks, Layers, Moon, Sun
} from "lucide-react";
import { useEffect } from "react";

type Item = { to: string; label: string; icon: typeof LayoutDashboard };
type Group = { label: string; items: Item[] };

const nav: Record<AppRole, Group[]> = {
  admin: [
    { label: "Overview", items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
    { label: "Academic", items: [
      { to: "/admin/sessions", label: "Sessions & Semesters", icon: Calendar },
      { to: "/admin/ranks", label: "Lecturer Ranks", icon: Award },
      { to: "/admin/courses", label: "Courses", icon: BookOpen },
    ]},
    { label: "People", items: [
      { to: "/admin/users", label: "User Approvals", icon: CheckSquare },
    ]},
    { label: "Engagement", items: [
      { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ]},
  ],
  lecturer: [
    { label: "Overview", items: [{ to: "/lecturer", label: "Dashboard", icon: LayoutDashboard }] },
    { label: "Teaching", items: [
      { to: "/lecturer/courses", label: "My Courses", icon: BookOpen },
      { to: "/lecturer/assignments", label: "Assignments", icon: ClipboardList },
      { to: "/lecturer/quizzes", label: "Quizzes", icon: ListChecks },
      { to: "/lecturer/materials", label: "Materials", icon: FileText },
      { to: "/lecturer/attendance", label: "Attendance", icon: CheckSquare },
    ]},
    { label: "Communicate", items: [
      { to: "/lecturer/announcements", label: "Announcements", icon: Megaphone },
    ]},
  ],
  student: [
    { label: "Overview", items: [{ to: "/student", label: "Dashboard", icon: LayoutDashboard }] },
    { label: "Learning", items: [
      { to: "/student/courses", label: "Browse Courses", icon: Layers },
      { to: "/student/my-courses", label: "My Courses", icon: BookOpen },
      { to: "/student/assignments", label: "Assignments", icon: ClipboardList },
      { to: "/student/quizzes", label: "Quizzes", icon: ListChecks },
      { to: "/student/materials", label: "Materials", icon: FileText },
      { to: "/student/videos", label: "Videos", icon: Video },
    ]},
    { label: "Account", items: [
      { to: "/student/attendance", label: "Attendance", icon: CheckSquare },
      { to: "/student/messages", label: "Messages", icon: MessageSquare },
    ]},
  ],
};

export function DashboardShell({ children, title }: { children: ReactNode; title?: string }) {
  const { role, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups = role ? nav[role] : [];

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 -translate-x-full bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0 ${open ? "translate-x-0" : ""}`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Kenpoly LMS</p>
            <p className="text-xs opacity-70 capitalize">{role} portal</p>
          </div>
        </div>
        <nav className="flex flex-col gap-5 overflow-y-auto p-4 pb-10">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest opacity-60">{g.label}</p>
              <div className="flex flex-col gap-0.5">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const active = pathname === it.to || (it.to !== "/admin" && it.to !== "/lecturer" && it.to !== "/student" && pathname.startsWith(it.to));
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      onClick={() => setOpen(false)}
                      className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"}`}
                    >
                      <Icon className="h-4 w-4 opacity-80" />
                      <span>{it.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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
            <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-2 py-1 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full gradient-brand text-xs font-semibold text-primary-foreground">
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
              <span className="text-sm">{profile?.full_name ?? "User"}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
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
