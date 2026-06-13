import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-semibold">Kenpoly Smart Learning</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">A modern Learning Management System for polytechnic institutions.</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Platform</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/departments">Departments</Link></li>
            <li><Link to="/courses">Courses</Link></li>
            <li><Link to="/lecturers">Lecturers</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Company</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Get started</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/register">Create account</Link></li>
            <li><Link to="/auth">Sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Kenpoly Smart Learning Hub. All rights reserved.
      </div>
    </footer>
  );
}
