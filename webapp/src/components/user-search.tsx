'use client'

import { Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserAvatar } from '@/components/user-avatar'
import { searchUsers } from '@/lib/neynar'
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

const EMPTY_ARRAY: number[] = []

export function UserSearch({
  label,
  placeholder = '@username',
  helperText,
  required = false,
  value,
  onChange,
  excludeFids = EMPTY_ARRAY,
}: UserSearchProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState(value)
  const [users, setUsers] = useState<FarcasterUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<FarcasterUser | undefined>()

  // Use ref to track the last search query to prevent duplicate requests
  const lastSearchRef = useRef<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)

  // Memoize the search function to prevent re-creation
  const performSearch = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim()

      // Don't search if query is too short or same as last search
      if (
        !trimmedQuery ||
        trimmedQuery.length < 2 ||
        lastSearchRef.current === trimmedQuery
      ) {
        return
      }

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController()
      lastSearchRef.current = trimmedQuery

      setIsLoading(true)
      try {
        const results = await searchUsers(trimmedQuery)
        const filtered = results.filter(
          (user) => !excludeFids.includes(user.fid)
        )
        setUsers(filtered.slice(0, 10))
      } catch (error) {
        // Only log if not an abort error
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Search error:', error)
        }
        setUsers([])
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
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
    }, 500) // 500ms debounce (increased from 300ms)

    return () => {
      clearTimeout(timeoutId)
      // Cancel any in-flight request when effect cleans up
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [searchQuery, performSearch])

  const handleUserSelect = (user: FarcasterUser) => {
    const username = `@${user.username}`
    setSearchQuery(username)
    setSelectedUser(user)
    onChange(username, user)
    setIsFocused(false)
    // Clear search results after selection
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
    <div className="space-y-2">
      <Label htmlFor="user-search" className="text-base">
        {label}
      </Label>

      {/* Show avatar card if user is selected, otherwise show search input */}
      {selectedUser ? (
        <div className="border-primary bg-primary/10 flex min-h-[72px] items-center justify-between gap-3 rounded-lg border-2 p-3">
          <div className="flex items-center gap-3">
            <UserAvatar user={selectedUser} size="md" clickable={false} />
            <div>
              <p className="font-semibold">{selectedUser.displayName}</p>
              <p className="text-muted-foreground text-sm">
                @{selectedUser.username}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearSelection}
            className="text-muted-foreground hover:text-foreground rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative min-h-[72px]">
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
            className="h-[72px] pl-10 text-base"
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
                    key={user.fid}
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
              ) : searchQuery.trim().length >= 2 ? (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  No users found
                </div>
              ) : searchQuery.trim().length > 0 ? (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  Type at least 2 characters to search
                </div>
              ) : null}
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
