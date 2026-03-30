import AppCard from '../components/AppCard'
import apps from '../apps/registry'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <div style={{
        padding: '60px 24px 40px',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)',
        background: `linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)`,
      }}>
        <h1 style={{
          fontSize: 48,
          fontWeight: 700,
          margin: 0,
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple), var(--accent-pink))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: -1,
        }}>
          Claudeworks!
        </h1>
        <p style={{
          fontSize: 18,
          color: 'var(--text-secondary)',
          marginTop: 12,
          maxWidth: 560,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.6,
        }}>
          Interactive apps built with AI. Each one includes the full prompt
          walkthrough and source code so you can learn and build your own.
        </p>
        <div style={{
          marginTop: 20,
          fontSize: 13,
          color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {apps.length} app{apps.length !== 1 ? 's' : ''} and counting
        </div>
      </div>

      {/* App Grid */}
      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: '40px 24px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
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
