import crest from "@/assets/kenpoly-crest.png.asset.json";

type Props = { className?: string; alt?: string };

/**
 * Brand mark for the eLearning System — renders the Kenpoly crest image
 * used throughout headers, footers and auth screens.
 */
export function Logo({ className = "h-9 w-9", alt = "eLearning System" }: Props) {
  return (
    <img
      src={crest.url}
      alt={alt}
      className={className + " object-contain drop-shadow-sm"}
      loading="eager"
      decoding="async"
    />
  );
}
