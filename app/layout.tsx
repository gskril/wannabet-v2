import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { BottomNav } from "@/components/bottom-nav"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "BetChain - P2P Betting",
  description: "Peer-to-peer betting on Ethereum",
  generator: "v0.app",
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
