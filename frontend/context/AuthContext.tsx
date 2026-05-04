'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, usersApi, UserProfile } from '@/lib/api'

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, extras?: { bio?: string; location?: string; phone?: string; website?: string }) => Promise<void>
  logout: () => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // sessionStorage — automatically cleared when the browser tab/window is closed
    const storedToken = sessionStorage.getItem('token')
    const storedUser  = sessionStorage.getItem('user')
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        sessionStorage.clear()
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    if (res.error) throw new Error(res.error)
    const tokenValue = (res as any).access_token || res.token
    if (tokenValue) {
      sessionStorage.setItem('token', tokenValue)
      setToken(tokenValue)
    }
    if (res.user) {
      // Fetch full profile so bio/location/phone/website are stored in session
      try {
        const fullProfile = await usersApi.me(res.user.id)
        sessionStorage.setItem('user', JSON.stringify(fullProfile))
        setUser(fullProfile)
      } catch {
        sessionStorage.setItem('user', JSON.stringify(res.user))
        setUser(res.user)
      }
    }
  }

  const register = async (name: string, email: string, password: string, extras?: { bio?: string; location?: string; phone?: string; website?: string }) => {
    const res = await authApi.register({ name, email, password, ...extras })
    if (res.error) throw new Error(res.error)
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
