# Implementation Plan — Complete UI/UX Overhaul

Perform a complete redesign of the Vibepool (Nexora) UI/UX, aligning it with the mobile-first skillerdesign/nexora brutalist theme. The overhaul will implement a horizontal landscape tablet layout on desktop, an interactive comic-style onboarding flow, redesigned bottom/sidebar navigation, an interactive spin wheel, a podium-based leaderboard, and a MiniPay-aware wallet connection experience.

---

## User Review Required

> [!IMPORTANT]
> **No Command Execution Rule**: Per your instructions, I will NOT run any build, compile, or terminal commands during this task. Next.js's hot-reloading dev server (currently running in the background) will compile and apply changes in real-time.
>
> **No Library Installation**: I will not run any dependency installs. All necessary libraries (framer-motion, lucide-react, wagmi, rainbowkit, etc.) are already installed in the workspace.

---

## Proposed Changes

### 1. Navigation & Shell Layout Configuration

#### [MODIFY] [navigation.ts](file:///c:/Users/HP/Desktop/proofOfShip/vibepool/ui/config/navigation.ts)
- Align navigation options across breakpoints.
- Define a single set of core keys (home, predict, arena, spin, leaderboard, missions, profile).
- Set distinct items for mobile bottom nav (5 items max: Home, Predict, Spin, Leaderboard, Profile) and tablet sidebar nav (7 items: Home, Predict, Arena, Spin, Leaderboard, Missions, Profile).

#### [MODIFY] [AppShell.tsx](file:///c:/Users/HP/Desktop/proofOfShip/vibepool/ui/components/layout/AppShell.tsx)
- Re-architect `AppShell` to handle the responsive layout split:
  - **Desktop/Tablet Web Screen**: Render the Nexora landing page background (using `/backgroundlight.png` or `/backgrounddark.png` based on active theme) and show a split desktop layout. The left side displays the marketing copy/buttons from `landing_page_web.png`, and the right side holds the landscape `TabletFrame`. The tablet's screen will hold a sidebar layout (sidebar on the left, main content + header column on the right).
  - **Mobile Screen**: Full-screen view with a top header and a floating bottom navigation bar.
- Reposition bottom navigation on mobile as a floating dark bar (`bg-zinc-950 rounded-2xl border-[3px] border-black shadow-[4px_4px_0_#000] bottom-4 left-4 right-4 fixed z-40 px-2 py-1.5`). Use proper bold filled icons and remove individual border containers around the icons per the CTO's request.
- Render the `Onboarding` flow if the user has not completed onboarding. Onboarding status is persisted in `localStorage`.
- Integrate a global Toast component to display `toastMessage` from `useUIStore`.

#### [MODIFY] [TabletFrame.tsx](file:///c:/Users/HP/Desktop/proofOfShip/vibepool/ui/components/layout/TabletFrame.tsx)
- Modify the simulated device bezel from vertical to horizontal landscape (`w-[820px] h-[540px]`).
- Style it like a premium landscape tablet with a front camera dot on the left bezel, smooth speaker ports, and an iOS-style home bar indicator at the bottom.

---

### 2. Wallet & Connection Logic

#### [NEW] [useWallet.ts](file:///c:/Users/HP/Desktop/proofOfShip/vibepool/ui/hooks/useWallet.ts)
- Port the Celo/MiniPay wallet connection pattern from `vibecheck/vibepay/src/hooks/useWallet.ts`.
- Auto-connect the wallet *only* when the environment is MiniPay (`window.ethereum.isMiniPay === true`).
- For standard desktop/web wallets, do not trigger auto-connection; instead, let the user click the connection button explicitly.

#### [NEW] [WalletConnect.tsx](file:///c:/Users/HP/Desktop/proofOfShip/vibepool/ui/components/layout/WalletConnect.tsx)
- Recreate the wallet connection button component from `vibecheck/vibepay`.
- If the user is not connected:
  - In MiniPay: Show a `MiniPay` or `Connecting...` badge (since connection is implicit).
  - In Web: Show the standard RainbowKit `<ConnectButton />`.
- If connected:
  - In MiniPay: Show the user's ERC20 balance inside a styled badge.
  - In Web: Show the standard connected wallet button.

---

### 3. Core Features & App Views

#### [NEW] [Onboarding.tsx](file:///c:/Users/HP/Desktop/proofOfShip/vibepool/ui/components/common/Onboarding.tsx)
- Build an interactive, multi-slide onboarding flow matching the `design_example` image:
  - **Slide 1 (Yellow bg)**: Welcome to Nexora P2E. Displays `/play_earn_complete.png` hero illustration and a cyan "NEXT" button.
  - **Slide 2 (Cyan bg)**: Spin & Win description. Displays `/spin.png` and a white "NEXT" button.
  - **Slide 3 (White/Yellow bg)**: Connect Wallet slide. Subtitle prompts to connect, showing the new `WalletConnect` component.
  - Click on "Get Started" or wallet signature success marks onboarding as complete in `localStorage`.

#### [MODIFY] [HomeHub.tsx](file:///c:/Users/HP/Desktop/proofOfShip/vibepool/ui/features/home/components/HomeHub.tsx)
- Overhaul the home screen layout to match the dashboard from `landing_page_web.png`:
  - Welcome Banner: "WELCOME BACK, [Username]!" (or guest greeting) with a comic-style card.
  - XP progress bar with neo-brutalist styling.
  - 4 grid tiles:
    1. **PREDICTION (Yellow Card)**: Volatility prediction game link.
    2. **ARENA (Purple Card)**: 1v1 duels link.
    3. **MISSIONS (Pink Card)**: Quests link.
    4. **SPIN & WIN (Cyan Card)**: Spin page link.
  - **TOP PLAYERS summary**: Display top 3 leaderboard rankings with name/XP and a "VIEW ALL >" button linking to `/leaderboard`.

#### [MODIFY] [page.tsx](file:///c:/Users/HP/Desktop/proofOfShip/vibepool/ui/app/spin/page.tsx)
- Redesign the Spin page into the "LUCKY DROP" interface:
  - Header cards: "YOUR DROPS: [N] Available" and Possible rewards reference.
  - Render an interactive 6-sector SVG spin wheel in the center containing the actual segments: 25 USDT, 500 XP, 10 USDC, 5 USDm, 100 XP, and 0.5 CELO.
  - "SPIN NOW" button: on click, request POST `/api/spins` and animate rotation (say, 5 spins + segment offset) using CSS transforms. Slow down to stop on the exact segment returned, show a victory modal, and refresh spins count.
  - Right panel: history of drops querying GET `/api/spin/history`.

#### [MODIFY] [page.tsx](file:///c:/Users/HP/Desktop/proofOfShip/vibepool/ui/app/leaderboard/page.tsx)
- Redesign the Leaderboard page matching the `leaderboard.png` layout:
  - Background: set a beautiful backdrop overlay.
  - Header: Global / Friends / Season tabs, and active season end countdown timer.
  - **Podium**: Highlight 1st, 2nd, and 3rd place users. Place 1st in the middle (larger card with yellow/gold bezel), 2nd on the left (grey/silver bezel), and 3rd on the right (orange/bronze bezel). Include name, avatar, and XP.
  - **List**: Under the podium, show scrollable ranks 4+ in a detailed list.
  - **Footer**: Place a fixed bar at the bottom showing the logged-in user's active rank and details with a yellow background.

---

### 4. Application Shell Layout & Verification

#### [MODIFY] [layout.tsx](file:///c:/Users/HP/Desktop/proofOfShip/vibepool/ui/app/layout.tsx)
- Insert the requested Talent Protocol project verification meta key and updated search tags into the root metadata config:
  ```ts
  export const metadata: Metadata = {
      title: 'Vibepool - Yield-Backed Price Volatility Prediction Game on Celo',
      description: 'Predict CELO token price volatility and earn a share of the losing pool, integrated with dynamic yield from Aave protocol pools on Celo.',
      keywords: ['crypto', 'volatility', 'prediction market', 'Celo', 'MiniPay', 'Aave', 'yield', 'Vibepool'],
      icons: {
          icon: '/logo.png',
      },
      other: {
          'talentapp:project_verification': 'a951a60cce43f90c1a84d1c55f7412f73f589c7eae2462103d148da7d10792e7323ff0da2cd9c49d4bc71f04377bb277941fe2a46f9be7012599c41be32370e8',
      },
  };
  ```

---

## Verification Plan

### Manual Verification
1. Open the dev site locally in the browser (the background terminal dev script is already running `bun run dev`).
2. Verify that the desktop layout shows the Nexora landing page with the horizontal tablet simulator on the right.
3. Resize the window to mobile width and verify that it switches to the mobile view with the floating bottom dock navigation.
4. Clear `localStorage` and confirm the three-screen onboarding flow shows yellow/cyan/white cards and requires connecting before entering the dashboard.
5. In desktop view, navigate to the Spin tab and test the spin wheel animation. Confirm that the wheel spins, lands on the correct slice matching the reward, shows a reward overlay, and updates the drop history list.
6. Navigate to the Leaderboard tab and verify the 1st/2nd/3rd podium cards and the sticky user card at the bottom.
