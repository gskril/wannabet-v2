'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserAvatar } from '@/components/user-avatar'
import { FARCASTER_USERS } from '@/lib/dummy-data'
import type { FarcasterUser } from '@/lib/types'

interface UserSearchProps {
  label: string
  placeholder?: string
  helperText?: string
  required?: boolean
  value: string
  onChange: (value: string, user?: FarcasterUser) => void
  excludeFids?: number[]
}

export function UserSearch({
  label,
  placeholder = '@username or FID',
  helperText,
  required = false,
  value,
  onChange,
  excludeFids = [],
}: UserSearchProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState(value)

  // Get available users (excluding any specified FIDs)
  const availableUsers = Object.values(FARCASTER_USERS).filter(
    (user) => !excludeFids.includes(user.fid)
  )

  // Filter users based on search query
  const filteredUsers =
    searchQuery.trim().length > 0
      ? availableUsers.filter(
          (user) =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.displayName
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            user.fid.toString().includes(searchQuery)
        )
      : availableUsers.slice(0, 5) // Show first 5 users by default

  const selectedUser = availableUsers.find(
    (user) =>
      user.username === value ||
      user.fid.toString() === value ||
      `@${user.username}` === value
  )

  const handleUserSelect = (user: FarcasterUser) => {
    setSearchQuery(`@${user.username}`)
    onChange(`@${user.username}`, user)
    setIsFocused(false)
  }

  const handleInputChange = (newValue: string) => {
    setSearchQuery(newValue)
    onChange(newValue)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="user-search" className="text-base">
        {label} {required && '*'}
      </Label>
      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
        <Input
          id="user-search"
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow click on user
            setTimeout(() => setIsFocused(false), 200)
          }}
          required={required}
          className="h-12 pl-10 text-base"
        />

        {/* Dropdown with user suggestions */}
        {isFocused && filteredUsers.length > 0 && (
          <div className="bg-background absolute top-full z-50 mt-1 max-h-[280px] w-full overflow-y-auto rounded-lg border shadow-lg">
            {filteredUsers.slice(0, 5).map((user) => (
              <button
                key={user.fid}
                type="button"
                onClick={() => handleUserSelect(user)}
                className="hover:bg-muted flex w-full items-center gap-3 border-b p-3 text-left transition-colors last:border-b-0"
              >
                <UserAvatar user={user} size="md" clickable={false} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{user.displayName}</p>
                  <p className="text-muted-foreground text-sm">
                    @{user.username}
                  </p>
                </div>
                {selectedUser?.fid === user.fid && (
                  <div className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    Selected
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedUser && (
        <div className="bg-muted flex items-center gap-2 rounded-lg p-2">
          <UserAvatar user={selectedUser} size="sm" clickable={false} />
          <span className="text-sm font-medium">
            {selectedUser.displayName}
          </span>
        </div>
      )}
      {helperText && (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      )}
    </div>
  )
}
