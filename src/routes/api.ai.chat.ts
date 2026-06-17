import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "system" | "user" | "assistant"; content: string };

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: { "content-type": "application/json" } });

        let body: { messages: Msg[]; system?: string; model?: string; courseContext?: string };
        try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

        const sys = body.system ?? `You are the eLearning AI Assistant for the Computer Science Department. Be concise, accurate, and educational. Use markdown for code blocks and lists. When helpful, give worked examples. If a course context is provided, tailor answers to that course.${body.courseContext ? `\n\nActive course context: ${body.courseContext}` : ""}`;

        const messages: Msg[] = [{ role: "system", content: sys }, ...(body.messages ?? [])];

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "lovable-cloud",
          },
          body: JSON.stringify({ model: body.model ?? "google/gemini-3-flash-preview", messages }),
        });

        if (!res.ok) {
          const text = await res.text();
          const status = res.status === 429 ? 429 : res.status === 402 ? 402 : 500;
          const msg = status === 429 ? "Rate limit reached. Please try again shortly." : status === 402 ? "AI credits exhausted. Ask an admin to top up the workspace." : "AI gateway error";
          return new Response(JSON.stringify({ error: msg, detail: text.slice(0, 400) }), { status, headers: { "content-type": "application/json" } });
        }
        const data = await res.json() as { choices?: { message?: { content?: string } }[] };
        const content = data.choices?.[0]?.message?.content ?? "";
        return new Response(JSON.stringify({ content }), { headers: { "content-type": "application/json" } });
      },
    },
  },
});
