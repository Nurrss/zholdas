import { nextTurn, routeLength } from '../lib/route'
import { formatDistance } from '../lib/format'
import { FlagIcon, StraightIcon, TurnLeftIcon, TurnRightIcon } from './Icons'

type Instruction = { Icon: typeof StraightIcon; label: string; big: string; text: string; short: string }

function instruction(meters: number): Instruction {
  const turn = nextTurn(meters)
  const left = routeLength - meters
  if (left < 50) return { Icon: FlagIcon, label: 'Финиш', big: 'Алматы', text: 'вы приехали', short: 'финиш' }
  if (turn && turn.at - meters < 2000) {
    const right = turn.dir === 'right'
    return {
      Icon: right ? TurnRightIcon : TurnLeftIcon,
      label: 'Через',
      big: formatDistance(turn.at - meters),
      text: right ? 'поворот направо' : 'поворот налево',
      short: right ? 'направо' : 'налево',
    }
  }
  return { Icon: StraightIcon, label: 'Ещё', big: formatDistance(turn ? turn.at - meters : left), text: 'прямо по трассе', short: 'прямо' }
}

// Navigation card on top. `compact` is the small version (during the phone warning).
export function NavCard({ meters, compact = false }: { meters: number; compact?: boolean }) {
  const { Icon, label, big, text, short } = instruction(meters)

  if (compact)
    return (
      <div className="flex items-center gap-3.5 rounded-[20px] border border-[#1E3A55] bg-navy px-4 py-3">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-teal">
          <Icon size={34} color="#0F2236" width={2.6} />
        </div>
        <div className="text-[28px] font-bold text-white">{big}</div>
        <div className="text-lg text-[#D6E6EC]">{short}</div>
      </div>
    )

  return (
    <div className="flex items-center gap-4 rounded-3xl border border-[#1E3A55] bg-navy p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
      <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-[18px] bg-teal">
        <Icon size={56} color="#0F2236" width={2.6} />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="text-base font-medium text-[#8FB3C4]">{label}</div>
        <div className="text-[48px] font-bold leading-none tracking-[-0.02em] text-white">{big}</div>
        <div className="truncate text-2xl font-medium text-[#D6E6EC]">{text}</div>
      </div>
    </div>
  )
}
