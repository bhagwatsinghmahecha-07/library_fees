import { useEffect } from 'react'

// Pop-up that slides up from the bottom on phones and sits in the middle on larger screens
export default function Sheet({ title, onClose, children, z = 'z-30' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className={`fixed inset-0 ${z} flex items-end justify-center bg-black/50 sm:items-center`} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-slate-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}
