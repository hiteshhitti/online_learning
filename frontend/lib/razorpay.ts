/**
 * Razorpay Standard Web Checkout — frontend utility
 *
 * Flow:
 *  1. ordersApi.create()       → creates DB order (pending)
 *  2. createRazorpayOrder()    → backend calls Razorpay API, returns order id
 *  3. openRazorpayCheckout()   → opens Razorpay modal
 *  4. verifyRazorpayPayment()  → backend verifies HMAC, marks paid, enrolls student
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const RZP_KEY  = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key:          string
  amount:       number
  currency:     string
  name:         string
  description?: string
  order_id:     string
  handler:      (response: RazorpaySuccessResponse) => void
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  modal?: { ondismiss?: () => void }
}

interface RazorpayInstance {
  open: () => void
  on:   (event: string, handler: (r: { error: { description: string } }) => void) => void
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string
  razorpay_order_id:   string
  razorpay_signature:  string
}

// Load Razorpay script dynamically (once)
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Not in browser'))
    if (window.Razorpay) return resolve()
    const s = document.createElement('script')
    s.src     = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async   = true
    s.onload  = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Razorpay script'))
    document.head.appendChild(s)
  })
}

// Step 2: Ask backend to create Razorpay order
export async function createRazorpayOrder(
  amountInr: number,
  internalOrderId: string,
): Promise<{ razorpay_order_id: string; amount: number; currency: string; key_id: string }> {
  const res = await fetch(`${BASE_URL}/orders/razorpay/create-order`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ amount: amountInr, internal_order_id: internalOrderId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to create Razorpay order')
  }
  return res.json()
}

// Step 3: Open Razorpay modal
export async function openRazorpayCheckout(opts: {
  razorpayOrderId: string
  amount:          number    // paise
  currency:        string
  userName?:       string
  userEmail?:      string
  userPhone?:      string
  courseName?:     string
  onSuccess:       (r: RazorpaySuccessResponse) => void
  onDismiss?:      () => void
  onError?:        (msg: string) => void
}): Promise<void> {
  await loadRazorpayScript()

  const rzp = new window.Razorpay({
    key:         RZP_KEY,
    amount:      opts.amount,
    currency:    opts.currency,
    name:        'Ultimate Institute of Technologies',
    description: opts.courseName || 'Course Enrollment',
    order_id:    opts.razorpayOrderId,
    prefill:     { name: opts.userName, email: opts.userEmail, contact: opts.userPhone },
    theme:       { color: '#6366f1' },
    modal:       { ondismiss: () => opts.onDismiss?.() },
    handler:     (response) => opts.onSuccess(response),
  })

  rzp.on('payment.failed', (r) => opts.onError?.(r.error?.description || 'Payment failed'))
  rzp.open()
}

// Step 4: Verify payment on backend
export async function verifyRazorpayPayment(payload: {
  razorpay_order_id:   string
  razorpay_payment_id: string
  razorpay_signature:  string
  internal_order_id:   string
  user_id:             string
  course_id:           string
}): Promise<{ success: boolean; message: string; enrolled: boolean }> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
  const res = await fetch(`${BASE_URL}/orders/razorpay/verify-payment`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Payment verification failed')
  }
  return res.json()
}
