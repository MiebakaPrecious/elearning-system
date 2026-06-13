import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/departments")({
  head: () => ({
    meta: [
      { title: "Departments — Kenpoly Smart Learning Hub" },
      { name: "description", content: "Explore academic departments and programs at Kenpoly." },
      { property: "og:title", content: "Departments — Kenpoly Smart Learning Hub" },
      { property: "og:description", content: "Explore academic departments and programs." },
    ],
  }),
  component: Departments,
});

function Departments() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <section className="gradient-brand py-14 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4">
          <h1 className="text-4xl font-bold tracking-tight">Academic Departments</h1>
          <p className="mt-3 max-w-2xl opacity-90">Each department offers ND and HND programs across two semesters per session.</p>
        </div>
      </section>
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        {isLoading ? (
          <p className="text-muted-foreground">Loading departments…</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.map((d) => (
              <Card key={d.id} className="shadow-card transition hover:shadow-elevated">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-lg gradient-brand text-primary-foreground"><Building2 className="h-5 w-5" /></span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{d.name}</p>
                        <Badge variant="secondary">{d.code}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{d.description ?? "—"}</p>
                      <p className="mt-3 text-xs font-medium text-primary">ND1 · ND2 · HND1 · HND2</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
      <PublicFooter />
    </div>
  );
}
