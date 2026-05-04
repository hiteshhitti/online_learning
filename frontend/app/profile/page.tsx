'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Edit2, LogOut, Shield, Bell, Loader2, Eye, EyeOff, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { usersApi, accountApi } from '@/lib/api'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [show, setShow] = useState({ current: false, next: false, confirm: false })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.current || !form.next || !form.confirm) {
      toast.error('Please fill in all fields')
      return
    }
    if (form.next !== form.confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (form.next.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await accountApi.changePassword(userId, form.current, form.next)
      toast.success('Password changed successfully')
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <Card className="w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Change Password</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        {(['current', 'next', 'confirm'] as const).map((field) => (
          <div key={field}>
            <label className="text-sm font-medium capitalize">
              {field === 'current' ? 'Current Password' : field === 'next' ? 'New Password' : 'Confirm New Password'}
            </label>
            <div className="relative mt-2">
              <Input
                type={show[field] ? 'text' : 'password'}
                placeholder="••••••••"
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}
              >
                {show[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Update Password'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─── Notifications Modal ─────────────────────────────────────────────────────
function NotificationsModal({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState({
    courseUpdates: true,
    newMessages: true,
    promotions: false,
    weeklyDigest: true,
    liveClasses: true,
  })

  const toggle = (key: keyof typeof prefs) => setPrefs(p => ({ ...p, [key]: !p[key] }))

  const items = [
    { key: 'courseUpdates' as const, label: 'Course Updates', desc: 'Get notified when your enrolled courses are updated' },
    { key: 'newMessages' as const, label: 'New Messages', desc: 'Receive notifications for instructor messages' },
    { key: 'promotions' as const, label: 'Promotions & Offers', desc: 'Special deals and discounts on courses' },
    { key: 'weeklyDigest' as const, label: 'Weekly Digest', desc: 'A summary of your learning activity every week' },
    { key: 'liveClasses' as const, label: 'Live Class Reminders', desc: 'Remind me 30 minutes before live sessions' },
  ]

  const handleSave = () => {
    toast.success('Notification preferences saved')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <Card className="w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Notification Preferences</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          {items.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${prefs[key] ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave}>Save Preferences</Button>
        </div>
      </Card>
    </div>
  )
}

// ─── Delete Account Modal ─────────────────────────────────────────────────────
function DeleteAccountModal({ userId, onClose, onDeleted }: { userId: string; onClose: () => void; onDeleted: () => void }) {
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (confirm !== 'DELETE') { toast.error('Type DELETE to confirm'); return }
    setLoading(true)
    try {
      await accountApi.deleteAccount(userId)
      toast.success('Account deleted')
      onDeleted()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <Card className="w-full max-w-md p-6 space-y-5 border-destructive/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-destructive">Delete Account</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground">This action is <strong>permanent and irreversible</strong>. All your data, enrollments, and progress will be deleted.</p>
        <div>
          <label className="text-sm font-medium">Type <span className="font-mono text-destructive">DELETE</span> to confirm</label>
          <Input className="mt-2" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="DELETE" />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={loading || confirm !== 'DELETE'}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deleting...</> : 'Delete Account'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, isLoggedIn, logout, loading: authLoading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showNotifModal, setShowNotifModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [profile, setProfile] = useState({
    name: '', email: '', bio: '', location: '', phone: '', website: '',
  })

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push('/')
    if (user) {
      // Seed instantly from auth context so name/email show without waiting
      setProfile({
        name: user.name || '',
        email: user.email || '',
        bio: '',
        location: '',
        phone: '',
        website: '',
      })
      // Fetch full profile from backend — login response only returns id/name/email,
      // bio/location/phone/website are only available from GET /users/me
      setProfileLoading(true)
      usersApi.me(user.id)
        .then(fullProfile => {
          setProfile({
            name: fullProfile.name || '',
            email: fullProfile.email || '',
            bio: fullProfile.bio || '',
            location: fullProfile.location || '',
            phone: fullProfile.phone || '',
            website: fullProfile.website || '',
          })
        })
        .catch(() => {}) // silently fail, login data already shown
        .finally(() => setProfileLoading(false))
    }
  }, [user, isLoggedIn, authLoading, router])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await usersApi.update(user.id, {
        name: profile.name,
        bio: profile.bio,
        location: profile.location,
        phone: profile.phone,
        website: profile.website,
      })
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    const url = URL.createObjectURL(file)
    setAvatarUrl(url)
    toast.success('Profile photo updated')
  }

  const initials = profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <main className="min-h-screen pt-24 pb-12">
      {/* Modals */}
      {showPasswordModal && user && <ChangePasswordModal userId={user.id} onClose={() => setShowPasswordModal(false)} />}
      {showNotifModal && <NotificationsModal onClose={() => setShowNotifModal(false)} />}
      {showDeleteModal && user && (
        <DeleteAccountModal
          userId={user.id}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => { logout(); router.push('/') }}
        />
      )}

      <section className="py-8 px-4 border-b border-border bg-card">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <Card className="p-8 mb-8">
          <div className="flex items-start gap-8">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-32 h-32 rounded-full object-cover" />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {initials}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition-colors"
                title="Change photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
              {profile.location && <p className="text-sm text-muted-foreground mt-1">📍 {profile.location}</p>}
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="gap-2" onClick={() => setIsEditing(!isEditing)}>
                  <Edit2 className="w-4 h-4" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {profileLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading profile details...
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <Card className="p-6">
              <h3 className="font-bold mb-6">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} disabled={!isEditing} className="mt-2" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <Input type="email" value={profile.email} disabled className="mt-2 opacity-60" />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} disabled={!isEditing} className="mt-2" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} disabled={!isEditing} className="mt-2" placeholder="City, Country" />
                </div>
                <div>
                  <label className="text-sm font-medium">Website</label>
                  <Input value={profile.website} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))} disabled={!isEditing} className="mt-2" placeholder="yourwebsite.com" />
                </div>
                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                {isEditing && (
                  <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                  </Button>
                )}
              </div>
            </Card>

            {/* Account Settings */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">Account Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Change Password</p>
                      <p className="text-xs text-muted-foreground">Update your password regularly</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>Change</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Notification Preferences</p>
                      <p className="text-xs text-muted-foreground">Manage your notifications</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowNotifModal(true)}>Manage</Button>
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-destructive/50">
              <h3 className="font-bold mb-4 text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">Once you delete your account, there is no going back. Please be certain.</p>
              <Button variant="destructive" className="w-full" onClick={() => setShowDeleteModal(true)}>Delete Account</Button>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card className="p-6">
                <h4 className="font-bold mb-4">Account Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <span className="text-sm font-medium">{user ? new Date().getFullYear() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subscription</span>
                    <span className="text-sm font-medium">Free</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-bold mb-4">Quick Links</h4>
                <div className="space-y-2">
                  <Link href="/my-courses"><Button variant="ghost" className="w-full justify-start">My Courses</Button></Link>
                  <Link href="/dashboard"><Button variant="ghost" className="w-full justify-start">Dashboard</Button></Link>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={logout}>
                    <LogOut className="w-4 h-4" />Logout
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
