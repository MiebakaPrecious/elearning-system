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
      { title: "Courses — Kenpoly Smart Learning Hub" },
      { name: "description", content: "Browse approved courses across all departments and levels." },
      { property: "og:title", content: "Courses — Kenpoly Smart Learning Hub" },
      { property: "og:description", content: "Browse approved courses across departments." },
    ],
  }),
  component: CoursesCatalog,
});

function CoursesCatalog() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,code,title,description,level,department_id,departments(name,code)")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <section className="gradient-brand py-14 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4">
          <h1 className="text-4xl font-bold tracking-tight">Course Catalog</h1>
          <p className="mt-3 max-w-2xl opacity-90">Approved courses available for enrollment. Sign in as a student to enroll in courses for your department and level.</p>
        </div>
      </section>
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        {isLoading ? (
          <p className="text-muted-foreground">Loading courses…</p>
        ) : data && data.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((c: any) => (
              <Card key={c.id} className="shadow-card transition hover:shadow-elevated">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-lg gradient-emerald text-primary-foreground"><BookOpen className="h-5 w-5" /></span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{c.code}</Badge>
                        <Badge variant="secondary">{c.level}</Badge>
                        {c.departments?.code && <Badge>{c.departments.code}</Badge>}
                      </div>
                      <p className="mt-2 font-semibold">{c.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description ?? "No description"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
