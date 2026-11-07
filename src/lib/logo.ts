/**
 * Pizza di Napi "PN" mark: a round pizzeria stamp with a dotted crust ring,
 * a hand-drawn PN monogram and a basil leaf. Pure SVG (no font needed), so the
 * same artwork is used in the header and for the generated PWA icons.
 */
export const BRAND = {
  name: "Pizza di Napi",
  short: "PN",
  oven: "#1F4D35",
  crust: "#E9B44C",
  dough: "#FFF8EC",
  basil: "#7CC79A",
  tomato: "#C8321E",
};

export function logoSvg({ background = true }: { background?: boolean } = {}) {
  const { oven, crust, dough, basil } = BRAND;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  ${background ? `<circle cx="32" cy="32" r="32" fill="${oven}"/>` : ""}
  <circle cx="32" cy="32" r="27" fill="none" stroke="${crust}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="0.01 4.2312"/>
  <g fill="none" stroke="${dough}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16.5 44V19.5h7a6.75 6.75 0 0 1 0 13.5h-7"/>
    <path d="M37 44V19.5l10 24.5V19.5"/>
  </g>
  <path d="M26.5 51.5c2.6-3.6 7.9-4.6 11-2.2c-2.8 3.3-7.8 4.4-11 2.2z" fill="${basil}"/>
  <path d="M27.5 51.2c3-.9 6-1.4 9.2-1.6" stroke="${oven}" stroke-width=".7" stroke-linecap="round" fill="none"/>
</svg>`;
}

export const logoDataUri = (opts?: { background?: boolean }) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(logoSvg(opts))}`;
