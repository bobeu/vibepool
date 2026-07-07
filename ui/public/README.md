Copy branding assets from `vibecheck/vibepay/public`:

- `logo.png`, `logodark.png`
- `backgrounddark.png`, `backgroundlight.png`
- `vibepool-coins-upward.png`, `vibepool-predict.png`, `vibepool-world.png`

Or run from repo root:

```powershell
Copy-Item "vibecheck/vibepay/public/logo.png","vibecheck/vibepay/public/logodark.png","vibecheck/vibepay/public/backgrounddark.png","vibecheck/vibepay/public/backgroundlight.png","vibecheck/vibepay/public/vibepool-*.png" -Destination "vibepool/public/"
```
