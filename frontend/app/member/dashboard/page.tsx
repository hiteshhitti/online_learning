'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMemberAuth } from '@/context/MemberAuthContext'
import { memberApi, MemberStats, MemberReferral } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Copy, LogOut, TrendingUp, Users, Clock, CheckCircle2 } from 'lucide-react'

export default function MemberDashboardPage() {
  const router = useRouter()
  const { member, isLoggedIn, loading: authLoading, logout } = useMemberAuth()

  const [stats, setStats]         = useState<MemberStats | null>(null)
  const [referrals, setReferrals] = useState<MemberReferral[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push('/member/login')
  }, [authLoading, isLoggedIn, router])

  useEffect(() => {
    if (!isLoggedIn) return
    setDataLoading(true)
    Promise.all([memberApi.stats(), memberApi.referrals()])
      .then(([s, r]) => { setStats(s); setReferrals(r) })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setDataLoading(false))
  }, [isLoggedIn])

  const copyCode = () => {
    if (!stats?.coupon_code) return
    navigator.clipboard.writeText(stats.coupon_code)
    toast.success('Coupon code copied!')
  }

  const handleLogout = () => {
    logout()
    router.push('/member/login')
  }

  if (authLoading || (!isLoggedIn && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">{member?.name}</h1>
          <p className="text-sm text-muted-foreground">{member?.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />Logout
        </Button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Coupon code card */}
        <div className="border border-border rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Your referral code</p>
            <p className="text-2xl font-medium font-mono tracking-wide">{stats?.coupon_code || member?.coupon_code}</p>
            <p className="text-xs text-muted-foreground mt-1">Commission rate: {stats?.commission_rate ?? member?.commission_rate}%</p>
          </div>
          <Button variant="outline" onClick={copyCode}>
            <Copy className="w-4 h-4 mr-2" />Copy code
          </Button>
        </div>

        {/* Stats grid */}
        {dataLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />Loading stats...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users className="w-4 h-4"/>}  label="Total referrals"   value={stats?.total_referrals ?? 0} />
            <StatCard icon={<TrendingUp className="w-4 h-4"/>} label="Total earned"  value={`₹${stats?.total_earned?.toLocaleString() ?? 0}`} />
            <StatCard icon={<Clock className="w-4 h-4"/>}   label="Pending payout"   value={`₹${stats?.pending_payout?.toLocaleString() ?? 0}`} warn />
            <StatCard icon={<CheckCircle2 className="w-4 h-4"/>} label="Paid out"    value={`₹${stats?.paid_out?.toLocaleString() ?? 0}`} success />
          </div>
        )}

        {/* Referral table */}
        <div>
          <h2 className="text-base font-medium mb-4">Your referrals</h2>
          {dataLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading...
            </div>
          ) : referrals.length === 0 ? (
            <div className="border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
              No referrals yet. Share your code to get started!
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Course</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount paid</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Commission</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r, idx) => (
                    <tr key={r.id ?? idx} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">{r.student_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.course_title}</td>
                      <td className="px-4 py-3 text-right">₹{Number(r.order_amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{Number(r.commission_earned).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.payout_status === 'paid'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {r.payout_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, warn, success }: {
  icon: React.ReactNode; label: string; value: string | number; warn?: boolean; success?: boolean
}) {
  return (
    <div className="border border-border rounded-xl p-4">
      <div className={`flex items-center gap-1.5 text-xs mb-2 ${warn ? 'text-amber-600' : success ? 'text-green-600' : 'text-muted-foreground'}`}>
        {icon}{label}
      </div>
      <p className={`text-xl font-medium ${warn ? 'text-amber-700 dark:text-amber-400' : success ? 'text-green-700 dark:text-green-400' : ''}`}>
        {value}
      </p>
    </div>
  )
}
