'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Lock, Loader2, CheckCircle, Tag, X,
  ChevronDown, AlertCircle, CalendarDays, Wifi, MapPin, Monitor,
  Timer, Shield, IndianRupee, QrCode, Copy, CheckCheck, Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { coursesApi, ApiCourse, ordersApi, DiscountResult, batchesApi, ApiBatch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { createCashfreeOrder, openCashfreeCheckout } from '@/lib/cashfree'
import { createRazorpayOrder, openRazorpayCheckout, verifyRazorpayPayment } from '@/lib/razorpay'

// ── Payment Config ─────────────────────────────────────────────────────────────
// Set ONE flag to true. Priority: useRazorpay > useCashfree > QR/UPI
const QR_CONFIG = {
  upiId:        '9041680789-1@okbizaxis',
  name:         'ultimate institute of technologies',
  qrImageUrl:   '/qr.png',
  whatsappNumber: '9041680789',
  useCashfree:  false,   // flip true when Cashfree is approved
  useRazorpay:  true,    // ← ACTIVE NOW
}
// ─────────────────────────────────────────────────────────────────────────────

const REFERENCE_OPTIONS = [
  '', 'Google Search', 'Friend / Referral', 'Social Media (Instagram)',
  'Social Media (Facebook)', 'Social Media (LinkedIn)', 'YouTube',
  'WhatsApp / Telegram Group', 'College / University', 'Newspaper / Magazine', 'Other'
]

function BatchMini({ batch }: { batch: ApiBatch }) {
  const modeIcon =
    batch.mode === 'Online' ? <Wifi className="w-3 h-3" /> :
    batch.mode === 'Offline' ? <MapPin className="w-3 h-3" /> :
    <Monitor className="w-3 h-3" />

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
      <CalendarDays className="w-4 h-4 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{batch.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Timer className="w-3 h-3" />{batch.timing}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            {modeIcon}{batch.mode}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground">
        {new Date(batch.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </span>
    </div>
  )
}

function CheckoutForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const courseId = searchParams.get('courseId')
  const batchId = searchParams.get('batchId')
  const { user, isLoggedIn } = useAuth()

  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [batch, setBatch] = useState<ApiBatch | null>(null)
  const [courseLoading, setCourseLoading] = useState(true)
  const [discount, setDiscount] = useState<DiscountResult | null>(null)
  const [discountCode, setDiscountCode] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '',
    agreed: true,
    reference: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [upiCopied, setUpiCopied] = useState(false)
  const [qrConfirmed, setQrConfirmed] = useState(false)
  const [paymentType, setPaymentType] = useState<'full' | 'part'>('full')
  const [instalmentPlan, setInstalmentPlan] = useState<{
    enabled: boolean; num_instalments: number; emi_amount: number; total_price: number; plan_id: string
  } | null>(null)

  // Redirect back to course if no batch selected
  useEffect(() => {
    if (!batchId && courseId) {
      toast.error('Please select a batch before checking out')
      router.replace(`/courses/${courseId}#batches`)
    }
  }, [batchId, courseId, router])

  useEffect(() => {
    if (!courseId) { setCourseLoading(false); return }
    Promise.all([
      coursesApi.get(courseId),
      batchId ? batchesApi.listByCourse(courseId).then(bs => bs.find(b => b.id === batchId) ?? null) : Promise.resolve(null),
    ])
      .then(([c, b]) => { setCourse(c); setBatch(b) })
      .catch(() => setCourse(null))
      .finally(() => setCourseLoading(false))
  }, [courseId, batchId])

  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: f.name || user.name || '', email: f.email || user.email || '' }))
  }, [user])

  // Check if admin has enabled part payment for this user+course
  useEffect(() => {
    if (!user?.id || !courseId) return
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    fetch(`${API}/admin/instalment-plans/check?user_id=${user.id}&course_id=${courseId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.enabled) setInstalmentPlan(data) })
      .catch(() => {})
  }, [user, courseId])

  const subtotal    = course ? course.price : 0
  const tax         = course ? +(course.price * 0.0).toFixed(2) : 0
  const baseTotal   = course ? +(subtotal + tax).toFixed(2) : 0
  const discountAmt = discount?.valid ? discount.discount_amount : 0
  const fullTotal   = Math.max(+(baseTotal - discountAmt).toFixed(2), 0)
  const emiAmount   = instalmentPlan ? instalmentPlan.emi_amount : 0
  const finalTotal  = paymentType === 'part' && instalmentPlan ? emiAmount : fullTotal

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) { toast.error('Enter a discount code first'); return }
    if (!course) return
    setDiscountLoading(true)
    try {
      const result = await ordersApi.validateDiscount(discountCode.trim(), course.id, baseTotal)
      setDiscount(result)
      if (result.valid) toast.success(result.message)
      else toast.error(result.message)
    } catch {
      toast.error('Could not validate code. Try again.')
    } finally {
      setDiscountLoading(false)
    }
  }

  const removeDiscount = () => { setDiscount(null); setDiscountCode('') }

  const copyUpi = () => {
    navigator.clipboard.writeText(QR_CONFIG.upiId)
    setUpiCopied(true)
    setTimeout(() => setUpiCopied(false), 2500)
    toast.success('UPI ID copied!')
  }

  const handleQrConfirm = async () => {
    if (!isLoggedIn) { toast.error('Please sign in first'); return }
    if (!course) return
    if (!batchId) { toast.error('No batch selected'); return }
    if (!form.name || !form.email) { toast.error('Please fill in your name and email'); return }
    if (!form.agreed) { toast.error('Please accept the terms to continue'); return }

    setLoading(true)
    try {
      // Create a pending order in your DB
      await ordersApi.create({
        user_id: user!.id,
        course_id: course.id,
        amount: finalTotal,
        full_amount: fullTotal,
        payment_type: paymentType,
        discount_code: discount?.valid ? discount.code : undefined,
        batch_id: batchId || undefined,
        discount_amount: discountAmt,
        reference: form.reference || undefined,
      })
      setQrConfirmed(true)
      toast.success('Order recorded! Please complete payment via UPI.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not record order. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!isLoggedIn) { toast.error('Please sign in to complete your purchase'); return }
    if (!course) return
    if (!batchId) {
      toast.error('No batch selected. Redirecting...')
      router.replace(`/courses/${courseId}#batches`)
      return
    }
    if (!form.name || !form.email) { toast.error('Please fill in your name and email'); return }
    if (!form.agreed) { toast.error('Please accept the terms to continue'); return }

    setLoading(true)
    try {
      const cfOrder = await createCashfreeOrder({
        courseId: course.id,
        batchId: batchId,
        amount: finalTotal,
        userId: user!.id,
        userName: form.name,
        userEmail: form.email,
        userPhone: form.phone || undefined,
        discountCode: discount?.valid ? discount.code : undefined,
        discountAmount: discountAmt || undefined,
        reference: form.reference || undefined,
      })
      await openCashfreeCheckout(
        cfOrder.payment_session_id,
        cfOrder.order_id,
        `${window.location.origin}/checkout/success`
      )
      setSuccess(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRazorpayPurchase = async () => {
    if (!isLoggedIn) { toast.error('Please sign in to complete your purchase'); return }
    if (!course) return
    if (!batchId) {
      toast.error('No batch selected. Redirecting...')
      router.replace(`/courses/${courseId}#batches`)
      return
    }
    if (!form.name || !form.email) { toast.error('Please fill in your name and email'); return }
    if (!form.agreed) { toast.error('Please accept the terms to continue'); return }

    setLoading(true)
    try {
      // Step 1: Create pending order in DB
      const { order_id: internalOrderId } = await ordersApi.create({
        user_id:         user!.id,
        course_id:       course.id,
        amount:          finalTotal,
        discount_code:   discount?.valid ? discount.code : undefined,
        discount_amount: discountAmt || undefined,
        reference:       form.reference || undefined,
        batch_id:        batchId || undefined,
      })

      if (!internalOrderId) throw new Error('Order creation failed — no order ID returned')

      // Step 2: Create Razorpay order via backend
      const rzpOrder = await createRazorpayOrder(finalTotal, internalOrderId)

      // Step 3: Open Razorpay modal
      await openRazorpayCheckout({
        razorpayOrderId: rzpOrder.razorpay_order_id,
        amount:          rzpOrder.amount,
        currency:        rzpOrder.currency,
        userName:        form.name,
        userEmail:       form.email,
        userPhone:       form.phone || undefined,
        courseName:      course.title,

        onSuccess: async (response) => {
          try {
            // Step 4: Verify signature → enroll student
            await verifyRazorpayPayment({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              internal_order_id:   internalOrderId,
              user_id:             user!.id,
              course_id:           course!.id,
            })
            setSuccess(true)
            toast.success('Payment successful! You are now enrolled.')
            setTimeout(() => router.push('/my-courses'), 2500)
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Payment verification failed.')
          } finally {
            setLoading(false)
          }
        },

        onDismiss: () => {
          toast('Payment cancelled. Your order is saved — complete payment anytime.')
          setLoading(false)
        },

        onError: (msg) => {
          toast.error(`Payment failed: ${msg}`)
          setLoading(false)
        },
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h2 className="text-2xl font-bold">Purchase Successful!</h2>
        <p className="text-muted-foreground">Redirecting to your courses...</p>
      </div>
    )
  }

  // Block render if no batch
  if (!batchId && !courseLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500" />
        <h2 className="text-xl font-bold">Batch Required</h2>
        <p className="text-muted-foreground text-sm">You must select a batch before enrolling.</p>
        <Link href={courseId ? `/courses/${courseId}#batches` : '/courses'}>
          <Button>← Select a Batch</Button>
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen pt-20 pb-12 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href={course ? `/courses/${courseId}` : '/courses'}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-sm mb-3">
              <ArrowLeft className="w-3.5 h-3.5" />Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Complete your enrollment</p>
        </div>

        {courseLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : course ? (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Left: Forms */}
            <div className="lg:col-span-2 space-y-4">

              {/* Course + Batch summary */}
              <Card className="p-4">
                <h2 className="text-sm font-bold mb-3">Your Enrollment</h2>
                <div className="flex gap-3">
                  <div className="w-16 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {course.image
                      ? <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm leading-tight">{course.title}</h3>
                    {course.instructor && <p className="text-xs text-muted-foreground mt-0.5">by {course.instructor}</p>}
                  </div>
                </div>

                {/* Selected batch */}
                {batch && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Selected Batch</p>
                    <BatchMini batch={batch} />
                  </div>
                )}

                {!batch && batchId && (
                  <p className="text-xs text-muted-foreground mt-2">Batch ID: {batchId}</p>
                )}
              </Card>

              {/* Login warning */}
              {!isLoggedIn && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  You must be signed in to complete your purchase.
                </div>
              )}

              {/* Personal Info */}
              <Card className="p-4">
                <h2 className="text-sm font-bold mb-3">Personal Information</h2>
                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-1">Full Name <span className="text-red-500">*</span></label>
                      <Input
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Your full name"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">Email <span className="text-red-500">*</span></label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="you@example.com"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-1">Phone</label>
                      <Input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+91 98765 43210"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">City</label>
                      <Input
                        value={form.city}
                        onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                        placeholder="Mumbai"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">How did you hear about us? <span className="text-muted-foreground">(optional)</span></label>
                    <div className="relative">
                      <select
                        value={form.reference}
                        onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                        className="w-full px-3 py-1.5 pr-8 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none h-8"
                      >
                        {REFERENCE_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt || '— Select source —'}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payment Option — only shown if admin enabled instalment plan */}
              {instalmentPlan?.enabled && (
                <Card className="p-4">
                  <h2 className="text-sm font-bold mb-3">Payment Option</h2>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => setPaymentType('full')}
                      className={`px-3 py-3 rounded-lg border text-sm font-medium transition-all text-left ${
                        paymentType === 'full'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      <div className="font-semibold">Full Payment</div>
                      <div className="text-xs mt-0.5 opacity-70">Pay ₹{fullTotal.toLocaleString('en-IN')} now</div>
                    </button>
                    <button
                      onClick={() => setPaymentType('part')}
                      className={`px-3 py-3 rounded-lg border text-sm font-medium transition-all text-left ${
                        paymentType === 'part'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      <div className="font-semibold">Part Payment</div>
                      <div className="text-xs mt-0.5 opacity-70">{instalmentPlan.num_instalments} instalments of ₹{instalmentPlan.emi_amount.toLocaleString('en-IN')}</div>
                    </button>
                  </div>
                  {paymentType === 'part' && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 space-y-1">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                        Instalment Plan — {instalmentPlan.num_instalments} × ₹{instalmentPlan.emi_amount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Pay ₹{instalmentPlan.emi_amount.toLocaleString('en-IN')} now. Remaining instalments to be paid as agreed.
                        Enrollment activates after full payment.
                      </p>
                    </div>
                  )}
                </Card>
              )}

              {/* Discount Code */}
              <Card className="p-4">
                <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />Discount Code
                </h2>
                {discount?.valid ? (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-bold text-green-700 dark:text-green-300 font-mono">{discount.code}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">{discount.message}</p>
                    </div>
                    <button onClick={removeDiscount} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="DISCOUNT CODE"
                      value={discountCode}
                      onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApplyDiscount()}
                      className="flex-1 font-mono uppercase h-8 text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={handleApplyDiscount} disabled={discountLoading} className="h-8">
                      {discountLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                )}
              </Card>

              {/* Payment info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Secure Payment via Cashfree</p>
                  <p className="text-[11px] text-muted-foreground">Your payment is encrypted with 256-bit SSL. UPI, Cards, Net Banking supported.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={form.agreed}
                  onChange={e => setForm(f => ({ ...f, agreed: e.target.checked }))}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground">
                  I agree to the Terms of Service and Privacy Policy
                </label>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="p-5">
                  <h3 className="font-bold text-sm mb-4">Order Summary</h3>
                  <div className="space-y-2.5 pb-3 border-b border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Course price</span>
                      <span className="flex items-center gap-0.5"><IndianRupee className="w-3 h-3" />{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (0%)</span>
                      <span className="flex items-center gap-0.5"><IndianRupee className="w-3 h-3" />{tax}</span>
                    </div>
                    {discountAmt > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
                        <span>Discount ({discount?.code})</span>
                        <span>−₹{discountAmt}</span>
                      </div>
                    )}
                  </div>
                  {paymentType === 'part' && instalmentPlan ? (
                    <div className="space-y-1.5 pt-3">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Course Total</span>
                        <span className="flex items-center gap-0.5"><IndianRupee className="w-3 h-3" />{fullTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Plan</span>
                        <span>{instalmentPlan.num_instalments} instalments</span>
                      </div>
                      <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                        <span>Paying Now (1st)</span>
                        <span className="flex items-center gap-0.5 text-primary">
                          <IndianRupee className="w-4 h-4" />{finalTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400">
                        <span>Pending after this ({instalmentPlan.num_instalments - 1} more)</span>
                        <span>₹{((instalmentPlan.num_instalments - 1) * instalmentPlan.emi_amount).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between font-bold text-base pt-3">
                      <span>Total</span>
                      <span className="flex items-center gap-0.5 text-primary">
                        <IndianRupee className="w-4 h-4" />{finalTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {/* ── Payment Section ── */}
                  {QR_CONFIG.useRazorpay ? (
                    // ── Razorpay ─────────────────────────────────────────────
                    <>
                      <Button
                        className="w-full mt-5 gap-2"
                        size="lg"
                        onClick={handleRazorpayPurchase}
                        disabled={loading || !isLoggedIn}
                      >
                        {loading
                          ? <><Loader2 className="w-4 h-4 animate-spin" />Opening payment…</>
                          : <><Lock className="w-4 h-4" />Pay with Razorpay</>}
                      </Button>
                      <div className="flex items-center justify-center gap-1.5 mt-3">
                        <Shield className="w-3 h-3 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground text-center">
                          Secured by Razorpay · UPI · Cards · Net Banking · Wallets
                        </p>
                      </div>
                    </>
                  ) : QR_CONFIG.useCashfree ? (
                    // ── Cashfree (activate when gateway is approved) ──
                    <>
                      <Button
                        className="w-full mt-5 gap-2"
                        size="lg"
                        onClick={handlePurchase}
                        disabled={loading || !isLoggedIn}
                      >
                        {loading
                          ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                          : <><Lock className="w-4 h-4" />Pay with Cashfree</>}
                      </Button>
                      <div className="flex items-center justify-center gap-1.5 mt-3">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground text-center">
                          Powered by Cashfree · UPI · Cards · Net Banking
                        </p>
                      </div>
                    </>
                  ) : (
                    // ── QR / UPI Manual Payment ──
                    <div className="mt-4 space-y-3">

                      {qrConfirmed ? (
                        // After confirming order — show WhatsApp instructions
                        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 p-4 text-center space-y-2">
                          <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                          <p className="text-sm font-bold text-green-700 dark:text-green-300">Order Recorded!</p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Please complete your payment of{' '}
                            <strong>₹{finalTotal.toLocaleString('en-IN')}</strong> to the UPI ID below,
                            then send your payment screenshot on WhatsApp.
                          </p>
                          <div className="flex items-center justify-between bg-white dark:bg-black/30 rounded-lg px-3 py-2 border border-green-200 dark:border-green-700">
                            <span className="text-sm font-mono font-semibold">{QR_CONFIG.upiId}</span>
                            <button onClick={copyUpi} className="text-muted-foreground hover:text-foreground transition-colors">
                              {upiCopied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                          <a
                            href={`https://wa.me/${QR_CONFIG.whatsappNumber}?text=${encodeURIComponent(`Hi! I've paid ₹${finalTotal} for the course. My name: ${form.name}, Email: ${form.email}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white mt-1" size="sm">
                              <Phone className="w-3.5 h-3.5" />
                              Send Screenshot on WhatsApp
                            </Button>
                          </a>
                        </div>
                      ) : (
                        <>
                          {/* QR Code */}
                          <div className="rounded-xl border border-border bg-muted/30 p-4 flex flex-col items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              <QrCode className="w-3.5 h-3.5" />
                              Scan & Pay via UPI
                            </div>

                            {/* QR Image — replace qrImageUrl in QR_CONFIG with your image */}
                            <div className="w-40 h-40 rounded-lg overflow-hidden border-2 border-primary/20 bg-white flex items-center justify-center">
                              {QR_CONFIG.qrImageUrl ? (
                                <img
                                  src={QR_CONFIG.qrImageUrl}
                                  alt="UPI QR Code"
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="text-center p-3">
                                  <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-1" />
                                  <p className="text-[9px] text-muted-foreground">Add your QR image URL in QR_CONFIG</p>
                                </div>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground text-center">
                              Pay <strong className="text-foreground">₹{finalTotal.toLocaleString('en-IN')}</strong> to
                            </p>

                            {/* UPI ID copy row */}
                            <div className="flex items-center justify-between w-full bg-background rounded-lg px-3 py-2 border border-border">
                              <div>
                                <p className="text-[10px] text-muted-foreground">UPI ID</p>
                                <p className="text-sm font-mono font-semibold">{QR_CONFIG.upiId}</p>
                              </div>
                              <button
                                onClick={copyUpi}
                                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                              >
                                {upiCopied
                                  ? <><CheckCheck className="w-3.5 h-3.5 text-green-500" /><span className="text-green-500">Copied</span></>
                                  : <><Copy className="w-3.5 h-3.5" />Copy</>}
                              </button>
                            </div>

                            <p className="text-[10px] text-muted-foreground text-center">
                              Works with PhonePe · GPay · Paytm · BHIM · any UPI app
                            </p>
                          </div>

                          {/* Confirm button */}
                          <Button
                            className="w-full gap-2"
                            size="lg"
                            onClick={handleQrConfirm}
                            disabled={loading || !isLoggedIn}
                          >
                            {loading
                              ? <><Loader2 className="w-4 h-4 animate-spin" />Please wait...</>
                              : <>I have paid — Confirm Enrollment</>}
                          </Button>

                          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                            After paying, click confirm and send your payment screenshot on WhatsApp. Your enrollment will be activated within a few hours.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Course not found</p>
            <Link href="/courses"><Button>Browse Courses</Button></Link>
          </Card>
        )}
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return <Suspense><CheckoutForm /></Suspense>
}
