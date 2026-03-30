import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        {title && (
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 20,
            paddingRight: 40,
            color: 'var(--text-primary)',
          }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
