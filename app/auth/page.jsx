'use client'

import Link from 'next/link'

// Auth page stub — next-auth removed, using password gate instead
export default function AuthPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>Authentication</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This page is no longer in use.</p>
        <Link href="/" style={{ color: 'var(--accent-blue)' }}>← Back to Claudeworks</Link>
      </div>
    </div>
  )
}
