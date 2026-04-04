'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'

export default function UserMenu() {
  const { data: session } = useSession()
  const [showDropdown, setShowDropdown] = useState(false)

  if (!session?.user) {
    return (
      <Link
        href="/auth"
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s',
          display: 'inline-block',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-blue)'
          e.currentTarget.style.color = 'var(--accent-blue)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }}
      >
        Sign In
      </Link>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-blue)'
          e.currentTarget.style.backgroundColor = 'var(--bg-card)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
        }}
      >
        <span>{session.user.name || session.user.email}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            minWidth: '200px',
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                margin: 0,
              }}
            >
              Signed in as
            </p>
            <p
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: '4px 0 0 0',
                wordBreak: 'break-all',
              }}
            >
              {session.user.email}
            </p>
          </div>

          <button
            onClick={() => {
              signOut({ redirect: true, callbackUrl: '/' })
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              color: '#f87171',
              fontSize: '14px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
