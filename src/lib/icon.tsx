import { ImageResponse } from "next/og";
import { BRAND, logoDataUri } from "./logo";

/** Renders the PN app icon (PWA manifest + Apple touch icon) from the shared SVG logo. */
export function renderIcon(size: number) {
  const mark = Math.round(size * 0.84);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.oven,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUri({ background: false })} width={mark} height={mark} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
