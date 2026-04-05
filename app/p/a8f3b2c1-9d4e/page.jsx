'use client'

import Link from 'next/link'

const BASE = '/p/a8f3b2c1-9d4e'

const tools = [
  {
    id: 'app',
    title: 'Portfolio Manager',
    icon: '\uD83D\uDC8A',
    description: 'Full pipeline management tool — edit projects, track phases, run simulations, generate Captario exports.',
    href: `${BASE}/app`,
    accent: '#5b8bf0',
  },
  {
    id: 'viewer',
    title: 'Portfolio Analysis Report',
    icon: '\uD83D\uDCCA',
    description: 'Interactive Titan Portfolio Monte Carlo report with dashboards, decision trees, and P&L analysis.',
    href: `${BASE}/viewer`,
    accent: '#a05bf0',
  },
  {
    id: 'report',
    title: 'Titan Portfolio Report',
    icon: '\uD83D\uDCC4',
    description: 'Self-contained HTML report with full portfolio analysis — NPV distributions, cash flows, Gantt charts.',
    href: `${BASE}/report`,
    accent: '#5bf0a0',
  },
]

export default function PPMHubPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '40px 32px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#7c5bf0',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginBottom: 8,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Pharma Pipeline Tools
          </div>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            color: '#e0e0e8',
            margin: '0 0 8px',
            letterSpacing: -0.5,
          }}>
            PPM Suite
          </h1>
          <p style={{
            fontSize: 15,
            color: '#6b6b80',
            margin: 0,
            lineHeight: 1.6,
          }}>
            Portfolio management, Monte Carlo analysis, and financial reporting for drug development pipelines.
          </p>
        </div>
      </div>

      {/* Tool cards */}
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              padding: '28px 32px',
              background: '#12121a',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 24,
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = tool.accent + '40'
                e.currentTarget.style.boxShadow = `0 4px 20px ${tool.accent}15`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                fontSize: 36,
                width: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: tool.accent + '12',
                borderRadius: 14,
                flexShrink: 0,
              }}>
                {tool.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#e0e0e8',
                  margin: '0 0 6px',
                }}>
                  {tool.title}
                </h2>
                <p style={{
                  fontSize: 14,
                  color: '#6b6b80',
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {tool.description}
                </p>
              </div>
              <div style={{
                fontSize: 20,
                color: '#3a3a4a',
                flexShrink: 0,
              }}>
                &#8594;
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '24px 32px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <p style={{
          fontSize: 12,
          color: '#3a3a4a',
          margin: 0,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          Claudeworks / PPM Suite
        </p>
      </div>
    </div>
  )
}
