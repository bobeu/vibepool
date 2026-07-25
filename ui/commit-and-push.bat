@echo off
cd /d "C:\Users\HP\Desktop\proofOfShip\vibepool\ui"
git add -A
git commit -m "feat(ui): complete Neo-brutalist overhaul - mobile-first simulated phone frame

BREAKING: Remove landscape tablet sidebar layout. Replace with centered
Simulated Mobile Device Frame Container (matching vibepay design pattern).

Changes:
- Onboarding.tsx: 3-slide Neo-brutalist onboarding
  * Slide 1: Yellow bg, 'UH OH!' cyan sticker badge, prediction image
  * Slide 2: Cyan bg, 'SO CLASSY!' pink sticker badge, arena image
  * Slide 3: White bg, Celo wallet connect, custom social icon buttons
- AppShell.tsx: Full rewrite - centred phone frame on desktop
  * iOS notch + live status bar (Signal/Wifi/Battery icons)
  * Dark backgrounddark.png texture + grid overlay inside frame
  * Neo-brutalist header with logo, bell, WalletConnect
  * Floating bottom dock with glow on active items
  * No sidebar - clean scrollable content area
- TabletFrame.tsx: Simplified to no-op wrappers (backwards compat)
- HomeHub.tsx: Premium hero banner with level progress, quick-link row,
  4-tile action grid (thick borders+shadows), image feature banners
- PredictHub.tsx: Image hero card, pool stats, mode toggle, cyan AI card,
  brutalist Higher/Lower predict buttons
- leaderboard/page.tsx: Updated branding Nexora -> Vibepool, brutalist tabs
- spin/page.tsx: Removed spinLayout prop, brutalist spin + reward modal
- globals.css: Removed tablet landscape CSS, added phone frame helpers
"
git push
echo Done! Push complete.
pause
