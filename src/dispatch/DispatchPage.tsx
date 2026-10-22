import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckIcon, LockIcon, WarningIcon } from '../components/Icons'
import { alarm, drivers as initialDrivers, events as initialEvents, type Driver, type DriverStatus, type EventKind, type FleetEvent } from './data'

const statusChip: Record<DriverStatus, { label: string; className: string; dot: string }> = {
  driving: { label: 'В пути', className: 'bg-[#D9F2E6] text-[#1E6B45]', dot: 'h-2 w-2 rounded-full bg-ok' },
  resting: { label: 'Отдыхает', className: 'bg-[#D6EEF2] text-[#0E5F69]', dot: 'h-2 w-2 rounded-[2px] bg-teal' },
  alarm: { label: 'Тревога', className: 'bg-[#C4252B] text-white font-bold', dot: '' },
}

const eventDot: Record<EventKind, string> = {
  alarm: 'rounded-full bg-alarm',
  warning: 'rounded-[2px] bg-warn',
  rest: 'rounded-[2px] bg-teal',
  info: 'rounded-full bg-teal-light',
  start: 'rounded-full bg-ok',
  done: 'rounded-full bg-ok',
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

// "Чт, 22 октября · 10:45"
function headerDate(d: Date): string {
  const wd = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(d)
  const dm = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d)
  return `${wd[0].toUpperCase()}${wd.slice(1)}, ${dm} · ${hhmm(d)}`
}

const TriangleIcon = ({ size, width }: { size: number; width: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l9.5 17h-19z" />
  </svg>
)

const PhoneCallIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5FC7D4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </svg>
)

// Fleet dispatcher page (demo with fake data)
export function DispatchPage() {
  const [openedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => new Date())
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers)
  const [events, setEvents] = useState<FleetEvent[]>(initialEvents)
  const [resolved, setResolved] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(alarm.driverId)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(id)
  }, [toast])

  // Event time = page open time minus "minutes ago"
  const timeOf = (minutesAgo: number) => hhmm(new Date(openedAt - minutesAgo * 60_000))
  const alarmAgo = alarm.minutesAgo + Math.floor((now.getTime() - openedAt) / 60_000)

  const counts = useMemo(
    () => ({
      driving: drivers.filter((d) => d.status === 'driving').length,
      resting: drivers.filter((d) => d.status === 'resting').length,
      alarm: drivers.filter((d) => d.status === 'alarm').length,
    }),
    [drivers],
  )

  const visible = useMemo(() => {
    const q = query.toLowerCase().replace(/\s/g, '')
    if (!q) return drivers
    return drivers.filter((d) => `${d.name}${d.plate}${d.vehicle}`.toLowerCase().replace(/\s/g, '').includes(q))
  }, [drivers, query])

  const byId = (id: string) => drivers.find((d) => d.id === id)!
  const alarmDriver = byId(alarm.driverId)
  const sel = byId(selected)

  const resolveAlarm = () => {
    setResolved(true)
    setDrivers((list) => list.map((d) => (d.id === alarm.driverId ? { ...d, status: 'resting', detail: 'остановился у Кордая' } : d)))
    setEvents((list) => [{ minutesAgo: -Math.floor((Date.now() - openedAt) / 60_000), kind: 'done', driverId: alarm.driverId, text: 'тревога обработана, водитель остановился' }, ...list])
  }

  // Tooltip on the map for the selected driver
  const tipTitle = sel.status === 'alarm' ? `${sel.short} · ${alarm.title}` : `${sel.short} · ${statusChip[sel.status].label.toLowerCase()}`
  const tipSub = sel.status === 'alarm' ? `${sel.vehicle} ${sel.plate} · ${timeOf(alarm.minutesAgo)}` : `${sel.vehicle} ${sel.plate} · ${sel.detail}`
  // Box width from the text length (about 8 px per letter at 14 px, 7 px at 12 px)
  const tipW = Math.max(150, Math.ceil(Math.max(tipTitle.length * 8.2, tipSub.length * 6.9)) + 24)
  const tipX = Math.min(800 - tipW - 4, Math.max(4, sel.x - tipW / 2))

  return (
    <div className="min-h-screen bg-mist font-sans text-navy">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-navy px-6 py-3.5 text-white">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}avatar/watching.png`}
            alt=""
            className="box-border h-11 w-11 rounded-full border-2 border-teal-light bg-[#EEEEEE] object-cover"
          />
          <div className="flex flex-col gap-0.5">
            <div className="text-xl font-semibold">Жолдас · Диспетчерская</div>
            <div className="text-sm text-[#8FB3C4]">Автопарк ЧистоПро</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-full bg-[#17324B] px-3.5 py-2">
            <div className="h-2.5 w-2.5 rounded-full bg-ok" />
            <div className="text-[15px]">В пути</div>
            <div className="text-[17px] font-bold">{counts.driving}</div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#17324B] px-3.5 py-2">
            <div className="h-2.5 w-2.5 rounded-[3px] bg-teal-light" />
            <div className="text-[15px]">Отдыхают</div>
            <div className="text-[17px] font-bold">{counts.resting}</div>
          </div>
          <div className={`flex items-center gap-2 rounded-full px-3.5 py-2 ${counts.alarm ? 'bg-[#C4252B]' : 'bg-[#17324B]'}`}>
            <TriangleIcon size={14} width={3} />
            <div className="text-[15px] font-semibold">Тревога</div>
            <div className="text-[17px] font-bold">{counts.alarm}</div>
          </div>
          <div className="ml-2 text-[15px] text-[#B7CDD8]">{headerDate(now)}</div>
        </div>
      </header>

      <main className="flex flex-wrap items-start gap-5 px-6 pb-4 pt-5">
        {/* Drivers */}
        <section className="min-w-0 flex-[1_1_360px] overflow-hidden rounded-[20px] bg-white">
          <div className="flex flex-col gap-3 px-[18px] pb-3 pt-4">
            <div className="flex items-baseline justify-between">
              <h2 className="m-0 text-xl font-semibold">Водители и машины</h2>
              <div className="text-[15px] text-slate">{drivers.length} на линии</div>
            </div>
            <label className="flex h-11 items-center gap-2 rounded-xl bg-[#EEF3F5] px-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D5468" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
              <span className="sr-only">Поиск водителя или номера</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Имя или госномер"
                className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-navy outline-none"
              />
            </label>
          </div>
          <div className="flex flex-col">
            {visible.map((d) => {
              const chip = statusChip[d.status]
              const isAlarm = d.status === 'alarm'
              return (
                <button
                  key={d.id}
                  onClick={() => setSelected(d.id)}
                  className={`flex items-center gap-3 border-t px-[18px] py-3 text-left transition-colors ${
                    isAlarm ? 'border-[#F3C6C8] bg-[#FDECEC]' : selected === d.id ? 'border-[#E3EBEE] bg-[#EEF5F6]' : 'border-[#E3EBEE] hover:bg-[#F6F9FA]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold">{d.name}</div>
                    <div className="text-sm text-slate">
                      {d.vehicle} · {d.plate} · {d.detail}
                    </div>
                  </div>
                  <div className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-[5px] text-sm font-semibold ${chip.className}`}>
                    {isAlarm ? <TriangleIcon size={12} width={3.5} /> : <div className={chip.dot} />}
                    {chip.label}
                  </div>
                </button>
              )
            })}
            {visible.length === 0 && <div className="border-t border-[#E3EBEE] px-[18px] py-4 text-[15px] text-slate">Никого не нашли</div>}
          </div>
        </section>

        {/* Map + alarm card */}
        {/* On narrow screens (columns wrap) the alarm comes first */}
        <section className="order-first flex min-w-0 flex-[999_1_480px] flex-col gap-5 min-[1250px]:order-none">
          <div className="overflow-hidden rounded-[20px] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 px-[18px] py-4">
              <h2 className="m-0 text-xl font-semibold">Карта · трасса M-39</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate">
                <div className="flex items-center gap-1.5">
                  <div className="box-border h-3 w-3 rounded-full border-2 border-[#1E6B45] bg-ok" />в пути
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="box-border h-3 w-3 rounded-[3px] border-2 border-[#0E5F69] bg-teal" />отдыхает
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-alarm text-[10px] font-extrabold text-white">!</div>
                  тревога
                </div>
              </div>
            </div>
            <svg viewBox="0 0 800 440" role="img" aria-label="Карта трассы M-39 от Тараза до Алматы с машинами автопарка" className="block h-auto w-full bg-[#DCE7EA]">
              <path d="M0 360 C120 340 200 400 320 380 S520 350 600 370 S740 340 800 350 L800 440 L0 440 Z" fill="#CAD9DE" />
              <path d="M0 400 C150 380 260 430 380 415 S600 395 800 410 L800 440 L0 440 Z" fill="#BCCED4" />
              <path d="M120 0 C140 80 110 160 150 230 M560 0 C540 90 600 170 580 260" stroke="#C9DBE6" strokeWidth="8" fill="none" />
              <path d="M60 170 C150 200 220 260 300 270 S440 310 500 300 S650 240 740 230" stroke="#B3C7CE" strokeWidth="16" fill="none" strokeLinecap="round" />
              <path d="M60 170 C150 200 220 260 300 270 S440 310 500 300 S650 240 740 230" stroke="#FFFFFF" strokeWidth="10" fill="none" strokeLinecap="round" />
              <g fontFamily="Rubik, sans-serif" fontWeight="600" fontSize="15" fill="#0F2236">
                <circle cx="60" cy="170" r="7" />
                <text x="52" y="152">Тараз</text>
                <circle cx="300" cy="270" r="6" />
                <text x="276" y="252">Мерке</text>
                <circle cx="500" cy="300" r="6" />
                <text x="512" y="326">Кордай</text>
                <circle cx="740" cy="230" r="8" />
                <text x="712" y="210">Алматы</text>
              </g>

              {drivers.map((d) => {
                const common = { onClick: () => setSelected(d.id), className: 'cursor-pointer' }
                if (d.status === 'alarm')
                  return (
                    <g key={d.id} {...common}>
                      <motion.circle
                        cx={d.x}
                        cy={d.y}
                        fill="#E5484D"
                        initial={{ r: 18, fillOpacity: 0.35 }}
                        animate={{ r: [18, 34, 18], fillOpacity: [0.35, 0.08, 0.35] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                      />
                      <circle cx={d.x} cy={d.y} r="15" fill="#E5484D" stroke="#FFFFFF" strokeWidth="3" />
                      <text x={d.x} y={d.y + 6} textAnchor="middle" fontFamily="Rubik, sans-serif" fontWeight="800" fontSize="17" fill="#FFFFFF">
                        !
                      </text>
                    </g>
                  )
                if (d.status === 'resting')
                  return <rect key={d.id} {...common} x={d.x - 10} y={d.y - 10} width="20" height="20" rx="5" fill="#1B9AAA" stroke="#FFFFFF" strokeWidth="3" />
                return <circle key={d.id} {...common} cx={d.x} cy={d.y} r="10" fill="#3FB97F" stroke="#FFFFFF" strokeWidth="3" />
              })}

              {/* Tooltip */}
              <g pointerEvents="none">
                <rect x={tipX} y={sel.y - 87} width={tipW} height="44" rx="10" fill="#0F2236" />
                <path d={`M${sel.x - 7} ${sel.y - 43} L${sel.x} ${sel.y - 33} L${sel.x + 7} ${sel.y - 43} Z`} fill="#0F2236" />
                <text x={tipX + 12} y={sel.y - 68} fontFamily="Rubik, sans-serif" fontWeight="600" fontSize="14" fill="#FFFFFF">
                  {tipTitle}
                </text>
                <text x={tipX + 12} y={sel.y - 51} fontFamily="Rubik, sans-serif" fontSize="12" fill="#B7CDD8">
                  {tipSub}
                </text>
              </g>
            </svg>
          </div>

          <AnimatePresence mode="wait">
            {!resolved ? (
              <motion.div
                key="alarm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="flex flex-wrap items-center gap-4 rounded-[20px] bg-white px-5 py-[18px] shadow-[inset_0_0_0_2px_#E5484D]"
              >
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#FADADB]">
                  <WarningIcon size={28} color="#B42328" width={2.2} />
                </div>
                <div className="min-w-0 flex-[1_1_260px]">
                  <div className="text-sm font-semibold text-[#B42328]">Тревога · {alarmAgo} мин назад</div>
                  <div className="mt-0.5 text-xl font-semibold">
                    {alarmDriver.name} — {alarm.title}
                  </div>
                  <div className="mt-0.5 text-[15px] text-slate">
                    {alarmDriver.vehicle} {alarmDriver.plate} · {alarm.place} · {alarm.atWheel}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={resolveAlarm}
                    className="h-12 rounded-[14px] border-2 border-slate-line bg-white px-[18px] text-base font-semibold text-navy active:scale-95"
                  >
                    Обработано
                  </button>
                  <button
                    onClick={() => setToast(`Звоним: ${alarmDriver.name} (демо — звонок не совершается)`)}
                    className="flex h-12 items-center gap-2 rounded-[14px] bg-navy px-[18px] text-base font-semibold text-white active:scale-95"
                  >
                    <PhoneCallIcon />
                    Позвонить водителю
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-[20px] bg-white px-5 py-[18px] shadow-[inset_0_0_0_2px_#3FB97F]"
              >
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#D9F2E6]">
                  <CheckIcon size={28} color="#1E6B45" width={2.6} />
                </div>
                <div>
                  <div className="text-xl font-semibold">Тревог нет</div>
                  <div className="text-[15px] text-slate">{alarmDriver.name} остановился отдохнуть. Все водители в порядке.</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Event feed */}
        <section className="min-w-0 flex-[1_1_320px] overflow-hidden rounded-[20px] bg-white">
          <div className="flex items-baseline justify-between px-[18px] pb-3 pt-4">
            <h2 className="m-0 text-xl font-semibold">Лента событий</h2>
            <div className="text-[15px] text-slate">сегодня</div>
          </div>
          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {events.map((e) => {
                const d = byId(e.driverId)
                const active = e.kind === 'alarm' && !resolved
                return (
                  <motion.div
                    key={`${e.minutesAgo}-${e.driverId}-${e.kind}`}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`flex gap-3 border-t border-[#E3EBEE] px-[18px] py-3 ${active ? 'bg-[#FDECEC]' : e.kind === 'done' ? 'bg-[#EEF8F2]' : ''}`}
                  >
                    <div className="w-11 shrink-0 text-[15px] font-semibold">{timeOf(e.minutesAgo)}</div>
                    <div className={`mt-[5px] h-2.5 w-2.5 shrink-0 ${eventDot[e.kind]}`} />
                    <div className="text-[15px] leading-[1.35]">
                      <span className="font-semibold">
                        {d.short}, {d.vehicle} {d.plate}
                      </span>{' '}
                      — {e.text}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-2 border-t border-[#E3EBEE] bg-[#F3F7F8] px-[18px] py-3.5">
            <LockIcon size={16} color="#2C7A4F" />
            <div className="text-sm text-slate">Видео с камер не передаётся — приходят только события</div>
          </div>
        </section>
      </main>

      <div className="px-6 pb-6 text-center text-[13px] text-slate">Демо-данные для презентации</div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="rounded-2xl bg-navy px-5 py-3 text-[15px] font-medium text-white shadow-xl">{toast}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
