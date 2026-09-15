'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'

interface ToastProps {
  id?: number
  message: string | null
  onDismiss: () => void
  duration?: number
}

export default function Toast({ id, message, onDismiss, duration = 2500 }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [id, message, duration, onDismiss])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={id ?? message}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="pointer-events-none fixed top-[108px] left-1/2 z-[var(--z-toast)] -translate-x-1/2"
        >
          <span className="block rounded-full bg-neutral-900/90 px-5 py-2.5 text-[14px] font-medium whitespace-nowrap text-white shadow-lg">
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
