import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyError } from "@/lib/errors";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — eLearning System" },
      { name: "description", content: "Choose a new password for your eLearning System account." },
      { property: "og:title", content: "Reset password — eLearning System" },
      { property: "og:description", content: "Choose a new password for your eLearning System account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("The two passwords do not match.");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast.error(friendlyError(error));
    toast.success("Password updated. Please sign in.");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-md shadow-elevated">
        <CardContent className="p-8">
          <Logo className="h-10 w-10" />
          <h1 className="mt-4 text-2xl font-semibold">Choose a new password</h1>
          {ready ? (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="pw">New password</Label>
                <Input id="pw" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pw2">Confirm password</Label>
                <Input id="pw2" type="password" minLength={6} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <Button type="submit" className="w-full gradient-brand" disabled={saving}>
                {saving ? "Saving…" : "Update password"}
              </Button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Open this page from the reset link in your email, then choose your new password.{" "}
              <Link to="/auth" className="font-medium text-primary">Back to sign in</Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
