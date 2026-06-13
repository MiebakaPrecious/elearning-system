import { createFileRoute } from "@tanstack/react-router";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/lecturers")({
  head: () => ({
    meta: [
      { title: "Lecturers — Kenpoly Smart Learning Hub" },
      { name: "description", content: "Meet our lecturers and academic ranks." },
      { property: "og:title", content: "Lecturers — Kenpoly Smart Learning Hub" },
      { property: "og:description", content: "Polytechnic lecturer ranks and structure." },
    ],
  }),
  component: Lecturers,
});

function Lecturers() {
  const { data } = useQuery({
    queryKey: ["public-ranks"],
    queryFn: async () => {
      const { data } = await supabase.from("lecturer_ranks").select("*").order("sort_order");
      return data ?? [];
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <section className="gradient-brand py-14 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4">
          <h1 className="text-4xl font-bold tracking-tight">Our Lecturers</h1>
          <p className="mt-3 max-w-2xl opacity-90">Kenpoly LMS supports the full polytechnic academic rank structure, from Assistant Lecturer to Chief Lecturer.</p>
        </div>
      </section>
      <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <h2 className="mb-6 text-xl font-semibold">Academic Ranks</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((r) => (
            <Card key={r.id} className="shadow-card">
              <CardContent className="flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-lg gradient-brand text-primary-foreground"><Award className="h-4 w-4" /></span>
                <p className="font-medium">{r.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
