# API Routes

All routes return structured JSON.

- GET /api/profile — Get user profile
- POST /api/profile — Upsert user profile
- GET /api/tournaments — List active tournaments
- POST /api/tournaments — Get tournament by ID
- GET /api/predictions — Get current prediction round
- POST /api/predictions — Submit prediction
- GET /api/missions — Get daily missions
- POST /api/missions — Complete mission
- GET /api/spins — Get available spins
- POST /api/spins — Execute spin
- GET /api/rewards — Get claimable rewards
- POST /api/rewards — Claim points
- GET /api/leaderboard — Get daily leaderboard
- GET /api/activity — Get recent activity
- POST /api/activity — Record activity
- GET /api/settings — Get all settings
- POST /api/settings — Update setting
- GET /api/notifications — Get unread notifications
- POST /api/notifications — Mark notification as read

All protected routes require x-wallet-address header.
