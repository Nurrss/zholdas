import { motion } from 'framer-motion'

export type TestAction = { label: string; color: string; onClick: () => void }

// Hidden panel for the pitch. Opens with a long press on the trip time.
export function TestPanel({ actions, onClose }: { actions: TestAction[]; onClose: () => void }) {
  return (
    <motion.div
      className="absolute inset-x-4 top-[max(16px,env(safe-area-inset-top))] z-[45] rounded-3xl border border-[#1E3A55] bg-navy p-4 shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 34 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold uppercase tracking-wider text-[#8FB3C4]">Демо-режим</div>
        <button onClick={onClose} className="h-9 w-9 rounded-full bg-white/10 text-xl text-white active:scale-90" aria-label="Закрыть">
          ×
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => {
              onClose() // the audience sees the effect, not the panel
              a.onClick()
            }}
            className={`h-14 rounded-2xl px-2 text-base font-semibold active:scale-95 ${a.color}`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
