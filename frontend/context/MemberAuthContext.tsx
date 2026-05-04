'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { memberApi, MemberProfile } from '@/lib/api'

interface MemberAuthContextType {
  member: MemberProfile | null
  token: string | null
  loading: boolean
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const MemberAuthContext = createContext<MemberAuthContextType | null>(null)

export function MemberAuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<MemberProfile | null>(null)
  const [token, setToken]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken  = sessionStorage.getItem('memberToken')
    const storedMember = sessionStorage.getItem('memberProfile')
    if (storedToken && storedMember) {
      try {
        setToken(storedToken)
        setMember(JSON.parse(storedMember))
      } catch {
        sessionStorage.removeItem('memberToken')
        sessionStorage.removeItem('memberProfile')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await memberApi.login(email, password)
    const t = res.access_token
    sessionStorage.setItem('memberToken', t)
    sessionStorage.setItem('memberProfile', JSON.stringify(res.member))
    setToken(t)
    setMember(res.member)
  }

  const logout = () => {
    sessionStorage.removeItem('memberToken')
    sessionStorage.removeItem('memberProfile')
    setToken(null)
    setMember(null)
  }

  return (
    <MemberAuthContext.Provider value={{ member, token, loading, isLoggedIn: !!token, login, logout }}>
      {children}
    </MemberAuthContext.Provider>
  )
}

export function useMemberAuth() {
  const ctx = useContext(MemberAuthContext)
  if (!ctx) throw new Error('useMemberAuth must be used within MemberAuthProvider')
  return ctx
}
