'use client'

import { useState, useEffect } from 'react'

export default function HomeComments() {
  const [comments, setComments] = useState([])
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cw-comments-home') || '[]')
      setComments(saved)
    } catch { setComments([]) }
  }, [])

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
    try { localStorage.setItem('cw-comments-home', JSON.stringify(updated)) } catch {}
    setName('')
    setText('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2500)
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
      marginTop: 48,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 28,
    }}>
      <h3 style={{
        fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
        marginBottom: 8,
      }}>
        Feedback & Ideas
      </h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
        Got an idea for a new app? Found a bug? Want to suggest an improvement? Let me know.
      </p>

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
          placeholder="Share your ideas, feedback, or app suggestions..."
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
            Post
          </button>
          {submitted && (
            <span style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 500 }}>
              Posted!
            </span>
          )}
        </div>
      </form>

      {comments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comments.map((c) => (
            <div key={c.id} style={{
              padding: '14px 18px',
              background: 'var(--bg-elevated)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-blue)' }}>{c.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{c.date}</span>
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
