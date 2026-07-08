import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, XCircle, Info } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { seedDemoAccounts, seedAcademicData } from "@/lib/api/seed-demo.functions";

export const Route = createFileRoute("/_authenticated/admin/seed")({
  component: SeedPage,
});

type Result = Awaited<ReturnType<typeof seedDemoAccounts>>;

function SeedPage() {
  const seed = useServerFn(seedDemoAccounts);
  const seedData = useServerFn(seedAcademicData);
  const router = useRouter();
  const [password, setPassword] = useState("Demo1234!");
  const [busy, setBusy] = useState(false);
  const [dataBusy, setDataBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [dataResult, setDataResult] = useState<Awaited<ReturnType<typeof seedAcademicData>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await seed({ data: { password } });
      setResult(res);
      router.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const runData = async () => {
    setDataBusy(true);
    setError(null);
    setDataResult(null);
    try {
      const res = await seedData();
      setDataResult(res);
      router.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDataBusy(false);
    }
  };

  return (
    <DashboardShell title="Seed demo accounts">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-elevated">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-semibold">Provision demo logins</p>
                <p className="text-sm text-muted-foreground">Creates 1 admin, 3 lecturers, 12 students. Idempotent.</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor="pw">Shared password</Label>
              <Input id="pw" value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className="text-xs text-muted-foreground">All demo accounts will share this password.</p>
            </div>

            <Button onClick={run} disabled={busy || password.length < 8} className="mt-5 w-full gradient-brand">
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Seeding…</> : "Seed demo accounts"}
            </Button>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <XCircle className="mt-0.5 h-4 w-4" /> {error}
              </div>
            )}

            <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <p className="mb-2 flex items-center gap-2 font-medium"><Info className="h-4 w-4 text-primary" />Sample logins</p>
              <ul className="space-y-1 font-mono text-xs text-muted-foreground">
                <li>admin@kenpoly.demo</li>
                <li>lecturer1@kenpoly.demo</li>
                <li>student.nd1.1@kenpoly.demo</li>
                <li>student.hnd2.3@kenpoly.demo</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <p className="font-semibold">Results</p>
            {!result ? (
              <p className="mt-2 text-sm text-muted-foreground">Run seeding to see per-account results here.</p>
            ) : (
              <>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">Total {result.total}</Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">
                    Created {result.results.filter((r) => r.status === "created").length}
                  </Badge>
                  <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/10">
                    Existed {result.results.filter((r) => r.status === "exists").length}
                  </Badge>
                  <Badge variant="destructive">
                    Errors {result.results.filter((r) => r.status === "error").length}
                  </Badge>
                </div>
                <ul className="mt-4 max-h-[420px] space-y-1 overflow-auto text-sm">
                  {result.results.map((r) => (
                    <li key={r.email} className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2">
                      <span className="truncate font-mono text-xs">{r.email}</span>
                      <span className="shrink-0">
                        {r.status === "created" && <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />created</span>}
                        {r.status === "exists" && <span className="text-xs text-amber-600">already exists</span>}
                        {r.status === "error" && <span className="text-xs text-destructive" title={r.message}>error</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
