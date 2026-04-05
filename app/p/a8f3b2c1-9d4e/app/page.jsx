'use client'

import dynamic from 'next/dynamic'

const PpmApp = dynamic(() => import('@/app/apps/_registry/ppm/PpmApp'), { ssr: false })

export default function PPMAppPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0a0a0f)' }}>
      <PpmApp />
    </div>
  )
}
