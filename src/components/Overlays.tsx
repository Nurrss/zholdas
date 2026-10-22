import { motion } from 'framer-motion'
import { Avatar } from './Avatar'
import { ClosedEyeIcon, PhoneIcon, PinIcon, SideLookIcon } from './Icons'
import { config } from '../config'
import { plural } from '../lib/format'

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.25 } }

// "Эй, не спи!" — over the map, the map keeps moving under it
export function AlarmOverlay({ onOk, onFindStop }: { onOk: () => void; onFindStop: () => void }) {
  const sec = config.eyeClosedAlarmSec
  return (
    <motion.div className="absolute inset-0 z-50" {...fade}>
      <div className="absolute inset-0 bg-[rgba(6,10,18,0.82)]" />
      {/* Pulsing red border */}
      <motion.div
        className="pointer-events-none absolute inset-0 border-[10px] border-alarm"
        animate={{
          boxShadow: ['inset 0 0 50px rgba(229,72,77,0.45)', 'inset 0 0 110px rgba(229,72,77,0.85)', 'inset 0 0 50px rgba(229,72,77,0.45)'],
          borderColor: ['#E5484D', '#FF5A5F', '#E5484D'],
        }}
        transition={{ duration: 0.9, repeat: Infinity }}
      />
      <div className="absolute inset-0 flex flex-col items-center overflow-y-auto px-7 pb-[max(36px,env(safe-area-inset-bottom))] pt-[max(64px,calc(env(safe-area-inset-top)+40px))]">
        <div className="flex items-center gap-2 rounded-full border border-alarm bg-alarm/20 px-4 py-2">
          <ClosedEyeIcon size={20} color="#FFB8BA" />
          <div className="text-[17px] font-medium text-[#FFD2D3]">
            Глаза закрыты {String(sec).replace('.', ',')} {plural(Math.floor(sec), 'секунду', 'секунды', 'секунд')}
          </div>
        </div>

        {/* Avatar: jumps in, then shakes a little */}
        <motion.div
          className="mt-8 shrink-0 rounded-full"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16 }}
        >
          <motion.div
            className="rounded-full"
            animate={{
              rotate: [0, -4, 4, -4, 4, 0],
              boxShadow: [
                '0 0 0 10px rgba(229,72,77,0.25), 0 0 60px rgba(229,72,77,0.55)',
                '0 0 0 18px rgba(229,72,77,0.15), 0 0 90px rgba(229,72,77,0.8)',
                '0 0 0 10px rgba(229,72,77,0.25), 0 0 60px rgba(229,72,77,0.55)',
              ],
            }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <Avatar mood="alert" size={248} className="box-border border-[6px] border-alarm" />
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-9 text-center text-[64px] font-extrabold leading-none tracking-[-0.02em] text-white"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 14, delay: 0.1 }}
        >
          Эй, не спи!
        </motion.div>
        <div className="mt-3.5 text-center text-xl leading-[1.35] text-[#EAD9DA]">Открой окно, сделай глубокий вдох</div>

        <div className="min-h-6 grow" />
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={onOk}
            className="flex h-[72px] items-center justify-center rounded-[20px] border-2 border-white text-2xl font-semibold text-white active:scale-[0.97]"
          >
            Я в порядке
          </button>
          <button
            onClick={onFindStop}
            className="flex h-[76px] items-center justify-center gap-3 rounded-[20px] bg-alarm text-2xl font-bold text-white active:scale-[0.97]"
          >
            <PinIcon size={26} color="#FFFFFF" width={2.4} />
            Найти остановку
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export type WarningKind = 'phone' | 'side'

// Dim + orange border. Goes under the navigation card and the bottom bar.
export function WarningBackdrop() {
  return (
    <motion.div className="pointer-events-none absolute inset-0 z-30" {...fade}>
      <div className="absolute inset-0 bg-[rgba(6,10,18,0.5)]" />
      <div className="absolute inset-0 border-[6px] border-warn shadow-[inset_0_0_50px_rgba(240,138,60,0.45)]" />
    </motion.div>
  )
}

// Orange card "Смотри на дорогу". Slides down from the top.
export function WarningCard({ kind, onClose }: { kind: WarningKind; onClose: () => void }) {
  return (
    <motion.div
      onClick={onClose}
      className="absolute inset-x-5 top-[30%] z-40 flex flex-col items-center rounded-[28px] bg-warn px-6 pb-[26px] pt-7 text-center text-navy shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      initial={{ y: -260, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -120, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    >
      <Avatar mood="watching" size={128} className="box-border border-4 border-navy" />
      <div className="mt-[18px] flex items-center gap-2">
        {kind === 'phone' ? <PhoneIcon size={22} color="#0F2236" width={2.2} /> : <SideLookIcon size={22} color="#0F2236" width={2.2} />}
        <div className="text-lg font-medium">{kind === 'phone' ? 'Взгляд вниз, в телефон' : 'Взгляд в сторону'}</div>
      </div>
      <div className="mt-2 text-[44px] font-extrabold leading-[1.02] tracking-[-0.02em]">
        Смотри
        <br />
        на дорогу
      </div>
    </motion.div>
  )
}
