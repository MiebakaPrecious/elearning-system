import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Only same-origin relative paths may be used as a post-login redirect. */
function safeNext(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — eLearning System" }, { name: "description", content: "Sign in to the eLearning System." }] }),
  validateSearch: (s: Record<string, unknown>) => ({ next: safeNext(s.next) }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Resolve matric/staff id → email if needed
      let email = identifier.trim();
      if (!email.includes("@")) {
        const { data, error } = await supabase.rpc("lookup_email_by_identifier", { _identifier: email });
        if (error || !data) {
          toast.error("No account found with that ID");
          setLoading(false);
          return;
        }
        email = data as string;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message); setLoading(false); return; }

      // Check approval
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: prof } = await supabase.from("profiles").select("approval_status").eq("id", u.user.id).maybeSingle();
        if (prof?.approval_status === "pending") {
          await supabase.auth.signOut();
          toast.error("Your account is pending admin approval.");
          setLoading(false);
          return;
        }
        if (prof?.approval_status === "rejected") {
          await supabase.auth.signOut();
          toast.error("Your account has been rejected. Please contact admin.");
          setLoading(false);
          return;
        }
      }
      toast.success("Welcome back!");
      if (next) { window.location.href = next; return; }
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Sign in failed");
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden gradient-hero p-12 text-primary-foreground md:flex md:flex-col md:justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-white/15 backdrop-blur p-1"><Logo className="h-9 w-9" /></span>
          <span className="font-semibold">eLearning System</span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">Welcome back.</h2>
          <p className="mt-2 max-w-md opacity-90">Sign in with your email or matric / staff ID to continue learning and teaching.</p>
        </div>
        <p className="text-xs opacity-70">© {new Date().getFullYear()} Department of Computer Science</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-elevated">
          <CardContent className="p-8">
            <h1 className="text-2xl font-semibold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Use your email, matric number, or staff ID.</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="id">Email / Matric / Staff ID</Label>
                <Input id="id" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoFocus />
              </div>
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full gradient-brand" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
            </form>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              No account? <Link to="/register" className="font-medium text-primary">Create one</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
