import { useState, useEffect } from 'react'
import AppCard from '../components/AppCard'
import apps from '../apps/registry'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <div style={{
        padding: '72px 24px 48px',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)',
        background: `linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)`,
      }}>
        <h1 style={{
          fontSize: 52,
          fontWeight: 800,
          margin: 0,
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple), var(--accent-pink))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: -1.5,
        }}>
          Claudeworks!
        </h1>
        <p style={{
          fontSize: 19,
          color: 'var(--text-secondary)',
          marginTop: 16,
          maxWidth: 620,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.7,
        }}>
          Explore algorithms, systems, and science through interactive simulations.
          Each app includes the full prompt walkthrough and source code so you can learn and build your own.
        </p>
        <div style={{
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}>
          <div style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '6px 16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
          }}>
            {apps.length} app{apps.length !== 1 ? 's' : ''} and counting
          </div>
          <div style={{
            fontSize: 13,
            color: 'var(--accent-purple)',
            fontWeight: 600,
          }}>
            100% built with AI
          </div>
        </div>
      </div>

      {/* App Grid */}
      <div style={{
        maxWidth: 1060,
        margin: '0 auto',
        padding: '48px 24px',
      }}>
        {/* Category label */}
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 2,
          color: 'var(--text-muted)',
          marginBottom: 20,
          paddingLeft: 4,
        }}>
          Engineering & Science
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 24,
        }}>
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>

        {/* Coming soon hint */}
        <div style={{
          marginTop: 48,
          padding: '32px 28px',
          background: 'var(--bg-card)',
          border: '1px dashed var(--border)',
          borderRadius: 16,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>+</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            More apps coming soon
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Games, life science simulations, business tools, and more.
            Have an idea? Leave a comment on any app page.
          </div>
        </div>

        {/* Site-wide comments */}
        <HomeComments />

        {/* Footer */}
        <div style={{
          marginTop: 60,
          padding: '24px 0',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--text-muted)',
        }}>
          Built with Claude · Powered by curiosity
        </div>
      </div>
    </div>
  )
}

function HomeComments() {
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
        Comments are stored in your browser's local storage. A community system with persistent comments is coming soon.
      </p>
    </div>
  )
}
