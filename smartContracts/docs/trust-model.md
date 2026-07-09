# Trust Model

## Assumptions

1. **Backend is the source of truth**
   - The backend validates all gameplay actions, calculations, and eligibility.
   - Frontend only submits user actions; it never triggers state changes directly.

2. **Backend signer is a single authority**
   - All XP, points, spins, activities, and rewards are granted by the backend signer.
   - The backend signer private key is held in a secure environment (HSM or vault).

3. **Contracts are settlement only**
   - Smart contracts do not decide winners, evaluate predictions, or calculate leaderboards.
   - They only record verified actions and manage funds.

4. **Users trust the backend**
   - Users do not need to verify on-chain that their gameplay was valid.
   - They only need to verify that rewards were paid correctly.

## Threat Model

| Threat | Mitigation |
|--------|------------|
| Backend key compromise | Replay protection prevents duplicate processing. Role separation limits blast radius. |
| Frontend manipulation | Frontend cannot call backend-only functions. Web3 wallet signature is not required for backend functions. |
| Replay attacks | Unique `requestId` per operation, permanently stored. |
| Reentrancy | `ReentrancyGuard` on all treasury external state-changing functions. |
| Asset loss (wrong address) | Assets must be explicitly enabled via `enableAsset()`. |
| Pauser abuse | PAUSER_ROLE is separate from reward management roles. |
| Admin key loss | Multi-sig or timelock recommended for DEFAULT_ADMIN_ROLE. |

## Off-Chain Trust

- Backend services must be monitored for anomalies.
- Rate limiting and validation should happen before contract calls.
- Contract events should be indexed and displayed to users for transparency.
