'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, Send, MessageSquare, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { enquiryApi } from '@/lib/api'
import { toast } from 'sonner'

const REFERENCE_OPTIONS = [
  '', 'Google Search', 'Friend / Referral', 'Social Media (Instagram)',
  'Social Media (Facebook)', 'Social Media (LinkedIn)', 'YouTube',
  'WhatsApp / Telegram Group', 'College / University', 'Newspaper / Magazine', 'Other'
]

export default function EnquiryPage() {
  const [form, setForm] = useState({ name: '', age: '', email: '', mobile: '', enquiry: '', reference: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())                                                     e.name    = 'Name is required'
    if (!form.age || isNaN(Number(form.age)) || +form.age < 1 || +form.age > 120) e.age = 'Enter a valid age'
    if (!form.email || !form.email.includes('@'))                               e.email   = 'Valid email required'
    if (!form.mobile || form.mobile.replace(/\D/g, '').length < 7)             e.mobile  = 'Valid mobile number required'
    if (!form.enquiry.trim() || form.enquiry.trim().length < 10)               e.enquiry = 'Please write at least 10 characters'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setLoading(true)
    try {
      await enquiryApi.submit({
        name: form.name.trim(), age: Number(form.age),
        email: form.email.trim(), mobile: form.mobile.trim(),
        enquiry: form.enquiry.trim(), reference: form.reference,
      })
      setSuccess(true)
      toast.success("Enquiry submitted! We'll get back to you soon.")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit enquiry.')
    } finally {
      setLoading(false)
    }
  }

  const f = (key: keyof typeof form, label: string, type = 'text', placeholder = '', extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Input type={type} placeholder={placeholder} value={form[key]}
        onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })) }}
        className={`mt-2 ${errors[key] ? 'border-destructive' : ''}`} {...extra} />
      {errors[key] && <p className="text-xs text-destructive mt-1">{errors[key]}</p>}
    </div>
  )

  if (success) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-10 text-center space-y-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold">Thank You!</h2>
          <p className="text-muted-foreground">Your enquiry has been received. Our team will get back to you within 24–48 hours.</p>
          <Button className="w-full" onClick={() => { setSuccess(false); setForm({ name: '', age: '', email: '', mobile: '', enquiry: '', reference: '' }) }}>
            Submit Another Enquiry
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <section className="py-8 px-4 border-b border-border bg-card mb-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Contact & Enquiry</h1>
          </div>
          <p className="text-muted-foreground">Have a question about our courses? Send us an enquiry and we'll respond promptly.</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Info */}
          <div className="space-y-6">
            {[
              { icon: '📧', title: 'Email', info: 'hello@learnhub.com' },
              { icon: '📞', title: 'Phone', info: '+1 (555) 123-4567' },
              { icon: '⏰', title: 'Response Time', info: 'Within 24–48 hours' },
            ].map(({ icon, title, info }) => (
              <Card key={title} className="p-4">
                <div className="text-2xl mb-2">{icon}</div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-sm text-muted-foreground">{info}</p>
              </Card>
            ))}
          </div>

          {/* Form */}
          <Card className="md:col-span-2 p-6 space-y-5">
            <h2 className="text-xl font-bold">Send Your Enquiry</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              {f('name', 'Full Name *', 'text', 'John Doe')}
              {f('age',  'Age *',       'number', '25', { min: 1, max: 120 })}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {f('email',  'Email Address *', 'email', 'john@example.com')}
              {f('mobile', 'Mobile Number *', 'tel',   '+91 98765 43210')}
            </div>

            {/* Reference */}
            <div>
              <label className="text-sm font-medium">How did you hear about us? <span className="text-muted-foreground">(optional)</span></label>
              <div className="relative mt-2">
                <select
                  value={form.reference}
                  onChange={e => setForm(p => ({ ...p, reference: e.target.value }))}
                  className="w-full px-3 py-2 pr-8 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                >
                  {REFERENCE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt || '— Select source —'}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Your Enquiry *</label>
              <textarea
                placeholder="Write your question or message here (minimum 10 characters)..."
                value={form.enquiry}
                onChange={e => { setForm(p => ({ ...p, enquiry: e.target.value })); setErrors(er => ({ ...er, enquiry: '' })) }}
                rows={5}
                className={`w-full mt-2 px-3 py-2 border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.enquiry ? 'border-destructive' : 'border-border'}`}
              />
              <div className="flex justify-between mt-1">
                {errors.enquiry ? <p className="text-xs text-destructive">{errors.enquiry}</p> : <span />}
                <p className="text-xs text-muted-foreground">{form.enquiry.length} chars</p>
              </div>
            </div>

            <Button className="w-full gap-2" size="lg" onClick={handleSubmit} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <><Send className="w-4 h-4" />Submit Enquiry</>}
            </Button>
          </Card>
        </div>
      </div>
    </main>
  )
}
