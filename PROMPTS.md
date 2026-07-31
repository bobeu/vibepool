Shipped and live on [https://vibepool-orpin.vercel.app/spin](https://vibepool-orpin.vercel.app/spin) (`78741ae`).

**Bubbles**
- Layer now sits above the wheel (`z-50`), so taps hit bubbles instead of background UI.
- Emit origin is the top of the Spin button; they fan outward from there.
- Burst still reveals the amount in a floating label (optimistic `…`, then real value).

**Sound**
- Burst SFX uses **Web Audio API** (no heavy library) — short liquid pop on each burst. Works well in MiniPay after a user gesture (Spin click unlocks audio).

**Music collections**
- Seeded 5 self-hosted loops under `/audio/spin/` (Pulse Soft, Arena Glow, Gold Rush Beat, Night Circuit, Spin Fever) and wired the music shop to them.
- These are placeholder synth loops for testing. For production tracks, good sources:
  - [Pixabay Music](https://pixabay.com/music/) — free commercial use
  - [Mixkit](https://mixkit.co/free-stock-music/) — free, download then host yourself (their CDN blocked hotlinking)
  - [Uppbeat](https://uppbeat.io/) / [Epidemic Sound](https://www.epidemicsound.com/) — licensed libraries
  - Drop MP3/WAV files into `ui/public/audio/spin/` and point track URLs there via admin / `MusicEngine` seed

