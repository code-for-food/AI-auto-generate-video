import { describe, it, expect } from "vitest";
import { loadBrand, listBrands, brandInputDefaults } from "./brand.js";

// Use the "demo" brand as the stable test fixture — "default" holds whichever
// brand identity the user has configured for their own videos and its name/
// url/logo format are expected to change over time, so don't assert on them.
const FIXTURE_BRAND = "demo";

describe("listBrands", () => {
  it("includes the shipped default and demo brands", () => {
    const brands = listBrands();
    expect(brands).toContain("default");
    expect(brands).toContain(FIXTURE_BRAND);
  });
});

describe("loadBrand", () => {
  it("loads a brand with a base64 data: logo URL", async () => {
    const brand = await loadBrand(FIXTURE_BRAND);
    expect(brand.id).toBe(FIXTURE_BRAND);
    expect(brand.name).toBe("Demo Brand");
    expect(brand.url).toBe("https://example.com/");
    expect(brand.logoUrl).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it("rejects an unknown brand id with the available brands listed", async () => {
    await expect(loadBrand("does-not-exist")).rejects.toThrow(/default/);
  });
});

describe("brandInputDefaults", () => {
  it("fills logo + identity slots for frame-logo-outro", async () => {
    const brand = await loadBrand(FIXTURE_BRAND);
    const inputs = brandInputDefaults("frame-logo-outro", brand);
    expect(inputs).toMatchObject({
      brand_name: brand.name,
      tagline: brand.tagline,
      primary_url: brand.url,
      logo_url: brand.logoUrl,
      brand_label: brand.label,
    });
  });

  it("fills logo + identity slots for frame-liquid-bg-hero", async () => {
    const brand = await loadBrand(FIXTURE_BRAND);
    const inputs = brandInputDefaults("frame-liquid-bg-hero", brand);
    expect(inputs).toMatchObject({
      kicker: brand.name,
      brand: brand.url,
      logo_url: brand.logoUrl,
      brand_label: brand.label,
    });
  });

  it("fills only the channel footer for templates with no logo slot", async () => {
    const brand = await loadBrand(FIXTURE_BRAND);
    expect(brandInputDefaults("frame-pentagram-stat", brand)).toEqual({
      footer_left: brand.name,
    });
  });

  it("returns no defaults for templates with no brand-identity slot", async () => {
    const brand = await loadBrand(FIXTURE_BRAND);
    expect(brandInputDefaults("frame-glitch-title", brand)).toEqual({});
  });
});
