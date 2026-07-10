import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Course Roadmap — eLearning System" },
      { name: "description", content: "Full Computer Science curriculum roadmap from ND1 to HND2, organised by semester." },
      { property: "og:title", content: "CS Course Roadmap — eLearning System" },
      { property: "og:description", content: "Visual roadmap of every Computer Science course across ND1 → HND2." },
    ],
  }),
  component: RoadmapPage,
});

const LEVELS = [
  { key: "ND1", label: "ND 1", subtitle: "Year 1 · National Diploma", tone: "from-indigo-500 to-blue-500" },
  { key: "ND2", label: "ND 2", subtitle: "Year 2 · National Diploma", tone: "from-blue-500 to-cyan-500" },
  { key: "HND1", label: "HND 1", subtitle: "Year 3 · Higher National Diploma", tone: "from-emerald-500 to-teal-500" },
  { key: "HND2", label: "HND 2", subtitle: "Year 4 · Higher National Diploma", tone: "from-amber-500 to-orange-500" },
] as const;

type CourseRow = { id: string; code: string; title: string; description: string | null; level: string; semester_no: number | null };

function RoadmapPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["roadmap-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,code,title,description,level,semester_no")
        .eq("status", "approved")
        .order("code");
      if (error) throw error;
      return data as CourseRow[];
    },
  });

  const grouped = (level: string, sem: 1 | 2) =>
    (data ?? []).filter((c) => c.level === level && (c.semester_no ?? 1) === sem);

  const total = data?.length ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <section className="gradient-brand py-16 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Sparkles className="h-4 w-4" /> Curriculum Roadmap
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Your CS journey, end to end</h1>
          <p className="mt-3 max-w-2xl text-base opacity-90 md:text-lg">
            Every course you will take at the Department of Computer Science — organised by level and semester. {total} courses across 4 levels.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-12">
        {isLoading ? (
          <p className="text-muted-foreground">Loading roadmap…</p>
        ) : (
          <div className="space-y-10">
            {LEVELS.map((lvl, idx) => (
              <div key={lvl.key} className="relative">
                {idx < LEVELS.length - 1 && (
                  <div className="absolute left-6 top-16 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-border via-border to-transparent md:block" aria-hidden />
                )}
                <div className="mb-5 flex items-center gap-4">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${lvl.tone} text-white shadow-elevated`}>
                    <GraduationCap className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold tracking-tight">{lvl.label}</h2>
                    <p className="text-sm text-muted-foreground">{lvl.subtitle}</p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 md:pl-16">
                  {[1, 2].map((sem) => {
                    const list = grouped(lvl.key, sem as 1 | 2);
                    return (
                      <Card key={sem} className="shadow-card">
                        <CardContent className="p-5">
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                              {sem === 1 ? "First Semester" : "Second Semester"}
                            </h3>
                            <Badge variant="secondary">{list.length} {list.length === 1 ? "course" : "courses"}</Badge>
                          </div>
                          {list.length === 0 ? (
                            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">No courses yet</p>
                          ) : (
                            <ul className="space-y-2">
                              {list.map((c) => (
                                <li key={c.id} className="group flex items-start gap-3 rounded-lg border border-border/60 p-3 transition hover:border-primary/40 hover:bg-secondary/40">
                                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                                    <BookOpen className="h-4 w-4" />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant="outline" className="font-mono text-[10px]">{c.code}</Badge>
                                      <p className="truncate text-sm font-semibold">{c.title}</p>
                                    </div>
                                    {c.description && (
                                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <PublicFooter />
    </div>
  );
}
