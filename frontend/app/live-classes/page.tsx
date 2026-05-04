'use client'

import { useState } from 'react'
import { Calendar, Clock, Users, Video, ArrowRight, X, Bell, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

// No dummy live-class data — section shows empty state until admin feeds real sessions via API
type LiveClass = {
  id: string; title: string; instructor: string; date: string
  time: string; duration: string; participants: number
  status: 'live' | 'upcoming'; category: string
}

function NotifyModal({ liveClass, onClose }: { liveClass: LiveClass; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const handleNotify = () => {
    if (!email || !email.includes('@')) { toast.error('Please enter a valid email'); return }
    setDone(true)
    toast.success(`Reminder set for "${liveClass.title}"!`)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <Card className="w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-primary" />Notify Me</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        {done ? (
          <div className="text-center py-4 space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-medium">You're on the list!</p>
            <p className="text-sm text-muted-foreground">Reminder will be sent to <strong>{email}</strong></p>
            <Button className="w-full" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <>
            <div className="bg-muted rounded-lg p-4 text-sm">
              <p className="font-semibold">{liveClass.title}</p>
              <p className="text-muted-foreground">by {liveClass.instructor} · {liveClass.date} at {liveClass.time}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Your Email</label>
              <Input className="mt-2" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleNotify()} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" onClick={handleNotify}>Notify Me</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

function JoinModal({ liveClass, onClose }: { liveClass: LiveClass; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <Card className="w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2"><Video className="w-5 h-5 text-destructive" />Join Live</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-destructive rounded-full animate-pulse inline-block" />
            <span className="text-xs font-bold text-destructive uppercase">Live Now</span>
          </div>
          <p className="font-semibold">{liveClass.title}</p>
          <p className="text-sm text-muted-foreground">by {liveClass.instructor} · {liveClass.participants} watching</p>
        </div>
        <p className="text-sm text-muted-foreground">Ensure your audio/video is ready and you're in a quiet environment.</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Not Now</Button>
          <Button className="flex-1 bg-destructive hover:bg-destructive/90 gap-2" onClick={() => { toast.success('Joining session...'); onClose() }}>
            <ArrowRight className="w-4 h-4" />Join Now
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function LiveClassesPage() {
  const [notifyClass, setNotifyClass] = useState<LiveClass | null>(null)
  const [joinClass, setJoinClass] = useState<LiveClass | null>(null)
  const [notified, setNotified] = useState<Set<string>>(new Set())

  // No hardcoded dummy classes — show empty state
  const liveClasses: LiveClass[] = []
  const liveNow = liveClasses.filter(c => c.status === 'live')
  const upcoming = liveClasses.filter(c => c.status === 'upcoming')

  return (
    <main className="min-h-screen pt-24 pb-12">
      {notifyClass && <NotifyModal liveClass={notifyClass} onClose={() => { setNotified(s => new Set(s).add(notifyClass.id)); setNotifyClass(null) }} />}
      {joinClass   && <JoinModal   liveClass={joinClass}   onClose={() => setJoinClass(null)} />}

      <section className="py-8 px-4 border-b border-border bg-card">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">Live Classes</h1>
          <p className="text-muted-foreground mt-1">Join live sessions with instructors and interact with peers</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {liveNow.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Live Now</h2>
            {liveNow.map(lc => (
              <Card key={lc.id} className="p-6 flex items-center justify-between gap-6 border-2 border-destructive/50 bg-destructive/5">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Video className="w-7 h-7 text-primary" />
                    <div className="absolute top-1 right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-destructive uppercase">Live Now</span>
                    <h3 className="font-bold">{lc.title}</h3>
                    <p className="text-sm text-muted-foreground">by {lc.instructor} · <Users className="w-3 h-3 inline" /> {lc.participants}</p>
                  </div>
                </div>
                <Button className="bg-destructive hover:bg-destructive/90 gap-2 flex-shrink-0" onClick={() => setJoinClass(lc)}>
                  Join Now <ArrowRight className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-6">Upcoming Classes</h2>
          {upcoming.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {upcoming.map(lc => (
                <Card key={lc.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-28 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
                    <Video className="w-10 h-10 text-primary opacity-40" />
                    <span className="absolute top-4 right-4 px-2 py-1 bg-secondary/20 text-secondary rounded text-xs font-semibold">{lc.category}</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-bold">{lc.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">by {lc.instructor}</p>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{lc.date}</div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{lc.time} · {lc.duration}</div>
                      <div className="flex items-center gap-2"><Users className="w-4 h-4" />{lc.participants} registered</div>
                    </div>
                    {notified.has(lc.id) ? (
                      <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" disabled>
                        <CheckCircle className="w-4 h-4" />Reminder Set
                      </Button>
                    ) : (
                      <Button className="w-full gap-2" variant="outline" onClick={() => setNotifyClass(lc)}>
                        <Bell className="w-4 h-4" />Notify Me
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="font-bold text-lg mb-2">No Upcoming Classes</h3>
              <p className="text-muted-foreground">Live classes will be listed here once scheduled. Check back soon!</p>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
