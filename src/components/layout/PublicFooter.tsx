import { Link } from "@tanstack/react-router";
import { MapPin, Mail, Phone, Github, Twitter, Linkedin, Facebook, Send } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-12">
        {/* Brand */}
        <div className="md:col-span-4">
          <div className="flex items-center gap-2">
            <Logo className="h-10 w-10" />
            <div className="leading-tight">
              <p className="font-semibold tracking-tight">eLearning <span className="text-primary">System</span></p>
              <p className="text-xs text-muted-foreground">Department of Computer Science</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            The official learning platform of the Department of Computer Science —
            built for ND and HND students, lecturers and administrators.
          </p>
          <div className="mt-5 flex gap-2">
            {[Github, Twitter, Linkedin, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div className="md:col-span-2">
          <p className="mb-3 text-sm font-semibold">Platform</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/courses" className="hover:text-foreground">Courses</Link></li>
            <li><Link to="/roadmap" className="hover:text-foreground">Roadmap</Link></li>
            <li><Link to="/portfolio" className="hover:text-foreground">Case study</Link></li>
            <li><Link to="/help" className="hover:text-foreground">Help &amp; docs</Link></li>
          </ul>
        </div>

        {/* Account */}
        <div className="md:col-span-2">
          <p className="mb-3 text-sm font-semibold">Account</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/register" className="hover:text-foreground">Register</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
            <li><Link to="/demo-accounts" className="hover:text-foreground">Demo accounts</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
          </ul>
        </div>

        {/* Contact + Newsletter */}
        <div className="md:col-span-4">
          <p className="mb-3 text-sm font-semibold">Stay in the loop</p>
          <p className="text-sm text-muted-foreground">Get departmental updates, exam schedules, and new courses.</p>
          <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input type="email" placeholder="your@email.com" aria-label="Email address" />
            <Button type="submit" className="gradient-brand" aria-label="Subscribe"><Send className="h-4 w-4" /></Button>
          </form>
          <div className="mt-5 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Department of Computer Science, Bori, Rivers State</p>
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> support@elearning.demo</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +234 800 000 0000</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} eLearning System · Department of Computer Science. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
