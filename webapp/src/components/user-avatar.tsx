'use client'

import Link from 'next/link'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { FarcasterUser } from '@/lib/types'

interface UserAvatarProps {
  user: FarcasterUser
  size?: 'sm' | 'md' | 'lg'
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
  }

  const avatar = (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={user.pfpUrl} alt={user.displayName} />
      <AvatarFallback>
        {user.displayName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  )

  if (!clickable) {
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
