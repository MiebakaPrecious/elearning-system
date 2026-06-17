import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";

const RECS = [
  { tag: "Trending", text: "Students taking CSC411 often review Database Design fundamentals.", color: "text-indigo-500" },
  { tag: "Practice", text: "You may need additional practice in SQL joins and normalization.", color: "text-emerald-500" },
  { tag: "Revise", text: "Review Networking Fundamentals before your upcoming assessment.", color: "text-amber-500" },
];

export function RecommendationsCard() {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="font-semibold">Recommended for you</p>
        </div>
        <ul className="space-y-2.5">
          {RECS.map((r) => (
            <li key={r.text} className="group flex items-start gap-3 rounded-lg border border-border p-3 transition hover-lift">
              <span className={`mt-0.5 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${r.color}`}>{r.tag}</span>
              <p className="flex-1 text-sm">{r.text}</p>
              <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function RiskBadge({ level }: { level: "low" | "moderate" | "high" }) {
  const map = {
    low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    moderate: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    high: "bg-red-500/10 text-red-600 border-red-500/30",
  } as const;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${map[level]}`}>{level} risk</span>;
}
