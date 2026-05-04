'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    phone: '', location: '', website: '', bio: '',
  })
  const { login, register } = useAuth()

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      toast.error('Email and password are required')
      return
    }
    if (mode === 'register' && !form.name) {
      toast.error('Full name is required')
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        toast.success('Welcome back!')
      } else {
        await register(form.name, form.email, form.password, {
          phone: form.phone,
          location: form.location,
          website: form.website,
          bio: form.bio,
        })
        // Auto-login after registration
        await login(form.email, form.password)
        toast.success('Account created! Welcome to LearnHub.')
      }
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login')
    setForm({ name: '', email: '', password: '', phone: '', location: '', website: '', bio: '' })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          {mode === 'register' && (
            <p className="text-sm text-muted-foreground">
              Fill in your details below. Only name, email and password are required.
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 pt-2">

          {mode === 'register' && (
            <div>
              <label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
              <Input placeholder="John Doe" value={form.name} onChange={set('name')} className="mt-1" />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
            <Input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Password <span className="text-destructive">*</span></label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              className="mt-1"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {mode === 'register' && (
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Optional details</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input placeholder="City, Country" value={form.location} onChange={set('location')} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Website</label>
                  <Input placeholder="https://yourwebsite.com" value={form.website} onChange={set('website')} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <textarea
                    placeholder="Tell us a little about yourself..."
                    value={form.bio}
                    onChange={set('bio')}
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>
          )}

          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Please wait</>
              : mode === 'login' ? 'Sign In' : 'Create Account'
            }
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button className="text-primary font-medium hover:underline" onClick={switchMode}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
