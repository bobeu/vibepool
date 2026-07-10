import React from 'react';
import type { Metadata } from 'next';
import '@rainbow-me/rainbowkit/styles.css';
import '@/styles/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
    title: 'NEXORA — Home of Web3 Competitive Games',
    description: 'Compete in daily tournaments, spin rewards, and climb the leaderboard on Celo. The next generation gaming platform.',
    keywords: ['gaming', 'tournaments', 'prediction', 'leaderboard', 'rewards', 'Celo', 'MiniPay', 'NEXORA'],
    icons: {
        icon: '/logo.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
