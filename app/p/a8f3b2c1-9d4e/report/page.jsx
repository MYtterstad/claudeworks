'use client'

import { useEffect, useState } from 'react'

export default function TitanReportPage() {
  const [reportHtml, setReportHtml] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ppm-gate/report')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load report')
        return res.text()
      })
      .then(html => {
        setReportHtml(html)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b6b80',
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
      }}>
        Loading report...
      </div>
    )
  }

  if (!reportHtml) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ef4444',
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
      }}>
        Failed to load report
      </div>
    )
  }

  return (
    <iframe
      srcDoc={reportHtml}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        background: '#0a0a0f',
      }}
      title="Titan Portfolio Report"
    />
  )
}
