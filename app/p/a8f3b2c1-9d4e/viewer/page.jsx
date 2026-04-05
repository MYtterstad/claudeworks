'use client'

import dynamic from 'next/dynamic'

const PpmViewer = dynamic(() => import('@/app/apps/_registry/ppm-viewer/PpmViewer'), { ssr: false })

export default function PPMViewerPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0a0a0f)' }}>
      <PpmViewer />
    </div>
  )
}
