import type { Metadata } from 'next'
import { Quicksand } from 'next/font/google'

import { BottomNav } from '@/components/bottom-nav'
import { SdkProvider } from '@/components/sdk-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { WagmiProvider } from '@/components/wagmi-provider'

import './globals.css'

const quicksand = Quicksand({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

const fcMiniAppEmbed = JSON.stringify({
  version: '1',
  imageUrl: 'https://x.heywannabet.com/img/og.png',
  button: {
    title: 'Open WannaBet',
    action: {
      type: 'launch_frame',
      name: 'WannaBet',
      url: 'https://x.heywannabet.com',
      splashImageUrl: 'https://x.heywannabet.com/img/logo.png',
      splashBackgroundColor: '#FAF4EE',
    },
  },
})

export const metadata: Metadata = {
  metadataBase: new URL('https://x.heywannabet.com'),
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
  other: {
    'fc:miniapp': fcMiniAppEmbed,
    'fc:frame': fcMiniAppEmbed,
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
      <body className={`${quicksand.className} antialiased`}>
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
