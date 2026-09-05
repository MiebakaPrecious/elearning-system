import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Loader2, Save, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { toast } from "sonner";

const LEVELS = ["ND1", "ND2", "HND1", "HND2"] as const;

export function ProfileSetup({ role }: { role: AppRole }) {
  const { user, profile, refresh } = useAuth();
  const [form, setForm] = useState({
    full_name: "", phone: "", matric_number: "", staff_id: "", level: "", rank_id: "",
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ranks, setRanks] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      matric_number: profile.matric_number ?? "",
      staff_id: profile.staff_id ?? "",
      level: profile.level ?? "",
      rank_id: profile.rank_id ?? "",
    });
  }, [profile]);

  useEffect(() => {
    if (role !== "lecturer") return;
    supabase.from("lecturer_ranks").select("id,name").order("sort_order").then(({ data }) => setRanks(data ?? []));
  }, [role]);

  // Resolve the stored avatar path into a temporary viewable link.
  useEffect(() => {
    const path = profile?.photo_url;
    if (!path) { setPhoto(null); return; }
    if (path.startsWith("http")) { setPhoto(path); return; }
    supabase.storage.from("avatars").createSignedUrl(path, 3600).then(({ data }) => setPhoto(data?.signedUrl ?? null));
  }, [profile?.photo_url]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string | null> = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        matric_number: role === "student" ? form.matric_number.trim() || null : null,
        staff_id: role === "student" ? null : form.staff_id.trim() || null,
        level: role === "student" ? form.level || null : null,
        rank_id: role === "lecturer" ? form.rank_id || null : null,
      };
      const { error } = await supabase.from("profiles").update(payload as never).eq("id", user!.id);
      if (error) throw error;
      await refresh();
    },
    onSuccess: () => toast.success("Profile saved"),
    onError: (e) => toast.error((e as Error).message),
  });

  const onPhoto = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { error: upErr } = await supabase.from("profiles").update({ photo_url: path }).eq("id", user.id);
      if (upErr) throw upErr;
      await refresh();
      toast.success("Photo updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const initials = (form.full_name || profile?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="shadow-card lg:col-span-1">
        <CardHeader><CardTitle className="text-base">Profile photo</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-8">
          <div className="relative">
            {photo ? (
              <img src={photo} alt={form.full_name || "Profile photo"} className="h-28 w-28 rounded-full object-cover ring-2 ring-border" />
            ) : (
              <span className="grid h-28 w-28 place-items-center rounded-full gradient-brand text-3xl font-semibold text-primary-foreground">{initials}</span>
            )}
            <label className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-border bg-card shadow-sm transition hover:bg-accent">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); }}
              />
            </label>
          </div>
          <div className="text-center">
            <p className="font-semibold">{form.full_name || "Unnamed user"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="capitalize">{role}</Badge>
            <Badge variant={profile?.approval_status === "approved" ? "default" : "outline"} className="capitalize">
              <ShieldCheck className="mr-1 h-3 w-3" />{profile?.approval_status ?? "pending"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card lg:col-span-2">
        <CardHeader><CardTitle className="text-base">Personal details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Full name</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={profile?.email ?? ""} disabled />
          </div>
          <div>
            <Label>Phone number</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="080…" />
          </div>

          {role === "student" && (
            <>
              <div>
                <Label>Matriculation number</Label>
                <Input value={form.matric_number} onChange={(e) => setForm({ ...form, matric_number: e.target.value })} placeholder="e.g. CS/ND/24/001" />
              </div>
              <div>
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          )}

          {role !== "student" && (
            <div>
              <Label>Staff ID</Label>
              <Input value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })} placeholder="e.g. KP/CS/112" />
            </div>
          )}

          {role === "lecturer" && (
            <div>
              <Label>Academic rank</Label>
              <Select value={form.rank_id} onValueChange={(v) => setForm({ ...form, rank_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select rank" /></SelectTrigger>
                <SelectContent>{ranks.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end">
            <Button className="gradient-brand" onClick={() => save.mutate()} disabled={save.isPending || !form.full_name.trim()}>
              {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
