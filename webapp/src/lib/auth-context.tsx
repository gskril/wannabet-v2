'use client'

import { createContext, useContext } from 'react'

import type { FarcasterUser } from './types'

interface AuthContextType {
  user: FarcasterUser | null
  fid: number | null
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  fid: null,
  isAuthenticated: false,
})

export function useAuth() {
  return useContext(AuthContext)
}

export { AuthContext }
