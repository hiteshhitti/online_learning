'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, BookOpen, Users, MessageSquare, Tag, LogOut,
  Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, Check, CheckCircle, Search,
  ChevronDown, RefreshCw, Copy, ToggleLeft, ToggleRight, AlertCircle,
  CalendarDays, Wifi, MapPin, Monitor, Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  adminApi, AdminStats, AdminCourse, AdminEnrollment,
  AdminDiscount, AdminEnquiry, adminBatchApi, ApiBatch,
} from '@/lib/api'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'courses' | 'enrollments' | 'enquiries' | 'discounts' | 'batches' | 'instalments'

const BLANK_COURSE: Omit<AdminCourse, 'id'> = {
  title: '', description: '', price: 0, category: '',
  level: 'Beginner', instructor: '', duration: '', image: '',
}

const BLANK_BATCH = {
  course_id: '', name: '', start_date: '', timing: '',
  seats_total: 30, mode: 'Online' as 'Online' | 'Offline' | 'Hybrid',
  is_active: true,
}

// ─── Login Screen ───────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async () => {
    setError('')
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true)
    try {
      const res = await adminApi.login(email, password)
      sessionStorage.setItem('adminToken', res.access_token)
      toast.success('Welcome back, Admin!')
      onLogin()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in with your admin credentials</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Admin Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2" placeholder="admin@learnhub.com" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <div className="relative mt-2">
              <Input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="pr-10" placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in...</> : 'Sign In'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  )
}

// ─── Course Form Modal ───────────────────────────────────────────────────────
function CourseModal({ course, onClose, onSaved }: {
  course: AdminCourse | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<Omit<AdminCourse, 'id'>>(
    course ? { title: course.title, description: course.description, price: course.price,
               category: course.category || '', level: course.level || 'Beginner',
               instructor: course.instructor || '', duration: course.duration || '', image: course.image || '' }
           : { ...BLANK_COURSE }
  )
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.price || form.price <= 0) { toast.error('Price must be greater than 0'); return }
    setLoading(true)
    try {
      if (course) {
        await adminApi.updateCourse(course.id, form)
        toast.success('Course updated')
      } else {
        await adminApi.createCourse(form)
        toast.success('Course created')
      }
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto py-8">
      <Card className="w-full max-w-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{course ? 'Edit Course' : 'Add New Course'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Course Title *</label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} className="mt-2" placeholder="e.g. Web Development Bootcamp" />
          </div>
          <div>
            <label className="text-sm font-medium">Price (₹ / $) *</label>
            <Input type="number" value={form.price} onChange={e => set('price', +e.target.value)} className="mt-2" min={0} />
          </div>
          <div>
            <label className="text-sm font-medium">Level</label>
            <div className="relative mt-2">
              <select value={form.level} onChange={e => set('level', e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none">
                {['Beginner','Intermediate','Advanced'].map(l => <option key={l}>{l}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <div className="relative mt-2">
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none">
                <option value="">— Select Category —</option>
                {[
                  'Web Development','Mobile Development','Data Science',
                  'Machine Learning / AI','UI/UX Design','Graphic Design',
                  'Digital Marketing','Business & Management','Finance & Accounting',
                  'Photography & Video','Music','Health & Fitness',
                  'Language Learning','Personal Development','Other',
                ].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Instructor Name</label>
            <Input value={form.instructor} onChange={e => set('instructor', e.target.value)} className="mt-2" placeholder="e.g. John Smith" />
          </div>
          <div>
            <label className="text-sm font-medium">Duration</label>
            <Input value={form.duration} onChange={e => set('duration', e.target.value)} className="mt-2" placeholder="e.g. 12 hours" />
          </div>
          <div>
            <label className="text-sm font-medium">Image URL</label>
            <Input value={form.image} onChange={e => set('image', e.target.value)} className="mt-2" placeholder="https://..." />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
              className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="What students will learn..." />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : <><Check className="w-4 h-4 mr-2" />{course ? 'Update' : 'Create'} Course</>}
          </Button>
        </div>
      </Card>
    </div>
  )
}



// ─── Ledger Modal ─────────────────────────────────────────────────────────────
function LedgerModal({ order, onClose, onPaymentAdded, onAddPayment }: {
  order: any
  onClose: () => void
  onPaymentAdded: () => void
  onAddPayment: (o: any) => void
}) {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const [history, setHistory] = useState<any[]>([])
  const [totalPaid, setTotalPaid] = useState(0)
  const [loading, setLoading] = useState(true)

  const fullAmount = Number(order.full_amount || order.course_price || order.amount || 0)

  useEffect(() => {
    const token = sessionStorage.getItem('adminToken') || ''
    fetch(`${API}/admin/orders/${order.order_id}/instalments`, {
      headers: { 'X-Admin-Token': token }
    })
      .then(r => r.ok ? r.json() : { instalments: [], total_paid: 0 })
      .then(d => {
        setHistory(d.instalments || [])
        setTotalPaid(d.total_paid || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [order.order_id])

  const pending = Math.max(fullAmount - totalPaid, 0)
  const pct = fullAmount > 0 ? Math.min(Math.round((totalPaid / fullAmount) * 100), 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8 overflow-y-auto">
      <Card className="w-full max-w-lg p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">Payment Ledger</h2>
            <p className="text-sm font-medium text-muted-foreground">{order.student_name}</p>
            <p className="text-xs text-muted-foreground">{order.student_email}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{order.course_title}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Progress */}
        <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Total Paid</span>
            <span className="text-primary">₹{totalPaid.toLocaleString('en-IN')} / ₹{fullAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="w-full bg-background rounded-full h-2 border border-border">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{pct}% paid</span>
            {pending > 0
              ? <span className="text-amber-600 dark:text-amber-400 font-medium">₹{pending.toLocaleString('en-IN')} pending</span>
              : <span className="text-green-600 font-medium">✅ Fully paid</span>
            }
          </div>
        </div>

        {/* Payment history */}
        <div>
          <p className="text-sm font-semibold mb-2">Payment History</p>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No payments recorded yet</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {['#', 'Amount', 'Reference', 'Note', 'Date'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((h, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-semibold text-primary">₹{Number(h.amount).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{h.reference || '—'}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{h.note || '—'}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {h.created_at ? new Date(h.created_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          {pending > 0 && order.status !== 'active' && (
            <Button className="flex-1" onClick={() => {
              onClose()
              onAddPayment({
                order_id: order.order_id,
                user_id: order.user_id,
                course_id: order.course_id,
                course_title: order.course_title,
                amount_paid: totalPaid,
              })
            }}>
              + Add Payment
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

// ─── Enrolments For Instalments ──────────────────────────────────────────────
function EnrolmentsForInstalments({
  onAddPayment
}: {
  onAddPayment: (order: { order_id: string; user_id: string; course_id: string; course_title: string; amount_paid: number }) => void
}) {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [ledgerOrder, setLedgerOrder] = useState<any | null>(null)

  const loadOrders = () => {
    const token = sessionStorage.getItem('adminToken') || ''
    const headers = { 'X-Admin-Token': token }
    Promise.all([
      fetch(`${API}/admin/orders`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/admin/users`, { headers }).then(r => r.ok ? r.json() : []),
    ])
      .then(([ordersData, usersData]) => {
        const userMap: Record<string, {name: string; email: string}> = {}
        for (const u of usersData) userMap[u.id] = { name: u.name, email: u.email }
        const enriched = (Array.isArray(ordersData) ? ordersData : [])
          .map((o: any) => ({
            ...o,
            student_name:  o.student_name  || userMap[o.user_id]?.name  || o.user_id,
            student_email: o.student_email || userMap[o.user_id]?.email || '—',
            full_amount:   Number(o.full_amount || o.amount || 0),
            amount_paid:   Number(o.amount || 0),
          }))
        setOrders(enriched)
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadOrders() }, [])

  const filtered = orders.filter(o =>
    !search ||
    String(o.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(o.student_email || '').toLowerCase().includes(search.toLowerCase()) ||
    String(o.course_title || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9" placeholder="Search by student name, email or course..." />
      </div>
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">No orders found</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {['Student', 'Email', 'Course', 'Total Price', 'Paid', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o, i) => (
                <tr key={i} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{o.student_name || o.user_id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.student_email || '—'}</td>
                  <td className="px-4 py-3 max-w-[160px] truncate" title={o.course_title}>{o.course_title || o.course_id}</td>
                  <td className="px-4 py-3 whitespace-nowrap">₹{o.course_price || o.amount}</td>
                  <td className="px-4 py-3 whitespace-nowrap">₹{o.amount_paid ?? o.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      o.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    }`}>{o.status || 'pending'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => onAddPayment({
                      order_id: o.order_id,
                      user_id: o.user_id,
                      course_id: o.course_id,
                      course_title: o.course_title || o.course_id,
                      amount_paid: o.amount_paid ?? o.amount,
                    })}>
                      + Add Payment
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


// ─── Create Instalment Plan Card ─────────────────────────────────────────────
function CreateInstalmentPlanCard({ onPlanCreated }: { onPlanCreated: (plan: any) => void }) {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const getToken = () => sessionStorage.getItem('adminToken') || ''
  const authHeaders = () => ({ 'X-Admin-Token': getToken(), 'Content-Type': 'application/json' })

  const [users, setUsers]     = useState<{id: string; name: string; email: string}[]>([])
  const [courses, setCourses] = useState<{id: string; title: string; price: number}[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [dataLoaded, setDataLoaded]   = useState(false)

  const [email, setEmail]       = useState('')
  const [courseId, setCourseId] = useState('')
  const [numInst, setNumInst]   = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Load users + courses when component mounts
  useEffect(() => {
    setLoadingData(true)
    Promise.all([
      fetch(`${API}/admin/users`, { headers: authHeaders() }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/admin/courses`, { headers: authHeaders() }).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([u, c]) => {
      setUsers(Array.isArray(u) ? u : [])
      setCourses(Array.isArray(c) ? c.map((x: any) => ({ id: x.id, title: x.title, price: Number(x.price) })) : [])
      setDataLoaded(true)
    }).finally(() => setLoadingData(false))
  }, [])

  const filteredUsers = email.length > 1
    ? users.filter(u =>
        u.email.toLowerCase().includes(email.toLowerCase()) ||
        u.name.toLowerCase().includes(email.toLowerCase())
      ).slice(0, 6)
    : []

  const selectedCourse = courses.find(c => c.id === courseId)
  const parsedNumInst = parseInt(numInst, 10)
  const emi = selectedCourse && !isNaN(parsedNumInst) && parsedNumInst >= 2 && selectedCourse.price > 0
    ? Math.round((selectedCourse.price / parsedNumInst) * 100) / 100
    : null

  const handleCreate = async () => {
    setError(''); setSuccess('')
    if (!email.trim()) { setError('Enter student email'); return }
    if (!courseId) { setError('Select a course'); return }
    if (!numInst || Number(numInst) < 2) { setError('Minimum 2 instalments'); return }

    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user) { setError(`No account found for "${email}". Student must register first.`); return }

    setSaving(true)
    try {
      const res = await fetch(`${API}/admin/instalment-plans`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ user_id: user.id, course_id: courseId, num_instalments: Number(numInst) })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.detail || `Error ${res.status}`); return }
      setSuccess(`✅ Plan created — ${data.num_instalments} × ₹${data.emi_amount} each`)
      setEmail(''); setCourseId(''); setNumInst('')
      onPlanCreated(data)
    } catch (e: any) {
      setError(`Network error: ${e?.message}`)
    } finally { setSaving(false) }
  }

  return (
    <Card className="p-5">
      <h3 className="font-bold text-base mb-1">Create Instalment Plan</h3>
      <p className="text-xs text-muted-foreground mb-4">
        After agreeing terms with a student, create a plan here. The part-payment option will appear on their checkout automatically.
      </p>

      {loadingData && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading students and courses...
        </div>
      )}

      {dataLoaded && users.length === 0 && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          ⚠️ No users found. Make sure the backend is deployed with the latest <code>admin_route.py</code> that has the <code>/admin/users</code> endpoint.
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        {/* Student Email with live dropdown */}
        <div className="relative">
          <label className="text-xs font-medium block mb-1">
            Student Email * {dataLoaded && <span className="text-muted-foreground">({users.length} users)</span>}
          </label>
          <Input
            placeholder="Type to search student..."
            value={email}
            autoComplete="off"
            onChange={e => { setEmail(e.target.value); setError(''); setSuccess(''); setShowDropdown(true) }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && filteredUsers.length > 0 && (
            <div className="absolute z-30 w-full mt-1 bg-background border border-border rounded-lg shadow-xl overflow-hidden">
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border last:border-0"
                  onMouseDown={() => { setEmail(u.email); setShowDropdown(false); setError(''); setSuccess('') }}
                >
                  <span className="font-medium block">{u.name}</span>
                  <span className="text-muted-foreground text-xs">{u.email}</span>
                </button>
              ))}
            </div>
          )}
          {showDropdown && email.length > 1 && filteredUsers.length === 0 && users.length > 0 && (
            <div className="absolute z-30 w-full mt-1 bg-background border border-border rounded-lg shadow px-3 py-2 text-xs text-muted-foreground">
              No student found
            </div>
          )}
        </div>

        {/* Course dropdown */}
        <div>
          <label className="text-xs font-medium block mb-1">
            Course * {dataLoaded && <span className="text-muted-foreground">({courses.length} courses)</span>}
          </label>
          <select
            className="w-full h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={courseId}
            onChange={e => { setCourseId(e.target.value); setError(''); setSuccess('') }}
          >
            <option value="">{courses.length === 0 ? 'Loading...' : 'Select course'}</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} — ₹{(c.price ?? 0).toLocaleString('en-IN')}
              </option>
            ))}
          </select>
        </div>

        {/* No. of Instalments */}
        <div>
          <label className="text-xs font-medium block mb-1">No. of Instalments *</label>
          <Input
            type="number" min={2} max={24}
            placeholder="e.g. 4"
            value={numInst}
            onChange={e => { setNumInst(e.target.value); setError(''); setSuccess('') }}
          />
        </div>
      </div>

      {/* EMI Preview */}
      {emi && selectedCourse && (
        <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
          <span>
            <strong>{parsedNumInst} instalments</strong> of <strong>₹{(emi ?? 0).toLocaleString('en-IN')}</strong> each
            for <strong>{selectedCourse.title}</strong>
            <span className="text-muted-foreground ml-1">(Total: ₹{(selectedCourse.price ?? 0).toLocaleString('en-IN')})</span>
          </span>
        </div>
      )}

      {error   && <p className="text-xs text-red-500 mt-3 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      {success && <p className="text-xs text-green-600 mt-3 flex items-center gap-1"><CheckCircle className="w-3 h-3" />{success}</p>}

      <Button className="mt-4" disabled={saving || loadingData} onClick={handleCreate}>
        {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : 'Create Plan'}
      </Button>
    </Card>
  )
}

// ─── Instalment Modal ─────────────────────────────────────────────────────────
function InstalmentModal({
  order, onClose, onSaved
}: {
  order: { order_id: string; user_id: string; course_id: string; course_title: string; amount_paid: number }
  onClose: () => void
  onSaved: (result: { total_paid: number; fully_paid: boolean }) => void
}) {
  const [form, setForm] = useState({ amount: '', reference: '', note: '' })
  const [history, setHistory] = useState<{ amount: number; reference: string; note: string; created_at: string }[]>([])
  const [totalPaid, setTotalPaid] = useState(order.amount_paid)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem('adminToken') || ''
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/orders/${order.order_id}/instalments`, {
      headers: { 'X-Admin-Token': token }
    })
      .then(r => r.json())
      .then(d => { setHistory(d.instalments || []); setTotalPaid(d.total_paid || 0) })
      .catch(() => {})
  }, [order.order_id])

  const handleAdd = async () => {
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) {
      toast.error('Enter a valid amount'); return
    }
    setLoading(true)
    try {
      const token = sessionStorage.getItem('adminToken') || ''
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/orders/${order.order_id}/instalments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify({ user_id: order.user_id, course_id: order.course_id, amount: +form.amount, reference: form.reference, note: form.note })
      })
      const data = await res.json()
      toast.success(data.fully_paid ? '✅ Fully paid — student enrolled!' : `Instalment recorded. Total paid: ₹${data.total_paid}`)
      setTotalPaid(data.total_paid)
      setHistory(h => [...h, { amount: +form.amount, reference: form.reference, note: form.note, created_at: new Date().toISOString() }])
      setForm({ amount: '', reference: '', note: '' })
      onSaved({ total_paid: data.total_paid, fully_paid: data.fully_paid })
    } catch {
      toast.error('Failed to record instalment')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto py-8">
      <Card className="w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Part Payment</h2>
            <p className="text-sm text-muted-foreground truncate max-w-xs">{order.course_title}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Payment history */}
        {history.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Payment History</p>
            <div className="rounded-lg border border-border overflow-hidden">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 text-sm border-b last:border-0 border-border">
                  <div>
                    <span className="font-medium">₹{h.amount}</span>
                    {h.reference && <span className="text-muted-foreground ml-2 text-xs">Ref: {h.reference}</span>}
                    {h.note && <span className="text-muted-foreground ml-2 text-xs">— {h.note}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-semibold px-1">
              <span>Total Paid</span>
              <span className="text-primary">₹{totalPaid}</span>
            </div>
          </div>
        )}

        {/* New instalment form */}
        <div className="space-y-3 pt-2 border-t border-border">
          <p className="text-sm font-medium">Record New Payment</p>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Amount (₹) *</label>
            <Input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className="mt-1" placeholder="e.g. 5000" min={1} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">UPI / Transaction Reference</label>
            <Input value={form.reference} onChange={e => setForm(f => ({...f, reference: e.target.value}))} className="mt-1" placeholder="e.g. UPI123456789" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
            <Input value={form.note} onChange={e => setForm(f => ({...f, note: e.target.value}))} className="mt-1" placeholder="e.g. 2nd instalment" />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleAdd} disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : <><Check className="w-4 h-4 mr-2" />Record Payment</>}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─── Discount Modal ──────────────────────────────────────────────────────────
function DiscountModal({ onClose, onSaved, courses }: {
  onClose: () => void; onSaved: () => void; courses: AdminCourse[]
}) {
  const [form, setForm] = useState({ code: '', type: 'percent', value: 10, max_uses: 0, course_id: '', active: true })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (form.value <= 0) { toast.error('Value must be greater than 0'); return }
    if (form.type === 'percent' && form.value > 100) { toast.error('Percentage cannot exceed 100'); return }
    setLoading(true)
    try {
      const res = await adminApi.createDiscount({
        code: form.code || undefined,
        type: form.type, value: form.value,
        max_uses: form.max_uses, course_id: form.course_id, active: form.active,
      })
      toast.success(`Discount code ${res.code} created!`)
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create discount')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <Card className="w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Generate Discount Code</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Code <span className="text-muted-foreground">(leave blank to auto-generate)</span></label>
            <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} className="mt-2 font-mono uppercase" placeholder="e.g. SAVE20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Discount Type</label>
              <div className="relative mt-2">
                <select value={form.type} onChange={e => set('type', e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-border rounded-lg bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat Amount</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Value {form.type === 'percent' ? '(%)' : '(₹)'}</label>
              <Input type="number" value={form.value} onChange={e => set('value', +e.target.value)} className="mt-2" min={1} max={form.type === 'percent' ? 100 : undefined} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Max Uses <span className="text-muted-foreground">(0 = unlimited)</span></label>
            <Input type="number" value={form.max_uses} onChange={e => set('max_uses', +e.target.value)} className="mt-2" min={0} />
          </div>
          <div>
            <label className="text-sm font-medium">Restrict to Course <span className="text-muted-foreground">(optional)</span></label>
            <div className="relative mt-2">
              <select value={form.course_id} onChange={e => set('course_id', e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-border rounded-lg bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">— All Courses —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Active immediately</span>
            <button onClick={() => set('active', !form.active)}>
              {form.active
                ? <ToggleRight className="w-8 h-8 text-primary" />
                : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleCreate} disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : <><Tag className="w-4 h-4 mr-2" />Generate Code</>}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─── Batch Modal ─────────────────────────────────────────────────────────────
function BatchModal({ batch, courses, onClose, onSaved }: {
  batch: ApiBatch | null
  courses: AdminCourse[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState(
    batch
      ? {
          course_id:   batch.course_id,
          name:        batch.name,
          start_date:  batch.start_date,
          timing:      batch.timing,
          seats_total: batch.seats_total,
          mode:        batch.mode,
          is_active:   batch.is_active,
        }
      : { ...BLANK_BATCH }
  )
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.course_id)   { toast.error('Please select a course'); return }
    if (!form.name.trim()) { toast.error('Batch name is required'); return }
    if (!form.start_date)  { toast.error('Start date is required'); return }
    if (!form.timing.trim()){ toast.error('Timing is required'); return }
    if (form.seats_total < 1){ toast.error('Seats must be at least 1'); return }

    setLoading(true)
    try {
      if (batch) {
        await adminBatchApi.update(batch.id, form)
        toast.success('Batch updated')
      } else {
        await adminBatchApi.create({ ...form, seats_filled: 0 } as any)
        toast.success('Batch created')
      }
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save batch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto py-8">
      <Card className="w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{batch ? 'Edit Batch' : 'Create New Batch'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="space-y-4">

          {/* Course */}
          <div>
            <label className="text-sm font-medium">Course *</label>
            <div className="relative mt-2">
              <select value={form.course_id} onChange={e => set('course_id', e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-border rounded-lg bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">— Select a course —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Batch name */}
          <div>
            <label className="text-sm font-medium">Batch Name *</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} className="mt-2"
              placeholder="e.g. Batch 12 – Morning" />
          </div>

          {/* Start date + Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date *</label>
              <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Mode *</label>
              <div className="relative mt-2">
                <select value={form.mode} onChange={e => set('mode', e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-border rounded-lg bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Timing */}
          <div>
            <label className="text-sm font-medium">Timing / Schedule *</label>
            <Input value={form.timing} onChange={e => set('timing', e.target.value)} className="mt-2"
              placeholder="e.g. Mon/Wed/Fri  9:00 AM – 11:00 AM" />
          </div>

          {/* Seats */}
          <div>
            <label className="text-sm font-medium">Total Seats *</label>
            <Input type="number" value={form.seats_total} onChange={e => set('seats_total', +e.target.value)}
              className="mt-2" min={1} />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Active / Visible</p>
              <p className="text-xs text-muted-foreground">Students can see and select this batch</p>
            </div>
            <button onClick={() => set('is_active', !form.is_active)}>
              {form.is_active
                ? <ToggleRight className="w-8 h-8 text-primary" />
                : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} disabled={loading}>
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
              : <><Check className="w-4 h-4 mr-2" />{batch ? 'Update' : 'Create'} Batch</>}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [authed, setAuthed]               = useState(false)
  const [checking, setChecking]           = useState(true)
  const [activeTab, setActiveTab]         = useState<Tab>('overview')
  const [stats, setStats]                 = useState<AdminStats | null>(null)
  const [courses, setCourses]             = useState<AdminCourse[]>([])
  const [enrollments, setEnrollments]     = useState<AdminEnrollment[]>([])
  const [enquiries, setEnquiries]         = useState<AdminEnquiry[]>([])
  const [discounts, setDiscounts]         = useState<AdminDiscount[]>([])
  const [batches, setBatches]             = useState<ApiBatch[]>([])
  const [loading, setLoading]             = useState(false)
  const [editCourse, setEditCourse]       = useState<AdminCourse | null | undefined>(undefined)
  const [instalments, setInstalments]     = useState<Record<string, {amount: number; reference: string; note: string; created_at: string}[]>>({})
  const [instalmentOrder, setInstalmentOrder] = useState<{order_id: string; user_id: string; course_id: string; course_title: string; amount_paid: number} | null>(null)
  const [planForm, setPlanForm] = useState({ user_email: '', course_id: '', num_instalments: '' })
  const [planUsers, setPlanUsers] = useState<{id: string; name: string; email: string}[]>([])
  const [planCourses, setPlanCourses] = useState<{id: string; title: string; price: number}[]>([])
  const [planList, setPlanList] = useState<any[]>([])
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState('')
  const [planSuccess, setPlanSuccess] = useState('')
  const [instalmentForm, setInstalmentForm]   = useState({ amount: '', reference: '', note: '' })
  const [instalmentLoading, setInstalmentLoading] = useState(false)
  const [editBatch, setEditBatch]         = useState<ApiBatch | null | undefined>(undefined)
  const [showDiscModal, setShowDiscModal] = useState(false)
  const [searchEnroll, setSearchEnroll]   = useState('')
  const [filterDiscount, setFilterDiscount] = useState('')
  const [searchEnquiry, setSearchEnquiry]   = useState('')
  const [batchCourseFilter, setBatchCourseFilter] = useState('')

  useEffect(() => {
    const t = sessionStorage.getItem('adminToken')
    if (t) setAuthed(true)
    setChecking(false)
  }, [])

  const fetchTab = useCallback(async (tab: Tab) => {
    setLoading(true)
    try {
      if (tab === 'overview') {
        setStats(await adminApi.stats())
      } else if (tab === 'courses') {
        setCourses(await adminApi.getCourses())
      } else if (tab === 'instalments') {
        // Use adminApi which has correct auth headers built in
        try {
          const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          const token = sessionStorage.getItem('adminToken') || ''
          const h = { 'X-Admin-Token': token, 'Content-Type': 'application/json' }
          
          const [coursesData, usersRes, plansRes] = await Promise.all([
            adminApi.getCourses(),
            fetch(`${API}/admin/users`, { headers: h }),
            fetch(`${API}/admin/instalment-plans`, { headers: h }),
          ])
          
          setPlanCourses((coursesData || []).map((c: any) => ({ id: c.id, title: c.title, price: Number(c.price) })))
          
          if (usersRes.ok) {
            const usersData = await usersRes.json()
            setPlanUsers((usersData || []).map((u: any) => ({ id: u.id, name: u.name, email: u.email })))
          } else {
            console.error('Users fetch failed:', usersRes.status)
          }
          
          if (plansRes.ok) {
            const plansData = await plansRes.json()
            if (Array.isArray(plansData)) setPlanList(plansData)
          }
        } catch (e) { console.error('Instalment tab load error:', e) }
      } else if (tab === 'enrollments') {
        setEnrollments(await adminApi.getEnrollments(filterDiscount || undefined))
      } else if (tab === 'enquiries') {
        setEnquiries(await adminApi.getEnquiries())
      } else if (tab === 'discounts') {
        const [d, c] = await Promise.all([adminApi.getDiscounts(), adminApi.getCourses()])
        setDiscounts(d); setCourses(c)
      } else if (tab === 'batches') {
        const [b, c] = await Promise.all([adminBatchApi.list(), adminApi.getCourses()])
        setBatches(b); setCourses(c)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load data')
      if ((err as any)?.message?.includes('401') || (err as any)?.message?.includes('token')) {
        sessionStorage.removeItem('adminToken'); setAuthed(false)
      }
    } finally {
      setLoading(false)
    }
  }, [filterDiscount])

  useEffect(() => { if (authed) fetchTab(activeTab) }, [authed, activeTab, fetchTab])

  const logout = () => { sessionStorage.removeItem('adminToken'); setAuthed(false) }

  const handleDeleteCourse = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      await adminApi.deleteCourse(id)
      toast.success('Course deleted')
      setCourses(cs => cs.filter(c => c.id !== id))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleToggleDiscount = async (code: string, currentActive: string) => {
    const next = currentActive.toLowerCase() !== 'true'
    try {
      await adminApi.toggleDiscount(code, next)
      toast.success(`Code ${next ? 'activated' : 'deactivated'}`)
      setDiscounts(ds => ds.map(d => d.code === code ? { ...d, active: next ? 'true' : 'false' } : d))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Toggle failed')
    }
  }

  const handleDeleteDiscount = async (code: string) => {
    if (!confirm(`Delete discount code "${code}"?`)) return
    try {
      await adminApi.deleteDiscount(code)
      toast.success('Discount deleted')
      setDiscounts(ds => ds.filter(d => d.code !== code))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleDeleteBatch = async (id: string, name: string) => {
    if (!confirm(`Delete batch "${name}"? This cannot be undone.`)) return
    try {
      await adminBatchApi.delete(id)
      toast.success('Batch deleted')
      setBatches(bs => bs.filter(b => b.id !== id))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleToggleBatch = async (batch: ApiBatch) => {
    const next = !batch.is_active
    try {
      await adminBatchApi.update(batch.id, { is_active: next })
      toast.success(`Batch ${next ? 'activated' : 'deactivated'}`)
      setBatches(bs => bs.map(b => b.id === batch.id ? { ...b, is_active: next } : b))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Toggle failed')
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code)
    toast.success(`Copied: ${code}`)
  }

  if (checking) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  if (!authed)  return <LoginScreen onLogin={() => setAuthed(true)} />

  const tabs = [
    { id: 'overview'     as Tab, label: 'Overview',     icon: LayoutDashboard },
    { id: 'courses'      as Tab, label: 'Courses',      icon: BookOpen },
    { id: 'batches'      as Tab, label: 'Batches',      icon: CalendarDays },
    { id: 'enrollments'  as Tab, label: 'Enrollments',  icon: Users },
    { id: 'instalments'  as Tab, label: 'Instalments',  icon: Tag },
    { id: 'enquiries'    as Tab, label: 'Enquiries',    icon: MessageSquare },
    { id: 'discounts'    as Tab, label: 'Discounts',    icon: Tag },
  ]

  const filteredEnrollments = enrollments.filter(e => {
    const q = searchEnroll.toLowerCase()
    return !q || e.student_name.toLowerCase().includes(q) || e.student_email.toLowerCase().includes(q) || e.course_title.toLowerCase().includes(q)
  })

  const filteredEnquiries = enquiries.filter(e => {
    const q = searchEnquiry.toLowerCase()
    return !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.enquiry.toLowerCase().includes(q)
  })

  const filteredBatches = batchCourseFilter
    ? batches.filter(b => b.course_id === batchCourseFilter)
    : batches

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col min-h-screen sticky top-0">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Admin Panel</p>
              <p className="text-xs text-muted-foreground">LearnHub</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-destructive" onClick={logout}>
            <LogOut className="w-4 h-4" />Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold capitalize">{activeTab}</h1>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => fetchTab(activeTab)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>

        <div className="p-8">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* ── Overview ── */}
          {!loading && activeTab === 'overview' && stats && (
            <div className="space-y-8">
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Total Students"   value={stats.total_users}       icon={Users}           color="bg-primary/10 text-primary" />
                <StatCard label="Courses"          value={stats.total_courses}     icon={BookOpen}        color="bg-secondary/10 text-secondary" />
                <StatCard label="Enrollments"      value={stats.total_enrollments} icon={Users}           color="bg-green-500/10 text-green-600" />
                <StatCard label="Paid Orders"      value={stats.total_orders}      icon={Tag}             color="bg-orange-500/10 text-orange-600" />
                <StatCard label="Revenue"          value={`₹${stats.total_revenue}`} icon={LayoutDashboard} color="bg-purple-500/10 text-purple-600" />
                <StatCard label="Enquiries"        value={stats.total_enquiries}   icon={MessageSquare}   color="bg-pink-500/10 text-pink-600" />
              </div>
              <Card className="p-6">
                <h3 className="font-bold mb-2">Quick Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Use <strong>Courses</strong> tab to add or edit courses — they appear live on the site immediately.</li>
                  <li>Use <strong>Batches</strong> tab to create upcoming batches for each course. Students pick a batch before enrolling.</li>
                  <li>Use <strong>Enrollments</strong> tab to see which students bought which courses and via what reference.</li>
                  <li>Use <strong>Discounts</strong> tab to generate or deactivate codes anytime.</li>
                </ul>
              </Card>
            </div>
          )}

          {/* ── Courses ── */}
          {!loading && activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button className="gap-2" onClick={() => setEditCourse(null)}>
                  <Plus className="w-4 h-4" />Add Course
                </Button>
              </div>

              {courses.length === 0 ? (
                <Card className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <p className="font-bold">No courses yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Click "Add Course" to create your first course.</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {courses.map(c => (
                    <Card key={c.id} className="p-5 flex items-center gap-4">
                      {c.image && <img src={c.image} alt={c.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
                      {!c.image && <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><BookOpen className="w-6 h-6 text-muted-foreground" /></div>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold truncate">{c.title}</h3>
                          {c.level && <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{c.level}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{c.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span>💰 ₹{c.price}</span>
                          {c.instructor && <span>👨‍🏫 {c.instructor}</span>}
                          {c.category && <span>📂 {c.category}</span>}
                          {c.duration && <span>⏱ {c.duration}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setEditCourse(c)}><Pencil className="w-3 h-3" /></Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteCourse(c.id, c.title)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Batches ── */}
          {!loading && activeTab === 'batches' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                {/* Course filter */}
                <div className="relative">
                  <select value={batchCourseFilter} onChange={e => setBatchCourseFilter(e.target.value)}
                    className="px-3 py-2 pr-8 border border-border rounded-lg bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[220px]">
                    <option value="">All Courses</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                <Button className="gap-2" onClick={() => setEditBatch(null)}>
                  <Plus className="w-4 h-4" />Create Batch
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">{filteredBatches.length} batch{filteredBatches.length !== 1 ? 'es' : ''}</p>

              {filteredBatches.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                  <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <p className="font-bold">No batches yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Click "Create Batch" to add your first batch.</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredBatches.map(b => {
                    const course = courses.find(c => c.id === b.course_id)
                    const seatsLeft = b.seats_total - b.seats_filled
                    const modeIcon =
                      b.mode === 'Online'  ? <Wifi className="w-3.5 h-3.5" /> :
                      b.mode === 'Offline' ? <MapPin className="w-3.5 h-3.5" /> :
                      <Monitor className="w-3.5 h-3.5" />

                    return (
                      <Card key={b.id} className={`p-5 ${!b.is_active ? 'opacity-60' : ''}`}>
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold">{b.name}</h3>
                              {!b.is_active && (
                                <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">Inactive</span>
                              )}
                            </div>

                            {course && (
                              <p className="text-sm text-primary font-medium">{course.title}</p>
                            )}

                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5" />
                                {new Date(b.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span>{b.timing}</span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
                                ${b.mode === 'Online' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                  b.mode === 'Offline' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                                  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}`}>
                                {modeIcon}{b.mode}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                ${seatsLeft <= 0 ? 'bg-red-100 text-red-600' :
                                  seatsLeft <= 5 ? 'bg-amber-100 text-amber-700' :
                                  'bg-green-100 text-green-700'}`}>
                                {b.seats_filled} / {b.seats_total} seats filled
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => handleToggleBatch(b)} title={b.is_active ? 'Deactivate' : 'Activate'}
                              className="text-muted-foreground hover:text-primary">
                              {b.is_active
                                ? <ToggleRight className="w-6 h-6 text-primary" />
                                : <ToggleLeft className="w-6 h-6" />}
                            </button>
                            <Button variant="outline" size="sm" onClick={() => setEditBatch(b)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteBatch(b.id, b.name)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Enrollments ── */}
          {!loading && activeTab === 'enrollments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={searchEnroll} onChange={e => setSearchEnroll(e.target.value)} className="pl-9" placeholder="Search by student name, email or course..." />
                </div>
                <div className="flex gap-2">
                  <Input value={filterDiscount} onChange={e => setFilterDiscount(e.target.value.toUpperCase())} className="w-44 font-mono uppercase" placeholder="Filter by code" />
                  <Button variant="outline" onClick={() => fetchTab('enrollments')}>Apply</Button>
                  {filterDiscount && <Button variant="ghost" onClick={() => { setFilterDiscount(''); fetchTab('enrollments') }}><X className="w-4 h-4" /></Button>}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">{filteredEnrollments.length} enrollment{filteredEnrollments.length !== 1 ? 's' : ''}</div>

              {filteredEnrollments.length === 0 ? (
                <Card className="p-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <p className="text-muted-foreground">No enrollments found</p>
                </Card>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {['Student','Email','Course','Paid','Discount','Reference','Progress','Enrolled'].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredEnrollments.map((e, i) => (
                        <tr key={i} className="hover:bg-muted/40">
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{e.student_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{e.student_email}</td>
                          <td className="px-4 py-3 whitespace-nowrap max-w-[180px] truncate" title={e.course_title}>{e.course_title}</td>
                          <td className="px-4 py-3 whitespace-nowrap">₹{e.amount_paid}</td>
                          <td className="px-4 py-3">
                            {e.discount_code
                              ? <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded font-mono text-xs">{e.discount_code}</span>
                              : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{e.reference || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(Number(e.progress), 100)}%` }} />
                              </div>
                              <span className="text-xs">{e.progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                            {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Instalments ── */}
          {!loading && activeTab === 'instalments' && (
            <div className="space-y-6">

              {/* ── Create New Instalment Plan ── */}
              <CreateInstalmentPlanCard
                onPlanCreated={(plan) => setPlanList(l => [plan, ...l])}
              />
                  onClick={async () => {
                    setPlanError(''); setPlanSuccess('')

                    // Validate fields
                    if (!planForm.user_email.trim()) { setPlanError('Please enter student email'); return }
                    if (!planForm.course_id) { setPlanError('Please select a course'); return }
                    if (!planForm.num_instalments || Number(planForm.num_instalments) < 2) { setPlanError('Minimum 2 instalments required'); return }

                    // Look up user fresh from backend at submit time (don't rely on cached list)
                    let user = planUsers.find(u => u.email.toLowerCase() === planForm.user_email.trim().toLowerCase())
                    if (!user) {
                      // Try fetching fresh from backend
                      try {
                        const uRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/users`, {
                          headers: { 'X-Admin-Token': sessionStorage.getItem('adminToken') || '' }
                        })
                        if (uRes.ok) {
                          const freshUsers = await uRes.json()
                          setPlanUsers(freshUsers.map((u: any) => ({ id: u.id, name: u.name, email: u.email })))
                          user = freshUsers.find((u: any) => u.email.toLowerCase() === planForm.user_email.trim().toLowerCase())
                        }
                      } catch {}
                    }
                    if (!user) {
                      setPlanError(`Student email not found. Make sure they have registered an account first.`)
                      return
                    }

                    setPlanLoading(true)
                    try {
                      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
                      const adminToken = sessionStorage.getItem('adminToken') || ''
                      const headers = { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken }

                      const res = await fetch(`${API}/admin/instalment-plans`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                          user_id: user.id,
                          course_id: planForm.course_id,
                          num_instalments: Number(planForm.num_instalments)
                        })
                      })

                      let data: any = {}
                      try { data = await res.json() } catch {}

                      if (!res.ok) {
                        setPlanError(data.detail || `Server error ${res.status}. Check that 'instalment_plans' sheet exists in Google Sheets.`)
                        return
                      }

                      setPlanSuccess(`✅ Plan created! ${data.num_instalments} instalments of ₹${data.emi_amount} each.`)
                      setPlanForm({ user_email: '', course_id: '', num_instalments: '' })

                      // Refresh plan list
                      const pRes = await fetch(`${API}/admin/instalment-plans`, { headers: { 'X-Admin-Token': adminToken } })
                      if (pRes.ok) setPlanList(await pRes.json())
                    } catch (e: any) {
                      setPlanError(`Network error: ${e?.message || 'Try again'}`)
                    } finally {
                      setPlanLoading(false)
                    }
                  }}


              {/* ── Existing Plans ── */}
              {planList.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm mb-3">Active Instalment Plans</h3>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {['Student', 'Email', 'Course', 'Instalments', 'EMI Amount', 'Total', 'Created', ''].map(h => (
                            <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {planList.map((p, i) => (
                          <tr key={i} className="hover:bg-muted/40">
                            <td className="px-4 py-3 font-medium whitespace-nowrap">{p.student_name}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{p.student_email}</td>
                            <td className="px-4 py-3 max-w-[150px] truncate" title={p.course_title}>{p.course_title}</td>
                            <td className="px-4 py-3 text-center">{p.num_instalments}</td>
                            <td className="px-4 py-3 font-medium">₹{Number(p.emi_amount).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3">₹{Number(p.course_price).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                            <td className="px-4 py-3">
                              <Button size="sm" variant="destructive" onClick={async () => {
                                const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
                                const adminToken = sessionStorage.getItem('adminToken') || ''
                                await fetch(`${API}/admin/instalment-plans/${p.plan_id}`, { method: 'DELETE', headers: { 'X-Admin-Token': adminToken || '' } })
                                setPlanList(pl => pl.filter(x => x.plan_id !== p.plan_id))
                                toast.success('Plan removed')
                              }}>Remove</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Record Payments ── */}
              <div>
                <h3 className="font-bold text-sm mb-3">Record Instalment Payments</h3>
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200 mb-3">
                  Find the student's order below and click <strong>+ Add Payment</strong> each time they pay an instalment.
                </div>
                <EnrolmentsForInstalments onAddPayment={setInstalmentOrder} />
              </div>
            </div>
          )}
          {instalmentOrder && (
            <InstalmentModal
              order={instalmentOrder}
              onClose={() => setInstalmentOrder(null)}
              onSaved={() => setInstalmentOrder(null)}
            />
          )}

          {/* ── Enquiries ── */}
          {!loading && activeTab === 'enquiries' && (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={searchEnquiry} onChange={e => setSearchEnquiry(e.target.value)} className="pl-9" placeholder="Search by name, email or message..." />
              </div>

              <div className="text-sm text-muted-foreground">{filteredEnquiries.length} enquir{filteredEnquiries.length !== 1 ? 'ies' : 'y'}</div>

              {filteredEnquiries.length === 0 ? (
                <Card className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <p className="text-muted-foreground">No enquiries found</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredEnquiries.map((e, i) => (
                    <Card key={i} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-bold">{e.name}</span>
                            <span className="text-sm text-muted-foreground">Age {e.age}</span>
                            {e.reference && (
                              <span className="text-xs px-2 py-0.5 bg-secondary/20 text-secondary rounded-full">via {e.reference}</span>
                            )}
                          </div>
                          <div className="flex gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                            <span>📧 {e.email}</span>
                            <span>📱 {e.mobile}</span>
                          </div>
                          <p className="mt-3 text-sm bg-muted rounded-lg p-3">{e.enquiry}</p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {e.submitted_at ? new Date(e.submitted_at).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Discounts ── */}
          {!loading && activeTab === 'discounts' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button className="gap-2" onClick={() => setShowDiscModal(true)}>
                  <Plus className="w-4 h-4" />Generate Code
                </Button>
              </div>

              {discounts.length === 0 ? (
                <Card className="p-12 text-center">
                  <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <p className="font-bold">No discount codes yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Click "Generate Code" to create your first discount.</p>
                </Card>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {['Code','Type','Value','Used / Limit','Course','Status','Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {discounts.map((d, i) => {
                        const isActive = d.active?.toString().toLowerCase() === 'true'
                        const course   = courses.find(c => c.id === d.course_id)
                        return (
                          <tr key={i} className={`hover:bg-muted/40 ${!isActive ? 'opacity-50' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-primary">{d.code}</span>
                                <button onClick={() => copyCode(d.code)} className="text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
                              </div>
                            </td>
                            <td className="px-4 py-3 capitalize">{d.type}</td>
                            <td className="px-4 py-3 font-medium">
                              {d.type === 'percent' ? `${d.value}%` : `₹${d.value}`}
                            </td>
                            <td className="px-4 py-3">
                              {d.times_used ?? d.used} / {d.max_uses === 0 ? '∞' : d.max_uses}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {course ? <span className="truncate max-w-[120px] block" title={course.title}>{course.title}</span> : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-muted text-muted-foreground'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button onClick={() => handleToggleDiscount(d.code, d.active)} title={isActive ? 'Deactivate' : 'Activate'}
                                  className="text-muted-foreground hover:text-primary">
                                  {isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                </button>
                                <button onClick={() => handleDeleteDiscount(d.code)} className="text-muted-foreground hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {editCourse !== undefined && (
        <CourseModal
          course={editCourse}
          onClose={() => setEditCourse(undefined)}
          onSaved={() => { setEditCourse(undefined); fetchTab('courses') }}
        />
      )}
      {editBatch !== undefined && (
        <BatchModal
          batch={editBatch}
          courses={courses}
          onClose={() => setEditBatch(undefined)}
          onSaved={() => { setEditBatch(undefined); fetchTab('batches') }}
        />
      )}
      {showDiscModal && (
        <DiscountModal
          courses={courses}
          onClose={() => setShowDiscModal(false)}
          onSaved={() => { setShowDiscModal(false); fetchTab('discounts') }}
        />
      )}
    </div>
  )
}
