import React from 'react';
import type { Metadata } from 'next';
import '@rainbow-me/rainbowkit/styles.css';
import '@/styles/globals.css';
import { Providers } from './providers';

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
