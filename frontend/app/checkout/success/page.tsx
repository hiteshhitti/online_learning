'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { verifyCashfreePayment } from '@/lib/cashfree'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('order_id')

  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!orderId) { setStatus('failed'); setMessage('No order ID found.'); return }

    verifyCashfreePayment(orderId)
      .then(res => {
        if (res.success && res.order_status === 'PAID') {
          setStatus('success')
          setMessage(res.message || 'Payment successful!')
          setTimeout(() => router.push('/my-courses'), 3000)
        } else {
          setStatus('failed')
          setMessage(res.message || 'Payment was not completed.')
        }
      })
      .catch(() => {
        setStatus('failed')
        setMessage('Could not verify payment. Please contact support.')
      })
  }, [orderId, router])

  return (
    <main className="min-h-screen pt-20 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold">Verifying Payment…</h2>
            <p className="text-sm text-muted-foreground mt-1">Please wait, do not close this page.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
            <p className="text-sm text-muted-foreground mt-2">{message}</p>
            <p className="text-xs text-muted-foreground mt-1">Redirecting to your courses…</p>
            <Link href="/my-courses" className="mt-5 inline-block">
              <Button>Go to My Courses</Button>
            </Link>
          </>
        )}
        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Payment Failed</h2>
            <p className="text-sm text-muted-foreground mt-2">{message}</p>
            <div className="flex gap-3 justify-center mt-5">
              <Link href="/courses"><Button variant="outline">Browse Courses</Button></Link>
              <Button onClick={() => router.back()}>Try Again</Button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default function PaymentSuccessPage() {
  return <Suspense><SuccessContent /></Suspense>
}
