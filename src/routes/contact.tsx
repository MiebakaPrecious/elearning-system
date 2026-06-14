import { createFileRoute } from "@tanstack/react-router";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — KBSP CS Hub" },
      { name: "description", content: "Contact the Department of Computer Science, KBSP Bori." },
      { property: "og:title", content: "Contact — KBSP CS Hub" },
      { property: "og:description", content: "Reach the CS Department at KBSP Bori." },
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
          <h1 className="text-4xl font-bold tracking-tight">Contact the department</h1>
          <p className="mt-3 max-w-2xl opacity-90">Reach the CS Department office for admissions, course enquiries, and technical support.</p>
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-5xl flex-1 gap-4 px-4 py-12 md:grid-cols-3">
        {[
          { icon: Mail, label: "Email", value: "cs@kenpoly.edu.ng" },
          { icon: Phone, label: "Phone", value: "+234 800 000 0000" },
          { icon: MapPin, label: "Address", value: "KBSP Campus, Bori, Rivers State" },
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
      <section className="mx-auto w-full max-w-5xl px-4 pb-16">
        <Card className="shadow-card overflow-hidden">
          <div className="aspect-[16/8] w-full">
            <iframe
              title="KBSP Bori Map"
              src="https://www.google.com/maps?q=Kenule+Beeson+Saro-Wiwa+Polytechnic+Bori&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Card>
      </section>
      <PublicFooter />
    </div>
  );
}
