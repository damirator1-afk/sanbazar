// Brand name (as stored in Sanity, matched case/whitespace-insensitively)
// -> logo file in /public/brand-logos/. Add an entry here whenever a new
// logo is dropped in that folder; products for brands without an entry
// just show as text, no crash.
const BRAND_LOGOS: Record<string, string> = {
  "ани пласт": "/brand-logos/ani-plast.png",
  "aquant": "/brand-logos/aquant.png",
  "sanita": "/brand-logos/sanita.png",
};

export function getBrandLogo(brand: string | null | undefined): string | null {
  if (!brand) return null;
  return BRAND_LOGOS[brand.trim().toLowerCase()] ?? null;
}
