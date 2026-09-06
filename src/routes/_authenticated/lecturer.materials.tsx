import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { FileText, FileVideo, Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/lecturer/materials")({
  component: LecturerMaterials,
});

function kindOf(type: string) {
  if (type.startsWith("video")) return "video" as const;
  if (type.startsWith("image")) return "image" as const;
  return "document" as const;
}

function LecturerMaterials() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const courses = useQuery({
    queryKey: ["lect-course-options", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("courses").select("id,code,title").eq("lecturer_id", user!.id).order("code")).data ?? [],
  });

  const materials = useQuery({
    queryKey: ["lect-materials", courseId],
    enabled: !!courseId,
    queryFn: async () => (await supabase.from("materials").select("*").eq("course_id", courseId).order("created_at", { ascending: false })).data ?? [],
  });

  const videos = useQuery({
    queryKey: ["lect-videos", courseId],
    enabled: !!courseId,
    queryFn: async () => (await supabase.from("videos").select("*").eq("course_id", courseId).order("created_at", { ascending: false })).data ?? [],
  });

  const upload = async () => {
    if (!user || !courseId || !file) return;
    setBusy(true);
    try {
      const kind = kindOf(file.type);
      const path = `${user.id}/${courseId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("course-content").upload(path, file);
      if (upErr) throw upErr;

      if (kind === "video") {
        const { error } = await supabase.from("videos").insert({
          course_id: courseId, title: title.trim() || file.name, description: description.trim() || null,
          url: path, uploaded_by: user.id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("materials").insert({
          course_id: courseId, title: title.trim() || file.name, description: description.trim() || null,
          file_url: path, file_type: file.type || kind, uploaded_by: user.id,
        });
        if (error) throw error;
      }
      toast.success("Uploaded");
      setTitle(""); setDescription(""); setFile(null);
      qc.invalidateQueries({ queryKey: ["lect-materials", courseId] });
      qc.invalidateQueries({ queryKey: ["lect-videos", courseId] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const removeMaterial = useMutation({
    mutationFn: async (p: { id: string; table: "materials" | "videos"; path: string }) => {
      await supabase.storage.from("course-content").remove([p.path]);
      const { error } = await supabase.from(p.table).delete().eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["lect-materials", courseId] });
      qc.invalidateQueries({ queryKey: ["lect-videos", courseId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const openFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("course-content").createSignedUrl(path, 3600);
    if (error || !data) return toast.error("Could not open file");
    window.open(data.signedUrl, "_blank");
  };

  return (
    <DashboardShell title="Course Materials">
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Upload material</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                <SelectContent>
                  {courses.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} — {c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Week 1 — Introduction" /></div>
            <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes for students" /></div>
            <div>
              <Label>File (PDF, image or video)</Label>
              <Input type="file" accept=".pdf,image/*,video/*,.doc,.docx,.ppt,.pptx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <p className="mt-1 text-xs text-muted-foreground">Videos are added to the course video library automatically.</p>
            </div>
            <Button className="w-full gradient-brand" disabled={!courseId || !file || busy} onClick={upload}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Upload
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Uploaded content</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!courseId && <p className="text-sm text-muted-foreground">Select a course to see its materials.</p>}
            {courseId && !materials.data?.length && !videos.data?.length && (
              <p className="text-sm text-muted-foreground">Nothing uploaded for this course yet.</p>
            )}
            {materials.data?.map((m) => {
              const Icon = (m.file_type ?? "").startsWith("image") ? ImageIcon : FileText;
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.description ?? m.file_type ?? "File"}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => m.file_url && openFile(m.file_url)}>Open</Button>
                  <Button size="sm" variant="ghost" onClick={() => removeMaterial.mutate({ id: m.id, table: "materials", path: m.file_url ?? "" })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              );
            })}
            {videos.data?.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg gradient-emerald text-white"><FileVideo className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{v.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{v.description ?? "Video lesson"}</p>
                </div>
                <Badge variant="secondary">Video</Badge>
                <Button size="sm" variant="outline" onClick={() => openFile(v.url)}>Play</Button>
                <Button size="sm" variant="ghost" onClick={() => removeMaterial.mutate({ id: v.id, table: "videos", path: v.url })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
