import { createFileRoute } from "@tanstack/react-router";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Kenpoly Smart Learning Hub" },
      { name: "description", content: "Get in touch with the Kenpoly Smart Learning Hub team." },
      { property: "og:title", content: "Contact — Kenpoly Smart Learning Hub" },
      { property: "og:description", content: "Get in touch with our team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <section className="gradient-brand py-14 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4">
          <h1 className="text-4xl font-bold tracking-tight">Contact us</h1>
          <p className="mt-3 max-w-2xl opacity-90">We'd love to hear from you. Reach out for support, demos, or partnership enquiries.</p>
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-5xl flex-1 gap-4 px-4 py-12 md:grid-cols-3">
        {[
          { icon: Mail, label: "Email", value: "hello@kenpoly.edu" },
          { icon: Phone, label: "Phone", value: "+234 800 000 0000" },
          { icon: MapPin, label: "Address", value: "Kenpoly Campus, Nigeria" },
        ].map((c) => (
          <Card key={c.label} className="shadow-card">
            <CardContent className="p-6">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary"><c.icon className="h-5 w-5" /></span>
              <p className="mt-3 text-sm text-muted-foreground">{c.label}</p>
              <p className="font-medium">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <PublicFooter />
    </div>
  );
}
