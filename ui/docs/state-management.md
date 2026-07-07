# State Management — Vibepool 2.0

## Design
- Zustand only. No Redux, no Context mega-stores.
- One store per bounded domain.
- Stores are thin slices: `state`, `actions`, and `selectors` only.

## Stores

### usePredictionStore
- State: `currentRound`, `isSubmitting`
- Actions: `setCurrentRound`, `setIsSubmitting`, `reset`

### useSpinStore
- State: `availableSpins`, `lastSpinAt`, `isSpinning`
- Actions: `setSpinState`, `setIsSpinning`, `reset`

### useMissionStore
- State: `missions`
- Actions: `setMissions`, `reset`

### useLeaderboardStore
- State: `entries`, `period`
- Actions: `setEntries`, `setPeriod`, `reset`

### useProfileStore
- State: `profile`
- Actions: `setProfile`, `reset`

### useRewardStore
- State: `summary`
- Actions: `setSummary`, `reset`

### useWalletStore
- State: `isAuthenticating`, `lastAuthAt`
- Actions: `setIsAuthenticating`, `setLastAuthAt`, `reset`

### useUIStore
- State: `isNavOpen`, `toastMessage`
- Actions: `setNavOpen`, `showToast`, `clearToast`

## Integration Pattern
- Server-fetched data lands in stores via API responses.
- Contract reads update stores inside React components or through the Vibepool context.
- Components subscribe to stores via selectors to avoid unnecessary re-renders.
