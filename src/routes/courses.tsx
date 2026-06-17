import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses — eLearning System" },
      { name: "description", content: "Browse all Computer Science courses across ND1, ND2, HND1 and HND2." },
      { property: "og:title", content: "Computer Science Courses — KBSP Bori" },
      { property: "og:description", content: "ND and HND Computer Science courses at KBSP Bori." },
    ],
  }),
  component: CoursesCatalog,
});

const LEVELS = ["ND1", "ND2", "HND1", "HND2"] as const;

function CoursesCatalog() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,code,title,description,level")
        .eq("status", "approved")
        .order("level")
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <section className="gradient-brand py-14 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4">
          <h1 className="text-4xl font-bold tracking-tight">CS Course Catalog</h1>
          <p className="mt-3 max-w-2xl opacity-90">Approved Computer Science courses, grouped by level. Sign in as a student to enroll in courses for your level.</p>
        </div>
      </section>
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        {isLoading ? (
          <p className="text-muted-foreground">Loading courses…</p>
        ) : data && data.length > 0 ? (
          <div className="space-y-10">
            {LEVELS.map((level) => {
              const levelCourses = data.filter((c) => c.level === level);
              if (levelCourses.length === 0) return null;
              return (
                <div key={level}>
                  <div className="mb-4 flex items-baseline gap-3">
                    <h2 className="text-2xl font-bold">{level}</h2>
                    <span className="text-sm text-muted-foreground">{levelCourses.length} course{levelCourses.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {levelCourses.map((c) => (
                      <Card key={c.id} className="shadow-card transition hover:shadow-elevated">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3">
                            <span className="grid h-11 w-11 place-items-center rounded-lg gradient-emerald text-primary-foreground"><BookOpen className="h-5 w-5" /></span>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">{c.code}</Badge>
                                <Badge variant="secondary">{c.level}</Badge>
                              </div>
                              <p className="mt-2 font-semibold">{c.title}</p>
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description ?? "No description"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="shadow-card">
            <CardContent className="p-10 text-center">
              <p className="text-muted-foreground">No approved courses yet. Check back soon!</p>
              <Button asChild className="mt-4 gradient-brand"><Link to="/register">Join as a lecturer</Link></Button>
            </CardContent>
          </Card>
        )}
      </section>
      <PublicFooter />
    </div>
  );
}
