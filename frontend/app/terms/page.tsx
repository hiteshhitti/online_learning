import Link from 'next/link'
import { ArrowLeft, Shield, CreditCard, BookOpen, Mail } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Terms &amp; Conditions</h1>
          <p className="text-muted-foreground">
            Last updated: May 2025 &nbsp;·&nbsp; Ultimate Institute of Technologies
          </p>
        </div>

        <div className="space-y-8">
          {/* Payments */}
          <section className="rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-md bg-primary/10">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Payments &amp; Fees</h2>
            </div>
            <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed">
              <li>All payments are processed securely via Razorpay. We do not store your card or bank details.</li>
              <li>Course fees are displayed in Indian Rupees (INR) and are inclusive of all applicable taxes.</li>
              <li>Fees are non-refundable once the course access has been granted, except as required by law.</li>
              <li>In case of a payment failure, any amount debited will be automatically refunded within 5–7 business days.</li>
            </ul>
          </section>

          {/* Enrollment */}
          <section className="rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-md bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Enrollment &amp; Access</h2>
            </div>
            <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed">
              <li>Upon successful payment you will be enrolled in the selected course and receive access details.</li>
              <li>Course materials are for personal use only and may not be shared, copied, or redistributed.</li>
              <li>Access is granted for the duration specified at the time of purchase.</li>
              <li>We reserve the right to revoke access for violation of these terms without refund.</li>
            </ul>
          </section>

          {/* Privacy */}
          <section className="rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Privacy &amp; Data</h2>
            </div>
            <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed">
              <li>We collect only the information necessary to process your enrollment and provide course access.</li>
              <li>Your personal data is never sold to third parties.</li>
              <li>Payment data is handled entirely by Razorpay and is subject to their privacy policy.</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Contact Us</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              For any questions regarding these terms, reach out to us at{' '}
              <a
                href="mailto:support@ultimateinstitute.co.in"
                className="text-primary underline underline-offset-4"
              >
                support@ultimateinstitute.co.in
              </a>{' '}
              or call us at{' '}
              <a href="tel:+919041680789" className="text-primary underline underline-offset-4">
                +91 90416 80789
              </a>
              .
            </p>
          </section>
        </div>

        <p className="mt-10 text-xs text-muted-foreground text-center">
          By making a payment on this platform, you agree to all the terms listed above.
        </p>
      </div>
    </div>
  )
}
