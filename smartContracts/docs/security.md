# Security Considerations

## Access Control

- All state-changing functions are protected by OpenZeppelin `AccessControl`.
- Backend operations use a dedicated `BACKEND_ROLE` instead of owner-only modifiers to allow key rotation without contract migration.
- Treasury operations split into three roles (TREASURY_MANAGER, REWARD_MANAGER, PAUSER) for least-privilege separation.

## Replay Protection

- Every backend-initiated operation requires a unique `bytes32 requestId`.
- Processed request IDs are stored permanently in a mapping.
- Attempting to reuse a request ID reverts immediately.

## Reentrancy

- `RewardTreasury` inherits `ReentrancyGuard` for all external state-changing functions.
- `depositERC20`, `withdraw`, and `payout` use `nonReentrant`.
- `deposit()` (native) and `receive()` are not reentrant targets because they only update state before emitting events.

## Pausability

- `RewardTreasury` inherits `Pausable`.
- Pauser role can halt all deposits and payouts in emergencies.
- Other contracts (PointsManager, ActivityRegistry, SpinRewardManager) rely on backend authorization and are not pausable at the contract level — pausing should be handled at the API layer.

## Input Validation

- All amounts are checked for zero via `onlyNonZeroAmount` modifier.
- Addresses are validated against `address(0)`.
- Supported assets are validated before any transfer or accounting.
- ERC20 transfer safety uses OpenZeppelin `SafeERC20`.

## Asset Safety

- ERC20 assets must be explicitly enabled via `enableAsset()` before deposits or payouts.
- Disabling an asset does not block existing balances but prevents new operations.
- Native asset (CELO) is always enabled by default.

## Event Emission

- Every state mutation emits an event.
- No silent writes — critical for off-chain indexing and audit trails.

## Upgrade Strategy

- Contracts are non-upgradeable (no proxy pattern).
- Logic changes require new deployments.
- Interface compatibility is preserved where possible.
