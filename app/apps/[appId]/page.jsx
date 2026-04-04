'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import apps from '../_registry'
import Modal from '../../_components/Modal'
import CodeViewer from '../../_components/CodeViewer'
import PromptWalkthrough from '../../_components/PromptWalkthrough'

// Dynamic imports for app components — these are large and should be code-split
const appComponents = {
  'pid-tank': dynamic(() => import('../_registry/pid-tank/PidTank'), { ssr: false }),
  'tsp-solver': dynamic(() => import('../_registry/tsp-solver/TspSolver'), { ssr: false }),
  'ant-colony': dynamic(() => import('../_registry/ant-colony/AntColony'), { ssr: false }),
  'gravity-sim': dynamic(() => import('../_registry/gravity-sim/GravitySim'), { ssr: false }),
  'ppm': dynamic(() => import('../_registry/ppm/PpmApp'), { ssr: false }),
  'ppm-viewer': dynamic(() => import('../_registry/ppm-viewer/PpmViewer'), { ssr: false }),
  'runner': dynamic(() => import('../_registry/runner/RunnerApp'), { ssr: false }),
}

function DocumentationSection({ doc }) {
  const [tab, setTab] = useState('howToUse')

  if (!doc) return null

  const tabs = [
    { id: 'howToUse', label: 'How to Use' },
    { id: 'mathSimple', label: 'The Intuition' },
    { id: 'mathAdvanced', label: 'The Math' },
  ]

  const tabBtnStyle = (active) => ({
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 600,
    border: 'none',
    borderBottom: active ? '2px solid var(--accent-purple)' : '2px solid transparent',
    cursor: 'pointer',
    background: 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    transition: 'all 0.2s',
    fontFamily: "'Inter', sans-serif",
  })

  const renderMarkdown = (text) => {
    const lines = text.split('\n')
    const elements = []
    let currentParagraph = []

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ')
        elements.push(
          <p key={elements.length} style={{
            fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 12,
          }}>
            {renderInline(text)}
          </p>
        )
        currentParagraph = []
      }
    }

    const renderInline = (str) => {
      const parts = str.split(/(\*\*[^*]+\*\*)/)
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
        }
        return part
      })
    }

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed === '') {
        flushParagraph()
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
        flushParagraph()
        elements.push(
          <h4 key={elements.length} style={{
            fontSize: 15, fontWeight: 700, color: 'var(--accent-purple)',
            marginTop: 20, marginBottom: 8,
          }}>
            {trimmed.slice(2, -2)}
          </h4>
        )
      } else {
        currentParagraph.push(trimmed)
      }
    }
    flushParagraph()

    return elements
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      margin: '0 24px 24px',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        padding: '0 12px',
      }}>
        {tabs.map((t) => (
          <button key={t.id} style={tabBtnStyle(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px 28px' }}>
        {tab === 'howToUse' && doc.howToUse && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {doc.howToUse.map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: 16, alignItems: 'flex-start',
              }}>
                <div style={{
                  minWidth: 32, height: 32, borderRadius: '50%',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'var(--accent-purple)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {step.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'mathSimple' && doc.mathSimple && (
          <div>{renderMarkdown(doc.mathSimple)}</div>
        )}

        {tab === 'mathAdvanced' && doc.mathAdvanced && (
          <div style={{ fontFamily: "'JetBrains Mono', 'Inter', sans-serif" }}>
            {renderMarkdown(doc.mathAdvanced)}
          </div>
        )}
      </div>
    </div>
  )
}

function CommentSection({ appId, isAdmin = false }) {
  const [comments, setComments] = useState([])
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`cw-comments-${appId}`) || '[]')
      setComments(saved)
    } catch { setComments([]) }
  }, [appId])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !text.trim()) return
    const newComment = {
      id: Date.now(),
      name: name.trim(),
      text: text.trim(),
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    }
    const updated = [newComment, ...comments]
    setComments(updated)
    try { localStorage.setItem(`cw-comments-${appId}`, JSON.stringify(updated)) } catch {}
    setName('')
    setText('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2500)
  }

  const handleDelete = (commentId) => {
    const updated = comments.filter(c => c.id !== commentId)
    setComments(updated)
    try { localStorage.setItem(`cw-comments-${appId}`, JSON.stringify(updated)) } catch {}
  }

  const inputStyle = {
    padding: '10px 14px',
    fontSize: 14,
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      margin: '0 24px 24px',
      padding: '28px',
    }}>
      <h3 style={{
        fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
        marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        Comments & Suggestions
        {comments.length > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
            background: 'var(--bg-elevated)', color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}>
            {comments.length}
          </span>
        )}
      </h3>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ ...inputStyle, maxWidth: 280 }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-purple)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        />
        <textarea
          placeholder="Share your thoughts, feedback, or suggestions for improvement..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-purple)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="submit"
            style={{
              padding: '10px 24px', fontSize: 13, fontWeight: 600,
              border: 'none', borderRadius: 8, cursor: 'pointer',
              background: 'var(--accent-purple)', color: '#fff',
              fontFamily: "'Inter', sans-serif", transition: 'opacity 0.2s',
              opacity: name.trim() && text.trim() ? 1 : 0.5,
            }}
          >
            Post Comment
          </button>
          {submitted && (
            <span style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 500 }}>
              Comment posted!
            </span>
          )}
        </div>
      </form>

      {comments.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No comments yet — be the first to share your thoughts!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {comments.map((c) => (
            <div key={c.id} style={{
              padding: '16px 20px',
              background: 'var(--bg-elevated)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-blue)' }}>{c.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{c.date}</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{
                        padding: '2px 8px', fontSize: 11, fontWeight: 600,
                        border: '1px solid #ef4444', borderRadius: 4,
                        background: 'transparent', color: '#ef4444',
                        cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{c.text}</p>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16 }}>
        Comments are stored in your browser&apos;s local storage. A community system with persistent comments is coming soon.
      </p>
    </div>
  )
}

export default function AppPage() {
  const params = useParams()
  const appId = params.appId
  const [showDescription, setShowDescription] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [promptSteps, setPromptSteps] = useState(null)
  const [sourceCode, setSourceCode] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const appAreaRef = useRef(null)

  const app = apps.find((a) => a.id === appId)
  const AppComponent = appComponents[appId]

  useEffect(() => {
    const handler = () => {
      const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement)
      setIsFullscreen(isFS)
    }
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])

  const toggleFullscreen = () => {
    const el = appAreaRef.current
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement
    if (!fsEl && el) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => setIsFullscreen(v => !v))
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen()
      } else {
        setIsFullscreen(v => !v)
      }
    } else if (fsEl) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {})
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
    } else {
      setIsFullscreen(false)
    }
  }

  if (!app) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>App not found</h2>
        <Link href="/" style={{ marginTop: 16, display: 'inline-block' }}>Back to gallery</Link>
      </div>
    )
  }

  const handleShowPrompts = async () => {
    if (!promptSteps) {
      const mod = await import(`../_registry/${appId}/prompts.js`)
      setPromptSteps(mod.default)
    }
    setShowPrompts(true)
  }

  const handleShowCode = async () => {
    if (!sourceCode) {
      const mod = await import(`../_registry/${appId}/sourceCode.js`)
      setSourceCode(mod.default)
    }
    setShowCode(true)
  }

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
        display: isFullscreen ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            href="/"
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
            {'\u2190'} Claudeworks!
          </Link>
          <span style={{ color: 'var(--border-hover)' }}>|</span>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', margin: 0 }}>
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

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {app.categoryType !== 'commercial' && (
            <>
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
            </>
          )}
          <button
            style={{ ...buttonStyle, borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)', fontSize: 15, padding: '8px 12px' }}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? '\u2297' : '\u26F6'}
          </button>
        </div>
      </div>

      {/* App area */}
      <div
        ref={appAreaRef}
        style={{
          position: 'relative',
          padding: isFullscreen ? 8 : 24,
          background: isFullscreen ? 'var(--bg-primary)' : 'var(--bg-card)',
          margin: isFullscreen ? 0 : 24,
          borderRadius: isFullscreen ? 0 : 16,
          border: isFullscreen ? 'none' : '1px solid var(--border)',
          overflow: 'auto',
          minHeight: isFullscreen ? '100vh' : 'auto',
        }}
      >
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            style={{
              position: 'absolute', top: 8, right: 8, zIndex: 100,
              padding: '6px 14px', fontSize: 12, fontWeight: 600,
              background: 'rgba(0,0,0,0.6)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Exit Fullscreen
          </button>
        )}
        {AppComponent ? (
          <AppComponent />
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading app...
          </div>
        )}
      </div>

      {/* Documentation Section */}
      {app.documentation && app.categoryType !== 'commercial' && <DocumentationSection doc={app.documentation} />}

      {/* Comment Section */}
      {app.categoryType !== 'commercial' && <CommentSection appId={appId} />}

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
        title="How This Was Built \u2014 Prompt Walkthrough"
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
