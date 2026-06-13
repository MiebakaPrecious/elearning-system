import { createFileRoute } from "@tanstack/react-router";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Kenpoly Smart Learning Hub" },
      { name: "description", content: "Learn about Kenpoly Smart Learning Hub's mission to modernize polytechnic education." },
      { property: "og:title", content: "About Kenpoly Smart Learning Hub" },
      { property: "og:description", content: "Modernizing polytechnic education through technology." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <section className="gradient-brand py-16 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">About Kenpoly Smart Learning</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">A purpose-built LMS for polytechnic institutions — bringing structure, engagement and analytics to ND and HND programs.</p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Target, title: "Our Mission", body: "Empower polytechnic students and lecturers with a modern, mobile-friendly platform that mirrors real academic workflows." },
            { icon: Eye, title: "Our Vision", body: "Become the standard digital backbone of polytechnic institutions across the region." },
            { icon: Heart, title: "Our Values", body: "Quality, accessibility, transparency and student-first design in every feature we ship." },
          ].map((c) => (
            <Card key={c.title} className="shadow-card">
              <CardContent className="p-6">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary"><c.icon className="h-5 w-5" /></span>
                <p className="mt-3 font-semibold">{c.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="prose prose-slate mt-12 max-w-none">
          <h2>Built for polytechnic academics</h2>
          <p className="text-muted-foreground">
            Kenpoly Smart Learning Hub was designed from the ground up to match the realities of polytechnic education — distinct ND and HND levels, departmental structure, lecturer ranks, semester-based scheduling, and an approval-driven course lifecycle. Every screen exists for a reason: to reduce admin overhead, improve learning outcomes, and give every role the data they need to succeed.
          </p>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
