import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register — eLearning System" }, { name: "description", content: "Register as a Computer Science student or lecturer on the eLearning System." }] }),
  component: RegisterPage,
});

const LEVELS = ["ND1", "ND2", "HND1", "HND2"] as const;

function RegisterPage() {
  const [role, setRole] = useState<"student" | "lecturer">("student");
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden gradient-hero p-12 text-primary-foreground md:flex md:flex-col md:justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-white/15 backdrop-blur p-1"><Logo className="h-9 w-9" /></span>
          <span className="font-semibold">eLearning System</span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">Welcome to the Department of Computer Science.</h2>
          <p className="mt-2 max-w-md opacity-90">Register as a student or lecturer. The first account becomes the admin — afterwards, accounts await admin approval.</p>
        </div>
        <p className="text-xs opacity-70">© {new Date().getFullYear()} eLearning System · Department of Computer Science</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-lg shadow-elevated">
          <CardContent className="p-8">
            <h1 className="text-2xl font-semibold">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">For Computer Science students and lecturers only.</p>
            <Tabs value={role} onValueChange={(v) => setRole(v as "student" | "lecturer")} className="mt-5">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="lecturer">Lecturer</TabsTrigger>
              </TabsList>
              <TabsContent value="student"><RegisterForm role="student" /></TabsContent>
              <TabsContent value="lecturer"><RegisterForm role="lecturer" /></TabsContent>
            </Tabs>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Have an account? <Link to="/auth" className="font-medium text-primary">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RegisterForm({ role }: { role: "student" | "lecturer" }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "",
    matric_number: "", staff_id: "",
    level: "" as "" | typeof LEVELS[number], rank_id: "",
  });
  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: ranks } = useQuery({
    queryKey: ["ranks"],
    queryFn: async () => (await supabase.from("lecturer_ranks").select("id,name").order("sort_order")).data ?? [],
    enabled: role === "lecturer",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const meta: Record<string, string> = {
      role,
      full_name: form.full_name,
      phone: form.phone,
    };
    if (role === "student") {
      meta.matric_number = form.matric_number;
      meta.level = form.level;
    } else {
      meta.staff_id = form.staff_id;
      meta.rank_id = form.rank_id;
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: meta,
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! An admin will review and approve your account.");
    navigate({ to: "/auth" });
  };

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Full name</Label><Input required value={form.full_name} onChange={(e) => upd("full_name", e.target.value)} /></div>
        <div><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => upd("email", e.target.value)} /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => upd("phone", e.target.value)} /></div>
        {role === "student" ? (
          <>
            <div><Label>Matric Number</Label><Input required value={form.matric_number} onChange={(e) => upd("matric_number", e.target.value)} placeholder="e.g. CS/ND/22/0123" /></div>
            <div>
              <Label>Level</Label>
              <Select value={form.level} onValueChange={(v) => upd("level", v)}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <div><Label>Staff ID</Label><Input required value={form.staff_id} onChange={(e) => upd("staff_id", e.target.value)} /></div>
            <div>
              <Label>Rank</Label>
              <Select value={form.rank_id} onValueChange={(v) => upd("rank_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select rank" /></SelectTrigger>
                <SelectContent>{ranks?.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </>
        )}
        <div className="col-span-2"><Label>Password</Label><Input type="password" required minLength={6} value={form.password} onChange={(e) => upd("password", e.target.value)} /></div>
      </div>
      <Button type="submit" className="w-full gradient-brand" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
    </form>
  );
}
