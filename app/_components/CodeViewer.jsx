'use client'

import { useState } from 'react'

export default function CodeViewer({ code, language = 'jsx' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {language}
        </span>
        <button
          onClick={handleCopy}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            border: '1px solid var(--border)',
            borderRadius: 6,
            cursor: 'pointer',
            background: copied ? 'var(--accent-green)' : 'var(--bg-elevated)',
            color: copied ? '#000' : 'var(--text-secondary)',
            transition: 'all 0.2s',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <pre className="code-block">
        <code>{code}</code>
      </pre>
    </div>
  )
}
