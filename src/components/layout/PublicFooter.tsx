import { Link } from "@tanstack/react-router";
import { MapPin, Mail, Phone } from "lucide-react";
import { Logo } from "@/components/Logo";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Logo className="h-10 w-10" />
            <span className="font-semibold">KBSP Computer Science Hub</span>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            The official learning platform of the Department of Computer Science,
            Kenule Beeson Saro-Wiwa Polytechnic, Bori — built for ND and HND students.
          </p>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> KBSP Campus, Bori, Rivers State, Nigeria</p>
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> cs@kenpoly.edu.ng</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +234 800 000 0000</p>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Platform</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/courses" className="hover:text-foreground">Courses</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About CS Dept</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Get started</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/register" className="hover:text-foreground">New student registration</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Returning student login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Department of Computer Science · Kenule Beeson Saro-Wiwa Polytechnic, Bori.
      </div>
    </footer>
  );
}
