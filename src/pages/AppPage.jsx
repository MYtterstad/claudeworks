import { useState, Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import CodeViewer from '../components/CodeViewer'
import PromptWalkthrough from '../components/PromptWalkthrough'
import apps from '../apps/registry'

export default function AppPage() {
  const { appId } = useParams()
  const [showDescription, setShowDescription] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [promptSteps, setPromptSteps] = useState(null)
  const [sourceCode, setSourceCode] = useState(null)

  const app = apps.find((a) => a.id === appId)

  if (!app) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>App not found</h2>
        <Link to="/" style={{ marginTop: 16, display: 'inline-block' }}>Back to gallery</Link>
      </div>
    )
  }

  const handleShowPrompts = async () => {
    if (!promptSteps) {
      const mod = await import(`../apps/${appId}/prompts.js`)
      setPromptSteps(mod.default)
    }
    setShowPrompts(true)
  }

  const handleShowCode = async () => {
    if (!sourceCode) {
      const mod = await import(`../apps/${appId}/sourceCode.js`)
      setSourceCode(mod.default)
    }
    setShowCode(true)
  }

  const AppComponent = app.component

  const buttonStyle = {
    padding: '8px 18px',
    fontSize: 13,
    fontWeight: 600,
    border: '1px solid var(--border)',
    borderRadius: 8,
    cursor: 'pointer',
    background: 'var(--bg-elevated)',
    color: 'var(--text-secondary)',
    transition: 'all 0.2s',
    fontFamily: "'Inter', sans-serif",
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            to="/"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--accent-purple)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Claudeworks!
          </Link>
          <span style={{ color: 'var(--border-hover)' }}>|</span>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {app.title}
            <span style={{
              fontSize: 11,
              fontWeight: 400,
              color: 'var(--text-muted)',
              marginLeft: 8,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              v{app.version}
            </span>
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={buttonStyle} onClick={() => setShowDescription(true)}>
            About
          </button>
          <button style={buttonStyle} onClick={handleShowPrompts}>
            Prompts
          </button>
          <button
            style={{ ...buttonStyle, borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}
            onClick={handleShowCode}
          >
            View Code
          </button>
        </div>
      </div>

      {/* App area */}
      <div style={{
        padding: 24,
        background: 'var(--bg-card)',
        margin: 24,
        borderRadius: 16,
        border: '1px solid var(--border)',
      }}>
        <Suspense fallback={
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading app...
          </div>
        }>
          <AppComponent />
        </Suspense>
      </div>

      {/* Description Modal */}
      <Modal isOpen={showDescription} onClose={() => setShowDescription(false)} title={app.title}>
        <p style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.8,
          whiteSpace: 'pre-line',
        }}>
          {app.description}
        </p>
        <div style={{ marginTop: 20, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {app.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 12px',
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
      </Modal>

      {/* Prompts Modal */}
      <Modal
        isOpen={showPrompts}
        onClose={() => setShowPrompts(false)}
        title="How This Was Built — Prompt Walkthrough"
      >
        {promptSteps && <PromptWalkthrough steps={promptSteps} />}
      </Modal>

      {/* Code Modal */}
      <Modal
        isOpen={showCode}
        onClose={() => setShowCode(false)}
        title="Source Code"
      >
        {sourceCode && <CodeViewer code={sourceCode} language={app.language} />}
      </Modal>
    </div>
  )
}
