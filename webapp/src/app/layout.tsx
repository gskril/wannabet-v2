import type { Metadata } from 'next'
import { Comic_Neue } from 'next/font/google'

import { BottomNav } from '@/components/bottom-nav'
import { SdkProvider } from '@/components/sdk-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { WagmiProvider } from '@/components/wagmi-provider'

import './globals.css'

const comicNeue = Comic_Neue({
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WannaBet - Peer-to-Peer Betting on Farcaster',
  description: 'Create and accept friendly bets with friends on Farcaster',
  icons: {
    icon: '/img/logo-icon.png',
    apple: '/img/logo-icon.png',
  },
  openGraph: {
    title: 'WannaBet - Peer-to-Peer Betting on Farcaster',
    description: 'Create and accept friendly bets with friends on Farcaster',
    images: ['/img/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WannaBet - Peer-to-Peer Betting on Farcaster',
    description: 'Create and accept friendly bets with friends on Farcaster',
    images: ['/img/og.png'],
  },
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
      <body className={`${comicNeue.className} antialiased`}>
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
