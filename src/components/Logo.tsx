import logoAsset from "@/assets/kenpoly-logo.png.asset.json";

type Props = { className?: string; alt?: string };

export function Logo({ className = "h-9 w-9", alt = "Kenule Beeson Saro-Wiwa Polytechnic logo" }: Props) {
  return <img src={logoAsset.url} alt={alt} className={className + " object-contain"} />;
}
