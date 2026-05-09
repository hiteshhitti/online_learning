'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMemberAuth } from '@/context/MemberAuthContext'
import { memberApi, MemberStats, MemberReferral } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Copy, LogOut, TrendingUp, Users, Clock, CheckCircle2, Star } from 'lucide-react'

export default function MemberDashboardPage() {
  const router = useRouter()
  const { member, isLoggedIn, loading: authLoading, logout } = useMemberAuth()

  const [stats, setStats]             = useState<MemberStats | null>(null)
  const [referrals, setReferrals]     = useState<MemberReferral[]>([])
  const [subReferrals, setSubReferrals] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push('/member/login')
  }, [authLoading, isLoggedIn, router])

  useEffect(() => {
    if (!isLoggedIn) return
    setDataLoading(true)
    Promise.all([memberApi.stats(), memberApi.referrals(), memberApi.subReferrals()])
      .then(([s, r, sr]) => { setStats(s); setReferrals(r); setSubReferrals(sr) })
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
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Users className="w-4 h-4"/>}      label="Student referrals"  value={stats?.total_referrals ?? 0} />
              <StatCard icon={<TrendingUp className="w-4 h-4"/>} label="Total earned"        value={`₹${stats?.total_earned?.toLocaleString('en-IN') ?? 0}`} />
              <StatCard icon={<Clock className="w-4 h-4"/>}      label="Pending payout"      value={`₹${stats?.pending_payout?.toLocaleString('en-IN') ?? 0}`} warn />
              <StatCard icon={<CheckCircle2 className="w-4 h-4"/>} label="Paid out"          value={`₹${stats?.paid_out?.toLocaleString('en-IN') ?? 0}`} success />
            </div>

            {/* 2-tier stats row */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<Star className="w-4 h-4"/>}
                label="Members you recruited"
                value={stats?.sub_members_count ?? 0}
                info
              />
              <StatCard
                icon={<TrendingUp className="w-4 h-4"/>}
                label="Bonus earned"
                value={`₹${stats?.bonus_earned?.toLocaleString('en-IN') ?? 0}`}
                info
              />
            </div>
            {(stats?.sub_members_count ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground -mt-4">
                💡 Refer other members using your referral link — you earn bonus commission every time their students enroll.
              </p>
            )}
          </>
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
                      <td className="px-4 py-3 text-right">₹{Number(r.order_amount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{Number(r.commission_earned).toLocaleString('en-IN')}</td>
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

        {/* Sub-member referrals section — only shown if this member has recruited others */}
        {(stats?.sub_members_count ?? 0) > 0 && (
          <div>
            <h2 className="text-base font-medium mb-1">Sales by your recruited members</h2>
            <p className="text-xs text-muted-foreground mb-4">
              You recruited <strong>{stats?.sub_members_count}</strong> member{(stats?.sub_members_count ?? 0) > 1 ? 's' : ''}.
              You earn <strong>5% bonus</strong> on every sale they make.
            </p>
            {dataLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />Loading...
              </div>
            ) : subReferrals.length === 0 ? (
              <div className="border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
                None of your recruited members have made sales yet.
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Recruited member</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Course</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Sale amount</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Your 5% bonus</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subReferrals.map((r: any, idx: number) => (
                      <tr key={r.id ?? idx} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">
                          {r.sub_member_name}
                          <code className="ml-1.5 text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.sub_member_coupon}</code>
                        </td>
                        <td className="px-4 py-3">{r.student_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.course_title}</td>
                        <td className="px-4 py-3 text-right">₹{Number(r.order_amount).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-medium text-purple-700 dark:text-purple-400">
                          ₹{Number(r.parent_bonus).toLocaleString('en-IN')}
                        </td>
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
        )}

      </div>
    </div>
  )
}

function StatCard({ icon, label, value, warn, success, info }: {
  icon: React.ReactNode; label: string; value: string | number; warn?: boolean; success?: boolean; info?: boolean
}) {
  const color = warn ? 'text-amber-600' : success ? 'text-green-600' : info ? 'text-purple-600' : 'text-muted-foreground'
  const valueColor = warn ? 'text-amber-700 dark:text-amber-400' : success ? 'text-green-700 dark:text-green-400' : info ? 'text-purple-700 dark:text-purple-400' : ''
  return (
    <div className="border border-border rounded-xl p-4">
      <div className={`flex items-center gap-1.5 text-xs mb-2 ${color}`}>
        {icon}{label}
      </div>
      <p className={`text-xl font-medium ${valueColor}`}>
        {value}
      </p>
    </div>
  )
}
