'use client'

import { type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="h-full overflow-hidden">
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
