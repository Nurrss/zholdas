import { motion } from 'framer-motion'
import { Avatar } from '../components/Avatar'
import { ClockIcon, CupIcon, LockIcon, SideLookIcon, WarningIcon, YawnIcon } from '../components/Icons'
import { formatHoursMin, plural } from '../lib/format'

export type TripSummary = { tripSec: number; km: number; alarms: number; yawns: number; phone: number; side: number }

// Under one minute show seconds, so a short demo trip is not "0 мин"
const formatDuration = (sec: number) => (sec < 60 ? `${Math.floor(sec)} с` : formatHoursMin(sec))

const cardIn = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.1 + i * 0.07, duration: 0.3 },
})

export function SummaryScreen({ trip, onNewTrip }: { trip: TripSummary; onNewTrip: () => void }) {
  return (
    <div className="h-full overflow-y-auto bg-mist text-navy">
      <div className="safe-top mx-auto flex min-h-full max-w-[480px] flex-col px-6 pt-6">
        <div className="text-[15px] font-medium text-slate">Поездка завершена</div>
        <div className="mt-0.5 text-[30px] font-bold tracking-[-0.01em]">Тараз → Алматы</div>

        <div className="mt-3.5 flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="shrink-0 rounded-full border-4 border-white shadow-[0_10px_28px_rgba(15,34,54,0.14)]"
          >
            <Avatar mood="calm" size={104} />
          </motion.div>
          <div className="flex flex-col gap-1.5">
            <div className="text-[32px] font-bold leading-none">Жарайсың!</div>
            <div className="text-lg leading-[1.3] text-slate-deep">Доехали. Спасибо, что берёг себя.</div>
          </div>
        </div>

        <motion.div {...cardIn(0)} className="mt-3.5 flex items-center justify-between rounded-3xl bg-white px-5 py-[18px]">
          <div className="flex flex-col gap-1">
            <div className="text-base text-slate">Время в пути</div>
            <div className="text-[44px] font-bold leading-none tracking-[-0.02em]">{formatDuration(trip.tripSec)}</div>
          </div>
          <ClockIcon size={40} color="#137C89" />
        </motion.div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <motion.div {...cardIn(1)} className="flex flex-col gap-1.5 rounded-3xl bg-white px-[18px] py-4">
            <div className="flex items-center justify-between">
              <div className="text-[44px] font-bold leading-none">{trip.yawns}</div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCE5D4]">
                <YawnIcon size={24} color="#A64E0E" />
              </div>
            </div>
            <div className="text-lg text-slate-deep">{plural(trip.yawns, 'зевок', 'зевка', 'зевков')}</div>
          </motion.div>
          <motion.div {...cardIn(2)} className="flex flex-col gap-1.5 rounded-3xl bg-white px-[18px] py-4">
            <div className="flex items-center justify-between">
              <div className="text-[44px] font-bold leading-none">{trip.alarms}</div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FADADB]">
                <WarningIcon size={24} color="#B42328" />
              </div>
            </div>
            <div className="text-lg text-slate-deep">{plural(trip.alarms, 'тревога', 'тревоги', 'тревог')} «Не спи!»</div>
          </motion.div>
        </div>

        {/* Distractions: phone + looking to the side */}
        <motion.div {...cardIn(3)} className="mt-3 flex items-center gap-4 rounded-3xl bg-white px-[18px] py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F08A3C]/20">
            <SideLookIcon size={24} color="#D9661A" />
          </div>
          <div className="text-[44px] font-bold leading-none">{trip.phone + trip.side}</div>
          <div className="flex min-w-0 flex-col">
            <div className="text-lg leading-tight text-slate-deep">{plural(trip.phone + trip.side, 'отвлечение', 'отвлечения', 'отвлечений')}</div>
            <div className="text-[15px] text-slate">
              телефон {trip.phone} · в сторону {trip.side}
            </div>
          </div>
        </motion.div>

        <motion.div {...cardIn(4)} className="mt-3 flex items-start gap-3.5 rounded-3xl bg-navy px-5 py-4 text-white">
          <CupIcon size={28} color="#5FC7D4" className="mt-0.5 shrink-0" />
          <div className="flex flex-col gap-1">
            <div className="text-[15px] text-[#8FB3C4]">Совет</div>
            <div className="text-2xl font-semibold leading-[1.2]">Отдыхай каждые 2 часа</div>
          </div>
        </motion.div>

        <div className="mt-3 flex items-center gap-2 px-1">
          <LockIcon size={18} color="#2C7A4F" />
          <div className="text-[15px] text-slate">Видео не сохранялось и не отправлялось</div>
        </div>

        <div className="min-h-4 grow" />

        {/* Always visible, also on small phones */}
        <div className="sticky bottom-0 -mx-6 bg-gradient-to-t from-mist from-70% to-mist/0 px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-1">
          <button
            onClick={onNewTrip}
            className="flex h-[72px] w-full items-center justify-center rounded-[22px] bg-teal text-[26px] font-bold text-navy active:scale-[0.97]"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  )
}
