# Brands

Each subfolder here is one brand identity the video pipeline can render with — its
name, tagline, URL, and logo. Pick one per video via `metadata.brand` in `script.json`
(or `--brand=<id>` on the CLI). Omit it and the pipeline uses `default/`.

## Layout

```
brands/
  <id>/
    brand.json
    logo.svg   (or .png — any path referenced by "logo" below)
```

## `brand.json` fields

| field     | required | meaning                                                          |
| --------- | -------- | ----------------------------------------------------------------- |
| `name`    | yes      | Brand/channel name — shown as the kicker, outro brand name, and footer wordmark/channel label across templates. |
| `tagline` | yes      | One line under the brand name on the logo outro.                 |
| `url`     | yes      | Primary URL — shown in the outro footer and hero footer chip.    |
| `label`   | yes      | Secondary line under the logo (e.g. a role/subtitle).             |
| `logo`    | yes      | Path to the logo image, relative to this brand's folder.          |

## Adding a brand

1. `mkdir brands/<id>` and add a `logo.svg` (or `.png`) there.
2. Add `brands/<id>/brand.json` with the fields above.
3. Set `"brand": "<id>"` in `script.json`'s `metadata`, or pass `--brand=<id>` to
   `npm run pipeline`.

A scene can still override any individual field (e.g. a one-off `tagline`) by setting
it directly in that scene's `inputs` — explicit scene values always win over the
brand's defaults.

An unknown brand id fails the pipeline immediately with the list of available ids —
it never silently falls back or renders with missing branding.
