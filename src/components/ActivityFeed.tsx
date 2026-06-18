import { type LucideIcon, UserPlus, BookOpenCheck, FileCheck, CheckCircle2, Megaphone, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Activity = { icon: LucideIcon; tone: string; title: string; meta: string; time: string };

export function ActivityFeed({ items, title = "Recent activity" }: { items?: Activity[]; title?: string }) {
  const data = items ?? DEFAULT_ACTIVITY;
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold">{title}</p>
          <span className="text-xs text-muted-foreground">Last 24 hours</span>
        </div>
        <ul className="space-y-3">
          {data.map((a, i) => {
            const Icon = a.icon;
            return (
              <li key={i} className="flex items-start gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${a.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.meta}</p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{a.time}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

const DEFAULT_ACTIVITY: Activity[] = [
  { icon: UserPlus, tone: "bg-indigo-500/10 text-indigo-600", title: "New student registered", meta: "Chioma Okafor · ND1", time: "2m" },
  { icon: BookOpenCheck, tone: "bg-emerald-500/10 text-emerald-600", title: "Course approved", meta: "CSC411 — Database Design", time: "18m" },
  { icon: FileCheck, tone: "bg-blue-500/10 text-blue-600", title: "Assignment submitted", meta: "12 submissions · CSC312", time: "42m" },
  { icon: CheckCircle2, tone: "bg-cyan-500/10 text-cyan-600", title: "Attendance marked", meta: "HND1 · 38 / 41 present", time: "1h" },
  { icon: Megaphone, tone: "bg-amber-500/10 text-amber-600", title: "Announcement posted", meta: "Mid-semester schedule update", time: "3h" },
  { icon: ClipboardList, tone: "bg-fuchsia-500/10 text-fuchsia-600", title: "Quiz published", meta: "Networking · ND2", time: "5h" },
];
