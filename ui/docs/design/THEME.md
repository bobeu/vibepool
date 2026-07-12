# NEXORA Theme — Neo-Brutalist (skillerdesign)

**Updated:** Prompt 19 (2026-07-12)

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Primary (Cyan) | `hsl(187 100% 68%)` | Buttons, active nav, accents |
| Secondary (Yellow) | `hsl(48 100% 58%)` | Badges, level icons, highlights |
| Accent (Pink) | `hsl(330 100% 71%)` | Rewards tile, speech-bubble accents |
| Background | `hsl(0 0% 98%)` | Page background (light) |
| Foreground | `#000` | Text, borders |
| Border | `#000` 3px solid | All cards, inputs, buttons |

## Components

- `.brutal-card` — white card + black shadow offset
- `.brutal-btn-primary` — cyan CTA
- `.brutal-btn-secondary` — yellow CTA
- `.brutal-input` — form fields
- `.brutal-heading` — uppercase italic black headings

## Layout

- **Mobile (< md):** `mobile_view` layout — Grand Arena hero, progress, 3 action tiles, 5-item bottom nav
- **Tablet/Desktop (≥ md):** `vibecheck_design` layout inside `TabletFrame` — volatility predict UI, 4-item nav

## Files

- `styles/globals.css` — CSS variables + component classes
- `tailwind.config.js` — extended colors
- `config/navigation.ts` — mobile vs tablet nav items
- `components/layout/TabletFrame.tsx` — tablet chrome + background placeholder
