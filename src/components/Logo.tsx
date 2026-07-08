type Props = { className?: string; alt?: string };

/**
 * Text-mark for the eLearning System. Renders as a rounded gradient badge
 * with the initials "eL" — used in headers, footers and dashboards.
 */
export function Logo({ className = "h-9 w-9", alt = "eLearning System" }: Props) {
  return (
    <span
      role="img"
      aria-label={alt}
      className={
        className +
        " inline-grid place-items-center rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground font-bold tracking-tight shadow-elevated ring-1 ring-white/10"
      }
      style={{ fontSize: "0.85em" }}
    >
      eL
    </span>
  );
}
