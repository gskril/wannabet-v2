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

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur sm:hidden">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const isActive = pathname === link.href
          const isProfileLink = link.label === 'Profile'
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-1 px-3 py-3 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isProfileLink && user ? (
                <div className="h-5 w-5">
                  <UserAvatar user={user} size="sm" clickable={false} />
                </div>
              ) : (
                <link.icon className="h-5 w-5" />
              )}
              <span>{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
