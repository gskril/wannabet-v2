'use client'

import Link from 'next/link'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { FarcasterUser } from '@/lib/types'

interface UserAvatarProps {
  user: FarcasterUser
  size?: 'sm' | 'md' | 'lg' | 'xl'
  clickable?: boolean
}

export function UserAvatar({
  user,
  size = 'md',
  clickable = true,
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  }

  const getFallbackInitials = () => {
    const name = user.displayName || user.username || '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const avatar = (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={user.pfpUrl} alt={user.displayName || user.username} />
      <AvatarFallback>{getFallbackInitials()}</AvatarFallback>
    </Avatar>
  )

  // Don't make clickable if user doesn't have a Farcaster account (fid === 0)
  if (!clickable || user.fid === 0) {
    return avatar
  }

  return (
    <Link
      href={`/profile/${user.fid}`}
      className="inline-block transition-opacity hover:opacity-80"
      title={`@${user.username}`}
    >
      {avatar}
    </Link>
  )
}
