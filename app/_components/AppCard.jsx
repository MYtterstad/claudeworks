'use client'

import Link from 'next/link'

export default function AppCard({ app, isCommercial }) {
  return (
    <Link
      href={app.path}
      style={{
        background: 'var(--bg-card)',
        border: isCommercial ? '1.5px solid var(--accent-purple)' : '1px solid var(--border)',
        borderRadius: 16,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isCommercial ? 'var(--accent-purple)' : 'var(--border-hover)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 8px 32px ${app.glowColor || 'var(--glow-blue)'}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isCommercial ? 'var(--accent-purple)' : 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Pro badge for commercial apps */}
      {isCommercial && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'var(--accent-purple)',
          color: 'var(--bg-primary)',
          fontSize: 10,
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 12,
          zIndex: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          Pro
        </div>
      )}
      {/* Preview image */}
      {app.preview ? (
        <div style={{
          width: '100%',
          height: 160,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={app.preview}
            alt={`${app.title} preview`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      ) : (
        <div style={{
          width: '100%',
          height: 100,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
        }}>
          {app.icon}
        </div>
      )}

      {/* Card body */}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{app.icon}</span>
            <h3 style={{
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              {app.title}
            </h3>
          </div>
          {isCommercial && (
            <span style={{
              fontSize: 18,
              opacity: 0.6,
            }}>
              🔒
            </span>
          )}
        </div>

        {app.category && (
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: 'var(--accent-purple)',
          }}>
            {app.category}
          </span>
        )}

        <p style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          margin: 0,
          flex: 1,
        }}>
          {app.summary}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {app.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 20,
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace",
          marginTop: 2,
        }}>
          v{app.version}
        </div>
      </div>
    </Link>
  )
}
