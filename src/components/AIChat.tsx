import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2, Bot, User as UserIcon, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain Object-Oriented Programming with a Java example",
  "Difference between SQL and NoSQL databases",
  "Summarize the OSI networking model",
  "Generate 5 multiple-choice questions on Data Structures",
];

export function AIChat({
  courseContext,
  system,
  initialMessage,
  height = "h-[calc(100vh-220px)]",
  placeholder = "Ask anything about your courses, assignments, or any CS topic…",
}: {
  courseContext?: string;
  system?: string;
  initialMessage?: string;
  height?: string;
  placeholder?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>(
    initialMessage ? [{ role: "assistant", content: initialMessage }] : [],
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { taRef.current?.focus(); }, []);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    setError(null);
    const next = [...messages, { role: "user" as const, content: t }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next, system, courseContext }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setMessages([...next, { role: "assistant", content: json.content ?? "" }]);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => taRef.current?.focus());
    }
  };

  return (
    <Card className="overflow-hidden shadow-card">
      <CardContent className="p-0">
        <div className={`flex flex-col ${height}`}>
          <div ref={scroller} className="flex-1 space-y-5 overflow-y-auto p-5 md:p-6">
            {messages.length === 0 && (
              <div className="grid place-items-center gap-4 py-10 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-brand text-primary-foreground shadow-lg">
                  <Sparkles className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-lg font-semibold">eLearning AI Assistant</p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Course-aware tutor for the CS department. Ask questions, summarize materials, generate quizzes & flashcards.</p>
                </div>
                {courseContext && <Badge variant="secondary" className="gap-1"><Wand2 className="h-3 w-3" /> Context: {courseContext}</Badge>}
                <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="rounded-xl border border-border bg-card p-3 text-left text-sm transition hover-lift hover:border-primary/40">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} content={m.content} />
            ))}
            {loading && <Bubble role="assistant" content="" loading />}
            {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          </div>
          <div className="border-t border-border bg-background/80 p-3 backdrop-blur md:p-4">
            <div className="flex items-end gap-2">
              <Textarea
                ref={taRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder={placeholder}
                rows={1}
                className="min-h-[44px] resize-none"
                disabled={loading}
              />
              <Button onClick={() => send(input)} disabled={loading || !input.trim()} className="gradient-brand h-[44px] px-4">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 px-1 text-[11px] text-muted-foreground">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Bubble({ role, content, loading }: { role: "user" | "assistant"; content: string; loading?: boolean }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg gradient-brand text-primary-foreground"><Bot className="h-4 w-4" /></div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isUser ? "bg-primary text-primary-foreground" : "bg-muted/60"}`}>
        {loading ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:240ms]" />
          </span>
        ) : (
          <div className="whitespace-pre-wrap">{content}</div>
        )}
      </div>
      {isUser && (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-foreground"><UserIcon className="h-4 w-4" /></div>
      )}
    </div>
  );
}
