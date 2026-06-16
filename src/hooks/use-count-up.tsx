import { useEffect, useRef, useState } from "react";

/** Animates a numeric value from 0 → target when the element enters the viewport. */
export function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !Number.isFinite(target)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  return { ref, value };
}

export function CountUp({ value, suffix = "", className }: { value: number; suffix?: string; className?: string }) {
  const { ref, value: n } = useCountUp(value);
  return <span ref={ref} className={className}>{n.toLocaleString()}{suffix}</span>;
}
