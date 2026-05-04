'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMemberAuth } from '@/context/MemberAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function MemberLoginPage() {
  const router = useRouter()
  const { login } = useMemberAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      toast.error('Email and password are required')
      return
    }
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      router.push('/member/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm border border-border rounded-xl p-8 bg-background-primary shadow-none">
        <h1 className="text-2xl font-medium mb-1">Member Login</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign in to your referral dashboard</p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              className="mt-1"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <Button className="w-full" size="lg" onClick={handleLogin} disabled={loading}>
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
              : 'Sign In'
            }
          </Button>
        </div>
      </div>
    </div>
  )
}
