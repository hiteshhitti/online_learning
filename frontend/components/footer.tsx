'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, Send, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { enquiryApi } from '@/lib/api'
import { toast } from 'sonner'

function QuickEnquiry() {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', enquiry: '', reference: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.mobile || !form.enquiry) {
      toast.error('Please fill in all fields')
      return
    }
    if (!form.email.includes('@')) { toast.error('Please enter a valid email'); return }
    setLoading(true)
    try {
      await enquiryApi.submit({ name: form.name, age: 0, email: form.email, mobile: form.mobile, enquiry: form.enquiry, reference: form.reference })
      setDone(true)
      toast.success('Enquiry sent!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send enquiry')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
        <CheckCircle className="w-10 h-10 text-green-500" />
        <p className="font-semibold text-sm">Enquiry received!</p>
        <p className="text-xs text-muted-foreground">We'll get back to you within 24–48 hours.</p>
        <Button size="sm" variant="outline" onClick={() => { setDone(false); setForm({ name: '', email: '', mobile: '', enquiry: '', reference: '' }) }}>
          Send Another
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Your name"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className="bg-background/10 border-border/40 placeholder:text-muted-foreground text-sm"
      />
      <Input
        type="email"
        placeholder="Email address"
        value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        className="bg-background/10 border-border/40 placeholder:text-muted-foreground text-sm"
      />
      <Input
        type="tel"
        placeholder="Mobile number"
        value={form.mobile}
        onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
        className="bg-background/10 border-border/40 placeholder:text-muted-foreground text-sm"
      />
      <textarea
        placeholder="Your enquiry..."
        value={form.enquiry}
        onChange={e => setForm(f => ({ ...f, enquiry: e.target.value }))}
        rows={3}
        className="w-full px-3 py-2 border border-border/40 rounded-lg bg-background/10 text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <Button className="w-full gap-2" size="sm" onClick={handleSubmit} disabled={loading}>
        {loading ? <><Loader2 className="w-3 h-3 animate-spin" />Sending...</> : <><Send className="w-3 h-3" />Send Enquiry</>}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Or <Link href="/enquiry" className="text-primary hover:underline">open full enquiry form →</Link>
      </p>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="bg-muted mt-16 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Company Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">L</span>
              </div>
              <span className="font-bold text-lg">LearnHub</span>
            </div>
            <p className="text-sm text-muted-foreground">Empowering learners worldwide with quality education and expert instruction.</p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <Link key={i} href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/courses" className="text-muted-foreground hover:text-primary transition-colors">All Courses</Link></li>
              <li><Link href="/live-classes" className="text-muted-foreground hover:text-primary transition-colors">Live Classes</Link></li>
              <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link href="/my-courses" className="text-muted-foreground hover:text-primary transition-colors">My Courses</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/enquiry" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/enquiry" className="text-muted-foreground hover:text-primary transition-colors">Send Enquiry</Link></li>
              <li><Link href="/live-classes" className="text-muted-foreground hover:text-primary transition-colors">Live Help</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2 items-start text-muted-foreground"><Mail className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>uitcec@gmail.com</span></li>
              <li className="flex gap-2 items-start text-muted-foreground"><Phone className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>+91 82647 69689</span></li>
              <li className="flex gap-2 items-start text-muted-foreground"><MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>Mohali, Punjab</span></li>
            </ul>
          </div>

          {/* Quick Enquiry Form */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Quick Enquiry</h3>
            <QuickEnquiry />
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2026 LearnHub. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="/enquiry" className="hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
