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
