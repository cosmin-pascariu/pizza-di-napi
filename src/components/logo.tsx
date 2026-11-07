import { logoSvg } from "@/lib/logo";

const svg = logoSvg();

export function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 [&>svg]:h-full [&>svg]:w-full"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
