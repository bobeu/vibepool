# Authentication Flow

1. Frontend requests a signed message from the wallet.
2. User signs the message with their private key.
3. Frontend sends the signature to the backend.
4. Backend verifies the signature using Viem.
5. Backend issues a secure session.
6. Subsequent requests include the session token.

## Wallet Address Alone Is Never Trusted

All protected endpoints verify the session or require a fresh signed message.
