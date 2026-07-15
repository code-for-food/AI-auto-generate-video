import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

/**
 * Brand identity (name/tagline/URL/logo) is kept out of the templates and the
 * script.json content — it lives here so one `metadata.brand` id swaps logo +
 * wording across every scene that has a brand-identity slot.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Repo-root/brands — one folder per brand identity. */
const BRANDS_DIR = join(__dirname, "..", "..", "brands");

const BrandConfigSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  url: z.string().min(1),
  label: z.string().min(1),
  /** Path to the logo image, relative to the brand's own folder. */
  logo: z.string().min(1),
});

export interface Brand {
  id: string;
  name: string;
  tagline: string;
  url: string;
  label: string;
  /**
   * data: URI (base64) for the logo — inlined, not a file:// path. HyperFrames
   * renders each template from its OWN directory under templates/<id>/, and
   * Chromium blocks file:// reads that reach outside that directory ("Not
   * allowed to load local resource"), so a cross-directory brands/ logo path
   * would silently fail to render. A data URI sidesteps that entirely.
   */
  logoUrl: string;
}

const LOGO_MIME_BY_EXT: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/** Brand ids available under brands/ (folders containing a brand.json). */
export function listBrands(): string[] {
  if (!existsSync(BRANDS_DIR)) return [];
  return readdirSync(BRANDS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(BRANDS_DIR, e.name, "brand.json")))
    .map((e) => e.name)
    .sort();
}

/** Load a brand by id from brands/<id>/brand.json. Throws if missing/invalid. */
export async function loadBrand(id: string): Promise<Brand> {
  const dir = join(BRANDS_DIR, id);
  const configPath = join(dir, "brand.json");
  if (!existsSync(configPath)) {
    const available = listBrands();
    throw new Error(
      `Brand "${id}" not found (expected ${configPath}). Available brands: ${
        available.length ? available.join(", ") : "(none)"
      }`,
    );
  }

  const raw = JSON.parse(await readFile(configPath, "utf8"));
  const cfg = BrandConfigSchema.parse(raw);

  const logoPath = resolve(dir, cfg.logo);
  if (!existsSync(logoPath)) {
    throw new Error(`Brand "${id}" logo not found: ${logoPath}`);
  }
  const mime = LOGO_MIME_BY_EXT[extname(logoPath).toLowerCase()];
  if (!mime) {
    throw new Error(
      `Brand "${id}" logo has an unsupported extension: ${logoPath} (expected one of ${Object.keys(LOGO_MIME_BY_EXT).join(", ")})`,
    );
  }
  const logoBytes = await readFile(logoPath);

  return {
    id,
    name: cfg.name,
    tagline: cfg.tagline,
    url: cfg.url,
    label: cfg.label,
    logoUrl: `data:${mime};base64,${logoBytes.toString("base64")}`,
  };
}

/**
 * Brand-derived default `inputs` for a template, keyed by the exact slot
 * semantics documented in templates/CATALOG.md. Spread these BEFORE a scene's
 * own `inputs` so an explicit per-scene value always wins.
 */
export function brandInputDefaults(templateId: string, brand: Brand): Record<string, unknown> {
  switch (templateId) {
    case "frame-liquid-bg-hero":
      return {
        kicker: brand.name,
        brand: brand.url,
        logo_url: brand.logoUrl,
        brand_label: brand.label,
      };
    case "frame-logo-outro":
      return {
        brand_name: brand.name,
        tagline: brand.tagline,
        primary_url: brand.url,
        logo_url: brand.logoUrl,
        brand_label: brand.label,
      };
    case "frame-statement-outro":
      return {
        channel: brand.name,
        source: `Nguồn: ${brand.url}`,
      };
    case "frame-vignelli":
      return { brand: brand.name };
    case "frame-pentagram-stat":
    case "frame-bold-poster":
      return { footer_left: brand.name };
    default:
      return {};
  }
}
