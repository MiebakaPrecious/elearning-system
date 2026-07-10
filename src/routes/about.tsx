import { createFileRoute } from "@tanstack/react-router";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — eLearning System" },
      { name: "description", content: "About the Department of Computer Science and the eLearning System platform." },
      { property: "og:title", content: "About the eLearning System" },
      { property: "og:description", content: "Modernizing Computer Science education with an AI-powered LMS." },
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
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">About the CS Department</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">
            The Department of Computer Science — training the next generation of software engineers, analysts and technologists for Nigeria and beyond.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Target, title: "Our Mission", body: "Deliver practical, industry-aligned computer science education through digitally-enabled teaching, fair assessment, and supportive mentorship." },
            { icon: Eye, title: "Our Vision", body: "To be the leading polytechnic Computer Science department in the Niger Delta, recognized for graduates who can build, ship, and lead." },
            { icon: Heart, title: "Our Values", body: "Integrity in assessment, accessibility for every learner, modern tools, and a student-first culture in every interaction." },
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
        <div className="prose prose-slate mt-12 max-w-none dark:prose-invert">
          <h2>Programs we run</h2>
          <p className="text-muted-foreground">
            The department offers both the National Diploma (ND) and Higher National Diploma (HND) in Computer Science, structured across four academic levels — ND1, ND2, HND1 and HND2 — with two semesters per level. The curriculum balances foundational theory (data structures, algorithms, databases, computer architecture) with applied skills (web development, networking, software engineering, project work).
          </p>
          <h2>Why this platform</h2>
          <p className="text-muted-foreground">
            The eLearning System centralizes everything a CS student or lecturer touches in a session — course materials, video lessons, assignments, computer-based tests, attendance and result analytics — into a single, secure, mobile-ready platform. Every account is admin-approved against the departmental record.
          </p>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
