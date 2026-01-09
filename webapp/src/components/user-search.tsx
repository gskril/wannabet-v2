'use client'

import { Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserAvatar } from '@/components/user-avatar'
import type { FarcasterUser } from 'indexer/types'
import { cn } from '@/lib/utils'

interface UserSearchProps {
  label: string
  placeholder?: string
  helperText?: string
  required?: boolean
  value: string
  onChange: (value: string, user?: FarcasterUser) => void
  excludeFids?: number[]
  labelClassName?: string
  inputClassName?: string
}

const EMPTY_ARRAY: number[] = []

async function searchUsers(query: string): Promise<FarcasterUser[]> {
  const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
  if (!response.ok) {
    throw new Error('Search failed')
  }
  const data = await response.json()
  return data.users || []
}

export function UserSearch({
  label,
  placeholder = 'username',
  helperText,
  required = false,
  value,
  onChange,
  excludeFids = EMPTY_ARRAY,
  labelClassName,
  inputClassName,
}: UserSearchProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState(value)
  const [users, setUsers] = useState<FarcasterUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<FarcasterUser | undefined>()

  const lastSearchRef = useRef<string>('')

  // Search function
  const performSearch = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim()

      if (
        !trimmedQuery ||
        trimmedQuery.length < 2 ||
        lastSearchRef.current === trimmedQuery
      ) {
        return
      }

      lastSearchRef.current = trimmedQuery
      setIsLoading(true)

      try {
        const results = await searchUsers(trimmedQuery)
        const filtered = results.filter(
          (user) => user.fid !== null && !excludeFids.includes(user.fid)
        )
        setUsers(filtered.slice(0, 10))
      } catch (error) {
        console.error('Search error:', error)
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    },
    [excludeFids]
  )

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setUsers([])
      lastSearchRef.current = ''
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [searchQuery, performSearch])

  const handleUserSelect = (user: FarcasterUser) => {
    const username = user.username || ''
    setSearchQuery(username)
    setSelectedUser(user)
    onChange(username, user)
    setIsFocused(false)
    setUsers([])
    lastSearchRef.current = username
  }

  const handleInputChange = (newValue: string) => {
    setSearchQuery(newValue)
    onChange(newValue, undefined)
    if (!newValue.trim()) {
      setSelectedUser(undefined)
      setUsers([])
      lastSearchRef.current = ''
    }
  }

  const handleClearSelection = () => {
    setSearchQuery('')
    setSelectedUser(undefined)
    onChange('', undefined)
    setUsers([])
    lastSearchRef.current = ''
  }

  return (
    <div className="space-y-1">
      <Label htmlFor="user-search" className={cn(labelClassName)}>
        {label}
      </Label>

      {/* Show avatar card if user is selected, otherwise show search input */}
      {selectedUser ? (
        <div className="border-primary bg-primary/10 flex h-10 items-center justify-between gap-2 rounded-md border-2 px-3">
          <div className="flex items-center gap-2">
            <UserAvatar user={selectedUser} size="sm" clickable={false} />
            <p className="text-sm font-medium">@{selectedUser.username}</p>
          </div>
          <button
            type="button"
            onClick={handleClearSelection}
            className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
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
            className={cn('h-10 pl-9 text-sm', inputClassName)}
          />

          {/* Dropdown with user suggestions */}
          {isFocused && searchQuery.trim().length >= 2 && (
            <div className="bg-background absolute top-full z-50 mt-1 max-h-[280px] w-full overflow-y-auto rounded-lg border shadow-lg">
              {isLoading ? (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  Searching...
                </div>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <button
                    key={user.fid ?? user.address}
                    type="button"
                    onClick={() => handleUserSelect(user)}
                    className="hover:bg-farcaster-brand/20 flex w-full items-center gap-3 border-b p-3 text-left transition-colors last:border-b-0"
                  >
                    <UserAvatar user={user} size="md" clickable={false} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {user.displayName}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        @{user.username}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  No users found
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {helperText && (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      )}
    </div>
  )
}
