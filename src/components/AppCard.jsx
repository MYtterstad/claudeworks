import { Link } from 'react-router-dom'

export default function AppCard({ app }) {
  return (
    <Link
      to={app.path}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-hover)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 8px 32px ${app.glowColor || 'var(--glow-blue)'}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Icon / emoji area */}
      <div style={{
        fontSize: 36,
        lineHeight: 1,
        marginBottom: 4,
      }}>
        {app.icon}
      </div>

      <h3 style={{
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--text-primary)',
        margin: 0,
      }}>
        {app.title}
      </h3>

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
              fontSize: 11,
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
        marginTop: 4,
      }}>
        v{app.version}
      </div>
    </Link>
  )
}
