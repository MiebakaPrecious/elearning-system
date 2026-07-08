import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero1 from "@/assets/hero1.jpg.asset.json";
import hero2 from "@/assets/hero2.jpg.asset.json";
import hero3 from "@/assets/hero3.jpg.asset.json";
import hero4 from "@/assets/hero4.jpg.asset.json";
import hero5 from "@/assets/hero5.jpg.asset.json";

const SLIDES = [
  { src: hero1.url, eyebrow: "Intelligent Learning", title: "Power your studies with a smart academic core", body: "AI-assisted study planning, course-aware tutoring and real-time progress analytics built for ND and HND Computer Science." },
  { src: hero2.url, eyebrow: "Connected Campus", title: "Every course, lecturer and resource — one connected platform", body: "Unified dashboards link students, lecturers and admins across the Department of Computer Science." },
  { src: hero3.url, eyebrow: "Built for Tech Students", title: "From first lecture to graduation — engineered to scale", body: "Structured ND1 → HND2 curriculum with labs, materials, CBT exams and certificates." },
  { src: hero5.url, eyebrow: "Learn by Doing", title: "Hands-on coding, real assessments, measurable outcomes", body: "Submit assignments, run CBT quizzes and track your performance across the semester." },
  { src: hero4.url, eyebrow: "Smart Classrooms", title: "Where lecturers teach and learners thrive", body: "Attendance, announcements, video lessons and analytics — all in one digital classroom." },
];

export function HeroSlideshow() {
  const [i, setI] = useState(0);
  const n = SLIDES.length;
  const go = useCallback((d: number) => setI((p) => (p + d + n) % n), [n]);

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % n), 5000);
    return () => clearInterval(id);
  }, [n]);

  return (
    <section className="relative min-h-[600px] w-full overflow-hidden bg-slate-950 text-white md:h-[80vh] lg:h-[86vh]">
      {/* Slides (fade) */}
      {SLIDES.map((s, idx) => (
        <div
          key={s.src}
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: idx === i ? 1 : 0 }}
          aria-hidden={idx !== i}
        >
          <img src={s.src} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>
      ))}

      {/* Header strip */}
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 pt-5 md:px-8 md:pt-7">
        <div className="leading-tight">
          <p className="text-sm font-semibold md:text-base">eLearning System</p>
          <p className="text-[11px] text-white/70 md:text-xs">Department of Computer Science · 2025/2026 Session</p>
        </div>
        <Button asChild size="sm" className="bg-white text-slate-900 hover:bg-white/90">
          <Link to="/auth">Sign in <LogIn className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[calc(600px-72px)] max-w-7xl items-center px-4 pb-16 pt-10 md:h-[calc(100%-96px)] md:min-h-0 md:px-8 md:pb-0 md:pt-0">
        <div key={i} className="max-w-2xl animate-[fade-up_.8s_ease-out_both]">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> {SLIDES[i].eyebrow}
          </span>
          <h1 className="mt-5 text-balance text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            {SLIDES[i].title}
          </h1>
          <p className="mt-5 max-w-xl text-sm text-white/85 sm:text-base md:text-lg">{SLIDES[i].body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevated">
              <Link to="/register">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20">
              <Link to="/courses">Explore courses</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <button
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 grid place-items-center h-11 w-11 rounded-full bg-white/10 text-white backdrop-blur ring-1 ring-white/20 transition hover:bg-white/20 md:flex"
      ><ChevronLeft className="h-5 w-5" /></button>
      <button
        aria-label="Next slide"
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 grid place-items-center h-11 w-11 rounded-full bg-white/10 text-white backdrop-blur ring-1 ring-white/20 transition hover:bg-white/20 md:flex"
      ><ChevronRight className="h-5 w-5" /></button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-white" : "w-2.5 bg-white/40 hover:bg-white/70"}`}
          />
        ))}
      </div>
    </section>
  );
}
