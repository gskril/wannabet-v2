'use client'

import { Home, Plus, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { cn } from '@/lib/utils'

import { CreateBetDialog } from './create-bet-dialog'

export function BottomNav() {
  const pathname = usePathname()
  const [createBetOpen, setCreateBetOpen] = useState(false)

  // In a real app, this would come from wallet connection
  const connectedAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
  const isProfile = pathname.startsWith('/profile')

  return (
    <>
      <nav className="border-border bg-card/95 supports-[backdrop-filter]:bg-card/80 fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-around px-4">
          <Link
            href="/"
            className={cn(
              'flex flex-1 flex-col items-center gap-1 transition-colors',
              pathname === '/'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium">Feed</span>
          </Link>

          <button
            onClick={() => setCreateBetOpen(true)}
            className="-mt-2 flex flex-col items-center gap-1 transition-all hover:scale-105"
          >
            <div className="bg-primary shadow-primary/50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg">
              <Plus className="text-primary-foreground h-7 w-7" />
            </div>
            <span className="text-primary text-xs font-semibold">Create</span>
          </button>

          <Link
            href={`/profile/${connectedAddress}`}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 transition-colors',
              isProfile
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <User className="h-6 w-6" />
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </nav>

      <CreateBetDialog open={createBetOpen} onOpenChange={setCreateBetOpen} />
    </>
  )
}
