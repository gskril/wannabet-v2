import { Analytics } from '@vercel/analytics/next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import type React from 'react'
import { Suspense } from 'react'

import { BottomNav } from '@/components/bottom-nav'

import './globals.css'

export const metadata: Metadata = {
  title: 'BetChain - P2P Betting',
  description: 'Peer-to-peer betting on Ethereum',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <div className="pb-16">{children}</div>
        </Suspense>
        <BottomNav />
        <Analytics />
      </body>
    </html>
  )
}
