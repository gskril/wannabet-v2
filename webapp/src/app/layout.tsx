import type { Metadata } from 'next'

import { BottomNav } from '@/components/bottom-nav'
import { SdkProvider } from '@/components/sdk-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { WagmiProvider } from '@/components/wagmi-provider'

import './globals.css'

export const metadata: Metadata = {
  title: 'WannaBet - Peer-to-Peer Betting on Farcaster',
  description: 'Create and accept friendly bets with friends on Farcaster',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://auth.farcaster.xyz" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">
        <ThemeProvider defaultTheme="light" storageKey="wannabet-theme">
          <SdkProvider>
            <WagmiProvider>
              {children}
              <BottomNav />
            </WagmiProvider>
          </SdkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
