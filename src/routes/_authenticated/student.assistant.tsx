import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AIChat } from "@/components/AIChat";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, FileText, ListChecks, Layers, BookMarked } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/assistant")({
  component: AssistantPage,
});

const TOOLS = [
  { icon: FileText, title: "Summarize material", prompt: "Summarize the following notes into Short Summary, Detailed Summary and Key Takeaways:\n\n" },
  { icon: ListChecks, title: "Generate quiz", prompt: "Generate 10 multiple-choice questions (with answers) on this topic:\n\n" },
  { icon: Layers, title: "Flashcards", prompt: "Create 10 flashcards (Q on front, A on back) for this topic:\n\n" },
  { icon: BookMarked, title: "Revision notes", prompt: "Produce concise exam revision notes for this topic, with headings, key formulas and 3 practice questions:\n\n" },
];

function AssistantPage() {
  return (
    <DashboardShell title="AI Learning Assistant">
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <AIChat />
        <div className="space-y-4">
          <Card className="shadow-card">
            <CardContent className="p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Quick tools</p>
              <ul className="space-y-2 text-sm">
                {TOOLS.map((t) => (
                  <li key={t.title} className="flex items-start gap-2 rounded-lg border border-border p-3">
                    <t.icon className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">Paste content into the chat, then start the message with "{t.title}".</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-5 text-xs text-muted-foreground">
              <p className="mb-2 text-sm font-semibold text-foreground">Tip</p>
              The assistant is course-aware. When opened from a specific course page, answers are tailored to that course.
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
