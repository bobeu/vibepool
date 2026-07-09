# Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Viem
    participant Database

    User->>Frontend: Request to connect wallet
    Frontend->>User: Display wallet options
    User->>Frontend: Select wallet (MiniPay/Rainbow)
    Frontend->>Frontend: Generate auth message
    Frontend->>User: Prompt signature
    User->>Frontend: Sign message with private key
    
    Frontend->>API: POST /api/auth/login
    Note right of API: { wallet, signature, message, timestamp }
    API->>Viem: verifyMessage(wallet, signature, message)
    Viem-->>API: Valid signature
    
    API->>Database: Create session
    Database-->>API: Session created
    API-->>Frontend: { accessToken, refreshToken, expiresIn }
    
    Frontend->>Frontend: Store refresh token securely
    Frontend->>API: GET /api/profile (with Bearer token)
    API->>API: Verify session token
    API->>Database: Get user profile
    Database-->>API: Profile
    API-->>Frontend: Profile data
    
    Note over Frontend,API: Access token expires

    Frontend->>API: POST /api/auth/refresh
    API->>Database: Validate refresh token
    Database-->>API: Valid
    API->>Database: Rotate tokens
    Database-->>API: New tokens
    API-->>Frontend: { accessToken, refreshToken }
    
    Frontend->>API: POST /api/auth/logout
    API->>Database: Revoke session
    Database-->>API: Revoked
    API-->>Frontend: Logged out
```

## Rules

- Authorization header: `Bearer <accessToken>`
- Access token TTL: 15 minutes
- Refresh token TTL: 30 days
- Refresh token rotation on every use
- Session revoked on logout
- Wallet headers are no longer trusted
