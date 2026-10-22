import { motion } from 'framer-motion'
import { Avatar } from './Avatar'
import { MicIcon, PauseIcon, PlayIcon, StopIcon, WrenchIcon } from './Icons'

export type TalkAction = { label: string; onClick: () => void }

type Props = {
  text: string
  speaking: boolean
  primary: TalkAction | null
  onLater: () => void
  onRepeat: () => void
  // Menu (only when the driver opened Talk by tapping the avatar)
  menu: { paused: boolean; onPause: () => void; onResume: () => void; onEnd: () => void; onCheckCar: () => void } | null
}

const barsLeft = [10, 22, 34, 18, 42, 28, 46]
const barsRight = [40, 24, 44, 16, 30, 20, 10]
const fadeEnds = (i: number, n: number, reverse: boolean) => {
  const k = reverse ? n - 1 - i : i
  return k === 0 ? 0.5 : k === 1 ? 0.65 : k === 2 ? 0.8 : 1
}

function VoiceBars({ heights, reverse, speaking }: { heights: number[]; reverse: boolean; speaking: boolean }) {
  return (
    <div className="flex h-12 items-center gap-[5px]" aria-hidden="true">
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-[3px] bg-teal-light"
          style={{ opacity: fadeEnds(i, heights.length, reverse) }}
          animate={speaking ? { height: [h, Math.max(8, h * 0.35), h * 1.05, h] } : { height: Math.max(8, h * 0.3) }}
          transition={speaking ? { duration: 0.5 + (i % 3) * 0.12, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 } : { duration: 0.3 }}
        />
      ))}
    </div>
  )
}

// Zholdas talks: bottom sheet over the map
export function TalkSheet({ text, speaking, primary, onLater, onRepeat, menu }: Props) {
  return (
    <>
      <motion.div
        className="absolute inset-0 z-40 bg-[rgba(6,10,18,0.35)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onLater}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 z-40 flex flex-col rounded-t-[32px] border-t border-[#1E3A55] bg-navy px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-[22px] shadow-[0_-16px_40px_rgba(0,0,0,0.45)]"
        style={{ minHeight: menu ? undefined : 488 }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      >
        <div className="flex items-center gap-3.5">
          <Avatar mood="talk" size={96} className="box-border border-[3px] border-teal-light" />
          <div className="flex flex-col gap-0.5">
            <div className="text-xl font-semibold text-white">Жолдас</div>
            <div className="flex items-center gap-1.5">
              <motion.div
                className="h-2 w-2 rounded-full bg-teal-light"
                animate={speaking ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                transition={{ duration: 0.9, repeat: speaking ? Infinity : 0 }}
              />
              <div className="text-[15px] text-[#8FB3C4]">{speaking ? 'говорит' : 'слушает'}</div>
            </div>
          </div>
        </div>

        <motion.div
          key={text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3.5 rounded-[6px_24px_24px_24px] bg-white px-5 py-[18px] text-[23px] font-medium leading-[1.3] text-navy"
        >
          {text}
        </motion.div>

        <div className="mt-[18px] flex items-center justify-center gap-4">
          <VoiceBars heights={barsLeft} reverse={false} speaking={speaking} />
          <button
            onClick={onRepeat}
            aria-label="Повторить"
            className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-full bg-teal shadow-[0_0_0_8px_rgba(95,199,212,0.22)] active:scale-95"
          >
            <MicIcon size={36} color="#0F2236" width={2.4} />
          </button>
          <VoiceBars heights={barsRight} reverse speaking={speaking} />
        </div>

        <div className="min-h-6 grow" />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onLater}
            className={`flex h-16 items-center justify-center rounded-[18px] border-2 border-[#5A7A92] text-[21px] font-semibold text-white active:scale-[0.97] ${
              primary ? '' : 'col-span-2'
            }`}
          >
            Позже
          </button>
          {primary && (
            <button onClick={primary.onClick} className="h-16 rounded-[18px] bg-ok text-[21px] font-bold text-navy active:scale-[0.97]">
              {primary.label}
            </button>
          )}
        </div>

        {menu && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={menu.paused ? menu.onResume : menu.onPause}
              className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-white/[0.07] text-lg font-semibold text-[#D6E6EC] active:scale-[0.97]"
            >
              {menu.paused ? <PlayIcon size={20} color="#5FC7D4" /> : <PauseIcon size={20} color="#5FC7D4" />}
              {menu.paused ? 'Продолжить' : 'Пауза 10 мин'}
            </button>
            <button
              onClick={menu.onEnd}
              className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-white/[0.07] text-lg font-semibold text-[#FFB8BA] active:scale-[0.97]"
            >
              <StopIcon size={18} color="#FFB8BA" />
              Завершить
            </button>
            <button
              onClick={menu.onCheckCar}
              className="col-span-2 flex h-14 items-center justify-center gap-2 rounded-[18px] bg-white/[0.07] text-lg font-semibold text-[#D6E6EC] active:scale-[0.97]"
            >
              <WrenchIcon size={20} color="#5FC7D4" />
              Проверить машину
            </button>
          </div>
        )}
      </motion.div>
    </>
  )
}
