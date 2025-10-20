'use client'

import { Home, Plus, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()
  const { user, fid, isAuthenticated } = useAuth()

  const profileHref = isAuthenticated && fid ? `/profile/${fid}` : '/profile/3'

  const links = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/#create', icon: Plus, label: 'Create' },
    { href: profileHref, icon: User, label: 'Profile' },
  ]

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Force hash change by setting it
    window.location.hash = 'create'
  }

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur sm:hidden">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const isActive = pathname === link.href
          const isProfileLink = link.label === 'Profile'
          const isCreateLink = link.label === 'Create'

          if (isCreateLink) {
            return (
              <button
                key={link.href}
                onClick={handleCreateClick}
                className="flex min-w-0 flex-1 items-center justify-center py-4 transition-all"
              >
                <div className="bg-primary text-primary-foreground ring-primary/30 hover:ring-primary/40 flex h-12 w-12 animate-pulse items-center justify-center rounded-full shadow-lg ring-2 transition-all hover:scale-110 hover:shadow-xl hover:ring-4">
                  <link.icon className="h-6 w-6" />
                </div>
              </button>
            )
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex min-w-0 flex-1 items-center justify-center py-4 transition-all',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isProfileLink && user ? (
                <div className="h-6 w-6">
                  <UserAvatar user={user} size="sm" clickable={false} />
                </div>
              ) : (
                <link.icon className="h-6 w-6" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
