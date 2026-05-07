'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Lock, Database, Bell, UserCheck, Globe, Mail, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const sections = [
  {
    id: 'information-we-collect',
    icon: Database,
    title: '1. Information We Collect',
    content: [
      {
        subtitle: 'Personal Information',
        text: 'When you register for an account, we collect your name, email address, password (encrypted), and optional profile details such as location, phone number, and website.',
      },
      {
        subtitle: 'Payment Information',
        text: 'When you purchase a course, we collect billing details including name, email, country, and city. Card details are processed securely and are never stored on our servers.',
      },
      {
        subtitle: 'Usage Data',
        text: 'We automatically collect information about how you interact with our platform — including pages visited, courses enrolled, lessons completed, time spent learning, and device/browser information.',
      },
      {
        subtitle: 'Communications',
        text: 'If you contact us via email or support forms, we retain those communications to help resolve your queries and improve our service.',
      },
    ],
  },
  {
    id: 'how-we-use',
    icon: Eye,
    title: '2. How We Use Your Information',
    content: [
      {
        subtitle: 'Providing Our Services',
        text: 'Your information is used to create and manage your account, process payments, deliver courses, track your learning progress, and issue certificates of completion.',
      },
      {
        subtitle: 'Personalisation',
        text: 'We use your learning history and preferences to recommend relevant courses, suggest instructors, and tailor your dashboard experience.',
      },
      {
        subtitle: 'Communications',
        text: 'We may send you account-related emails (receipts, password resets, enrolment confirmations) and, with your consent, promotional emails about new courses and offers. You can opt out at any time.',
      },
      {
        subtitle: 'Platform Improvement',
        text: 'Aggregated and anonymised usage data helps us understand how learners use LearnHub so we can fix issues, improve features, and build new ones.',
      },
    ],
  },
  {
    id: 'data-sharing',
    icon: Globe,
    title: '3. Sharing Your Information',
    content: [
      {
        subtitle: 'We Do Not Sell Your Data',
        text: 'LearnHub does not sell, rent, or trade your personal information to third parties for their marketing purposes.',
      },
      {
        subtitle: 'Service Providers',
        text: 'We share data with trusted third-party service providers who help us operate the platform — such as payment processors, email delivery services, and cloud infrastructure providers. These partners are contractually obligated to keep your data confidential.',
      },
      {
        subtitle: 'Instructors',
        text: 'Instructors can see aggregate enrolment numbers for their courses but cannot access your personal contact details or payment information.',
      },
      {
        subtitle: 'Legal Requirements',
        text: 'We may disclose your information if required by law, court order, or governmental authority, or to protect the rights and safety of our users and the platform.',
      },
    ],
  },
  {
    id: 'data-security',
    icon: Lock,
    title: '4. Data Security',
    content: [
      {
        subtitle: 'Encryption',
        text: 'All data transmitted between your browser and our servers is encrypted using industry-standard TLS (Transport Layer Security). Passwords are hashed using bcrypt and are never stored in plain text.',
      },
      {
        subtitle: 'Access Controls',
        text: 'Access to personal data within our organisation is restricted to authorised personnel who need it to perform their job functions.',
      },
      {
        subtitle: 'Incident Response',
        text: 'In the unlikely event of a data breach that affects your personal information, we will notify you and relevant authorities within 72 hours as required by applicable law.',
      },
    ],
  },
  {
    id: 'your-rights',
    icon: UserCheck,
    title: '5. Your Rights',
    content: [
      {
        subtitle: 'Access & Portability',
        text: 'You can request a copy of all personal data we hold about you at any time by contacting us at privacy@learnhub.com.',
      },
      {
        subtitle: 'Correction',
        text: 'You can update your profile information directly from your Account Settings page at any time.',
      },
      {
        subtitle: 'Deletion',
        text: 'You may request deletion of your account and associated personal data. Note that records required for legal or financial compliance (such as purchase receipts) may be retained for the legally required period.',
      },
      {
        subtitle: 'Opt-Out',
        text: 'You can unsubscribe from marketing emails using the link in any email we send, or by updating your notification preferences in your profile settings.',
      },
    ],
  },
  {
    id: 'cookies',
    icon: RefreshCw,
    title: '6. Cookies & Tracking',
    content: [
      {
        subtitle: 'Essential Cookies',
        text: 'We use essential cookies to keep you logged in and maintain your session. These cannot be disabled as they are required for the platform to function.',
      },
      {
        subtitle: 'Analytics Cookies',
        text: 'With your consent, we use analytics cookies to understand how users navigate our platform. This helps us improve the learning experience.',
      },
      {
        subtitle: 'Managing Cookies',
        text: 'You can manage cookie preferences via the Cookie Settings link in our footer, or through your browser settings. Disabling non-essential cookies will not affect your ability to use LearnHub.',
      },
    ],
  },
  {
    id: 'data-retention',
    icon: Database,
    title: '7. Data Retention',
    content: [
      {
        subtitle: 'Active Accounts',
        text: 'We retain your personal data for as long as your account is active or as needed to provide our services.',
      },
      {
        subtitle: 'After Account Deletion',
        text: 'Following account deletion, most personal data is erased within 30 days. Transaction records and legally required data may be retained for up to 7 years in accordance with applicable financial regulations.',
      },
    ],
  },
  {
    id: 'notifications',
    icon: Bell,
    title: '8. Notification Preferences',
    content: [
      {
        subtitle: 'What We Send',
        text: 'By default, you will receive transactional emails (receipts, enrolment confirmations, live class reminders) and a weekly learning digest. All other marketing communications require your explicit opt-in.',
      },
      {
        subtitle: 'How to Update',
        text: 'You can review and update your notification preferences at any time from your Profile Settings page under the Notifications tab.',
      },
    ],
  },
  {
    id: 'contact',
    icon: Mail,
    title: '9. Contact Us',
    content: [
      {
        subtitle: 'Privacy Queries',
        text: 'For any questions, concerns, or requests relating to this Privacy Policy or your personal data, please contact our Data Protection team at privacy@learnhub.com. We aim to respond to all privacy-related requests within 5 business days.',
      },
      {
        subtitle: 'Postal Address',
        text: 'LearnHub — Attention: Privacy Team\nhello@learnhub.com | +1 (555) 123-4567',
      },
    ],
  },
]

export default function PrivacyPolicyPage() {
  const lastUpdated = 'May 7, 2026'

  return (
    <main className="min-h-screen pt-24 pb-16">

      {/* Header */}
      <section className="py-10 px-4 border-b border-border bg-card">
        <div className="max-w-4xl mx-auto">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
              <p className="text-muted-foreground">
                Last updated: <span className="font-medium text-foreground">{lastUpdated}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">

        {/* Proprietor Notice */}
        <Card className="p-6 border-primary/30 bg-primary/5">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Platform Proprietor</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                LearnHub is owned and operated by{' '}
                <span className="font-semibold text-foreground">Barkha Rani</span>
                , Proprietor. Barkha Rani is responsible for the collection, processing, and protection of all personal data on this platform in accordance with this Privacy Policy and applicable data protection laws.
              </p>
            </div>
          </div>
        </Card>

        {/* Intro */}
        <Card className="p-6">
          <p className="text-muted-foreground leading-relaxed">
            At <span className="font-semibold text-foreground">LearnHub</span>, your privacy is important to us.
            This Privacy Policy explains what personal information we collect, why we collect it, how we use and protect it,
            and the choices you have regarding your data. By using LearnHub, you agree to the practices described in this policy.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            This policy applies to all services offered through our website, mobile applications, and any other LearnHub-branded platform
            operated by <span className="font-semibold text-foreground">Barkha Rani</span>, Proprietor.
          </p>
        </Card>

        {/* Table of Contents */}
        <Card className="p-6">
          <h2 className="font-bold text-lg mb-4">Table of Contents</h2>
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-primary hover:underline underline-offset-4 transition-colors"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </Card>

        {/* Policy Sections */}
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.id} id={section.id} className="p-8 scroll-mt-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-secondary/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-secondary" />
                </div>
                <h2 className="text-xl font-bold">{section.title}</h2>
              </div>
              <div className="space-y-5">
                {section.content.map((item, idx) => (
                  <div key={idx}>
                    <h3 className="font-semibold text-foreground mb-1">{item.subtitle}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}

        {/* Footer note */}
        <Card className="p-6 bg-muted/40">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            This Privacy Policy may be updated periodically. When we make material changes, we will notify you by email
            and post a notice on our platform. Continued use of LearnHub after changes take effect constitutes your
            acceptance of the revised policy.
            <br />
            <span className="mt-2 inline-block">
              © {new Date().getFullYear()} LearnHub. All rights reserved.
            </span>
          </p>
        </Card>

        {/* Related links */}
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link href="/terms">
            <Button variant="outline" size="sm">Terms of Service</Button>
          </Link>
          <Link href="/cookies">
            <Button variant="outline" size="sm">Cookie Settings</Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="sm">Contact Us</Button>
          </Link>
        </div>

      </div>
    </main>
  )
}
