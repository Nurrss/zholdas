import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion'
import { Avatar } from './Avatar'

export type AvatarState = 'calm' | 'talk' | 'paused'
export type ChipTone = 'ok' | 'warn' | 'idle'
export type Corner = 'tl' | 'tr' | 'bl' | 'br'

const SIZE = 80
const CORNER_KEY = 'zholdas.avatarCorner'

// Corner positions in px (top-left of the avatar). Bottom: 88 px from the bottom, like the design.
function cornerPos(c: Corner): { x: number; y: number } {
  const w = window.innerWidth
  const h = window.innerHeight
  return {
    x: c[1] === 'l' ? 16 : w - SIZE - 16,
    y: c[0] === 't' ? Math.min(176, h / 3) : h - SIZE - 88,
  }
}

function nearestCorner(x: number, y: number): Corner {
  const cx = x + SIZE / 2
  const cy = y + SIZE / 2
  return `${cy < window.innerHeight / 2 ? 't' : 'b'}${cx < window.innerWidth / 2 ? 'l' : 'r'}` as Corner
}

export function loadCorner(): Corner {
  try {
    const c = localStorage.getItem(CORNER_KEY)
    if (c === 'tl' || c === 'tr' || c === 'bl' || c === 'br') return c
  } catch {
    // storage may be blocked
  }
  return 'br'
}

const chipStyle: Record<ChipTone, { dot: string; text: string }> = {
  ok: { dot: 'bg-ok', text: 'text-[#9BE3BF]' },
  warn: { dot: 'bg-warn', text: 'text-[#FFC9A0]' },
  idle: { dot: 'bg-[#5A7A92]', text: 'text-[#B8CCD8]' },
}

type Props = {
  state: AvatarState
  hidden: boolean // during alarm, warning and talk
  chip: { label: string; tone: ChipTone }
  bubble: string | null
  onTap: () => void
  onCornerChange?: (c: Corner) => void
}

// Avatar in the corner of the map. Drag it to another corner. Tap opens Talk.
export function ZholdasAvatar({ state, hidden, chip, bubble, onTap, onCornerChange }: Props) {
  const [corner, setCorner] = useState<Corner>(loadCorner)
  const x = useMotionValue(cornerPos(corner).x)
  const y = useMotionValue(cornerPos(corner).y)
  const dragged = useRef(false)

  const moveTo = useCallback(
    (c: Corner) => {
      const p = cornerPos(c)
      animate(x, p.x, { type: 'spring', stiffness: 400, damping: 32 })
      animate(y, p.y, { type: 'spring', stiffness: 400, damping: 32 })
    },
    [x, y],
  )

  useEffect(() => {
    const onResize = () => moveTo(corner)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [corner, moveTo])

  const top = corner[0] === 't'
  const left = corner[1] === 'l'
  const watching = chip.tone === 'ok'

  return (
    <motion.div
      className="absolute left-0 top-0 z-20 touch-none"
      style={{ x, y, width: SIZE, height: SIZE, pointerEvents: hidden ? 'none' : 'auto' }}
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => (dragged.current = true)}
      onDragEnd={() => {
        const c = nearestCorner(x.get(), y.get())
        setCorner(c)
        onCornerChange?.(c)
        moveTo(c)
        try {
          localStorage.setItem(CORNER_KEY, c)
        } catch {
          // ignore
        }
        setTimeout(() => (dragged.current = false), 50)
      }}
      onTap={() => {
        if (!dragged.current) onTap()
      }}
      animate={{ opacity: hidden ? 0 : 1, scale: hidden ? 0.6 : 1 }}
      transition={{ duration: 0.25 }}
      whileTap={{ scale: 0.92 }}
    >
      {/* "Слежу" chip on the inner side of the avatar */}
      <div
        className={`pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[#1E3A55] bg-navy px-3.5 py-2 ${
          left ? 'left-[calc(100%+16px)]' : 'right-[calc(100%+16px)]'
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${chipStyle[chip.tone].dot}`} />
        <span className={`text-base font-semibold ${chipStyle[chip.tone].text}`}>{chip.label}</span>
      </div>

      {/* Short speech bubble */}
      <AnimatePresence>
        {bubble && (
          <motion.div
            key={bubble}
            initial={{ opacity: 0, scale: 0.85, y: top ? -8 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`pointer-events-none absolute w-max max-w-[260px] bg-white px-4 py-3 text-lg font-medium leading-snug text-navy shadow-[0_8px_24px_rgba(0,0,0,0.5)] ${
              top ? 'top-full mt-3' : 'bottom-full mb-3'
            } ${left ? 'left-0' : 'right-0'} ${
              top ? (left ? 'rounded-[6px_20px_20px_20px]' : 'rounded-[20px_6px_20px_20px]') : left ? 'rounded-[20px_20px_20px_6px]' : 'rounded-[20px_20px_6px_20px]'
            }`}
            style={{ transformOrigin: `${top ? 'top' : 'bottom'} ${left ? 'left' : 'right'}` }}
          >
            {bubble}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar: breathing, or bouncing while it talks */}
      <motion.div
        key={state}
        className="h-full w-full rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        animate={
          state === 'talk'
            ? { y: [0, -5, 0], scale: [1, 1.04, 1], transition: { duration: 0.35, repeat: Infinity, ease: 'easeOut' } }
            : state === 'paused'
              ? { y: 0, scale: 0.95 }
              : { scale: [1, 1.03, 1], y: [0, -3, 0], transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } }
        }
      >
        <Avatar
          mood={state === 'talk' ? 'talk' : 'watching'}
          size={SIZE}
          className={`box-border border-[3px] border-teal-light ${state === 'paused' ? 'opacity-60 grayscale' : ''}`}
        />
      </motion.div>

      {/* Green dot = watching */}
      <span
        className={`absolute right-0 top-0 h-[22px] w-[22px] rounded-full border-[3px] border-[#0A1724] ${watching ? 'bg-ok' : 'bg-[#5A7A92]'}`}
      >
        {watching && <span className="absolute inset-0 animate-ping rounded-full bg-ok/70" />}
      </span>
    </motion.div>
  )
}
