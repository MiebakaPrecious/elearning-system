import { Link } from "@tanstack/react-router";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/courses", label: "Courses" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/help", label: "Help" },
  { to: "/contact", label: "Contact" },
] as const;

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-10 w-10" />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">eLearning <span className="text-primary">System</span></p>
            <p className="text-[10px] text-muted-foreground">Department of Computer Science</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-primary font-medium" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
          <Button asChild className="gradient-brand"><Link to="/register">Register</Link></Button>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-md px-3 py-2 text-sm" onClick={() => setOpen(false)}>{n.label}</Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Button variant="outline" onClick={toggle} className="flex-1">{dark ? "Light mode" : "Dark mode"}</Button>
            </div>
            <div className="mt-2 flex gap-2">
              <Button asChild variant="outline" className="flex-1"><Link to="/auth">Sign in</Link></Button>
              <Button asChild className="flex-1 gradient-brand"><Link to="/register">Register</Link></Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
