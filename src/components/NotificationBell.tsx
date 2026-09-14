import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id,title,body,link,read_at,created_at")
        .order("created_at", { ascending: false })
        .limit(15);
      return (data ?? []) as Notification[];
    },
  });

  const unread = data?.filter((n) => !n.read_at).length ?? 0;

  const markAll = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button className="text-xs text-primary hover:underline" onClick={() => markAll.mutate()}>
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}
            </div>
          ) : data?.length ? (
            data.map((n) => {
              const inner = (
                <div className={`border-b border-border px-4 py-3 text-sm last:border-0 ${n.read_at ? "" : "bg-accent/40"}`}>
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              );
              return n.link ? (
                <Link key={n.id} to={n.link} className="block hover:bg-accent/60">{inner}</Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">You have no notifications yet.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
