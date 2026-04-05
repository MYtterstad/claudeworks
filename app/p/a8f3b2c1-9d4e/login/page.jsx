'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/ppm-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (data.success) {
        const from = searchParams.get('from') || '/p/a8f3b2c1-9d4e'
        router.push(from)
        router.refresh()
      } else {
        setError('Invalid password')
        setPassword('')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: 380,
      padding: 40,
      background: '#12121a',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>&#128274;</div>
        <h1 style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#e0e0e8',
          margin: '0 0 8px',
        }}>
          Protected Area
        </h1>
        <p style={{
          fontSize: 13,
          color: '#6b6b80',
          margin: 0,
        }}>
          Enter the access password to continue
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            background: '#0a0a0f',
            border: error ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#e0e0e8',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { if (!error) e.target.style.borderColor = '#7c5bf0' }}
          onBlur={(e) => { if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
        />

        {error && (
          <p style={{
            fontSize: 13,
            color: '#ef4444',
            margin: '8px 0 0',
          }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password.trim()}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            background: loading || !password.trim() ? '#2a2a3a' : '#7c5bf0',
            color: loading || !password.trim() ? '#6b6b80' : '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: loading || !password.trim() ? 'default' : 'pointer',
            marginTop: 16,
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Verifying...' : 'Enter'}
        </button>
      </form>
    </div>
  )
}

export default function PPMLoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <Suspense fallback={
        <div style={{ color: '#6b6b80', fontSize: 14 }}>Loading...</div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
