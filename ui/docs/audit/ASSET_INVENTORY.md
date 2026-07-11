# Asset Inventory — Prompt 15

**Manifest:** `ui/assets/index.ts`  
**Public assets:** `ui/public/` (legacy PNGs removed from working tree)

## Catalog (Defined in Manifest)

| Category | Count | Format | Path Pattern |
|----------|-------|--------|--------------|
| Heroes | 10 | WebP | `/assets/heroes/*.webp` |
| Backgrounds | 4 | WebP | `/assets/backgrounds/*.webp` |
| Icons | 5 | SVG | `/assets/icons/*.svg` |
| Illustrations | 3 | WebP | `/assets/illustrations/*.webp` |
| Avatars/Frames | 3 | WebP | `/assets/avatars/`, `/assets/frames/` |
| Effects | 3 | WebP | `/assets/effects/*.webp` |
| Logos | 3 | SVG | `/assets/logos/*.svg` |
| Badges | 6 | SVG | `/assets/badges/*.svg` |
| Titles | 6 | SVG | `/assets/titles/*.svg` |
| Cards | 4 | WebP | `/assets/cards/*.webp` |

## Status

| Issue | Details |
|-------|---------|
| Missing files | Asset directories referenced in manifest may not exist on disk — verify before launch |
| Placeholder assets | `comingSoon` hero defined |
| Duplicate assets | Legacy `ui/public/*.png` deleted locally (not in Prompt 15 commit scope) |
| Oversized assets | `nexora_logo.png` was 675KB — migrated to SVG logo in manifest |

## Recommendations

1. Run asset existence check script pre-deploy
2. Serve all heroes as WebP with `<Image>` priority on home
3. Inline critical SVG icons
4. Add `assets/badges/` and `assets/illustrations/` to repo or CDN
5. Do not delete manifest entries — mark missing as PLACEHOLDER in CMS

## Admin Assets

Admin app uses minimal assets (CSS only, recharts in pages).

## Contract Assets

`ui/lib/contracts/addresses.json`, `abis.json` — 7 entries each, required for wagmi reads.
