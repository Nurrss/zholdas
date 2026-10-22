import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Avatar } from '../components/Avatar'
import { BackIcon, BluetoothIcon, CalendarIcon, CheckIcon, EngineIcon, PinIcon } from '../components/Icons'
import { config } from '../config'
import { demoResult, judgeEngine, MicError, QuietError, recordEngine, type EngineResult, type EngineSample } from '../lib/engineSound'
import { getObdAdapter, type ObdReading } from '../lib/obd'
import { describeCode } from '../lib/obdCodes'
import { plural } from '../lib/format'
import { diagPhrases } from '../lib/phrases'
import { say } from '../lib/voice'

export type DiagMode = { kind: 'real' } | { kind: 'test'; scenario: 'ok' | 'problem' }

type Props = {
  mode: DiagMode
  onClose: () => void
  onTalk: () => void // "Поговорить с Жолдасом"
}

type Phase =
  | { name: 'listen'; sec: number }
  | { name: 'micError' }
  | { name: 'quiet' }
  | { name: 'result'; engine: EngineResult; obd: ObdReading; isDemoObd: boolean }

const screen = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.25 } }

// Diagnostics: listen 15 s -> result. Full screen, on top of the current screen.
export function DiagnosticsScreen({ mode, onClose, onTalk }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: 'listen', sec: 0 })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const abort = new AbortController()
    const scenario = mode.kind === 'test' ? mode.scenario : 'ok'
    const obdAdapter = getObdAdapter(scenario)

    const run = async () => {
      let engine: EngineResult
      if (mode.kind === 'test') {
        // Test: same 15 s, no microphone
        const started = performance.now()
        await new Promise<void>((resolve, reject) => {
          const id = setInterval(() => {
            if (abort.signal.aborted) {
              clearInterval(id)
              reject(new DOMException('cancelled', 'AbortError'))
              return
            }
            const sec = Math.min(config.diagSec, (performance.now() - started) / 1000)
            setPhase({ name: 'listen', sec })
            if (sec >= config.diagSec) {
              clearInterval(id)
              resolve()
            }
          }, 100)
        })
        engine = demoResult(mode.scenario)
      } else {
        const sample = await recordEngine((sec) => setPhase({ name: 'listen', sec }), abort.signal)
        engine = judgeEngine(sample)
      }
      await obdAdapter.connect()
      const obd = await obdAdapter.read()
      if (abort.signal.aborted) return
      setPhase({ name: 'result', engine, obd, isDemoObd: obdAdapter.isDemo })
      say(diagPhrases[engine.status], { interrupt: true })
    }

    run().catch((err) => {
      if (abort.signal.aborted) return
      if (err instanceof MicError) setPhase({ name: 'micError' })
      else if (err instanceof QuietError) setPhase({ name: 'quiet' })
      else console.warn('Diagnostics failed', err)
    })
    return () => abort.abort()
  }, [mode, attempt])

  return (
    <div className="fixed inset-0 z-[60]">
      {phase.name === 'listen' && <Listen sec={phase.sec} onCancel={onClose} />}
      {(phase.name === 'micError' || phase.name === 'quiet') && (
        <MicErrorView
          quiet={phase.name === 'quiet'}
          onRetry={() => {
            setPhase({ name: 'listen', sec: 0 })
            setAttempt((a) => a + 1)
          }}
          onClose={onClose}
        />
      )}
      {phase.name === 'result' &&
        (phase.engine.status === 'problem' ? (
          <Problem engine={phase.engine} obd={phase.obd} isDemoObd={phase.isDemoObd} onClose={onClose} onTalk={onTalk} />
        ) : (
          <Ok engine={phase.engine} obd={phase.obd} isDemoObd={phase.isDemoObd} onClose={onClose} />
        ))}
    </div>
  )
}

function Header({ dark, onBack }: { dark: boolean; onBack: () => void }) {
  return (
    <div className="flex w-full items-center gap-3">
      <button
        onClick={onBack}
        aria-label="Назад"
        className={`flex h-11 w-11 items-center justify-center rounded-[14px] border active:scale-95 ${
          dark ? 'border-[#1E3A55] bg-[#13293F]' : 'border-slate-line bg-white'
        }`}
      >
        <BackIcon size={22} color={dark ? '#FFFFFF' : '#0F2236'} width={2.4} />
      </button>
      <div className="text-lg font-semibold">Диагностика по звуку</div>
    </div>
  )
}

function Listen({ sec, onCancel }: { sec: number; onCancel: () => void }) {
  const total = config.diagSec
  const done = Math.floor(sec)
  return (
    <motion.div
      {...screen}
      className="flex h-full flex-col items-center overflow-y-auto bg-navy px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] text-white"
    >
      <Header dark onBack={onCancel} />
      <div className="relative mt-5 h-[330px] w-[330px] shrink-0">
        <div className="zh-ring" />
        <div className="zh-ring zh-ring-2" />
        <div className="zh-ring zh-ring-3" />
        <div className="absolute inset-0 rounded-full bg-teal-light/[0.08]" />
        <div className="absolute left-[50px] top-[50px] rounded-full shadow-[0_0_40px_rgba(95,199,212,0.35)]">
          <Avatar mood="listen" size={230} className="box-border border-4 border-teal-light" />
        </div>
      </div>
      <div className="mt-4 text-[36px] font-bold tracking-[-0.01em]">Слушаю мотор…</div>
      <div className="mt-2 text-center text-xl leading-[1.35] text-[#CFE0E8]">
        Заведи машину и не газуй
        <br />
        {total} секунд
      </div>
      <div className="mt-7 w-full">
        <div className="flex items-baseline justify-between">
          <div className="text-[22px] font-semibold tabular-nums">
            {done} из {total} сек
          </div>
          <div className="text-[15px] text-[#8FB3C4]">осталось {total - done} сек</div>
        </div>
        <div className="mt-2.5 h-3.5 overflow-hidden rounded-[7px] bg-[#1E3A55]">
          <div className="h-full rounded-[7px] bg-teal-light transition-[width] duration-100 ease-linear" style={{ width: `${(sec / total) * 100}%` }} />
        </div>
      </div>
      <div className="mt-[18px] flex items-center gap-2">
        <BluetoothIcon size={18} color="#5FC7D4" />
        <div className="text-[15px] text-[#B7CDD8]">Подключён OBD-адаптер (демо)</div>
        <CheckIcon size={18} color="#3FB97F" width={2.8} />
      </div>
      <div className="min-h-6 grow" />
      <button
        onClick={onCancel}
        className="flex h-16 w-full shrink-0 items-center justify-center rounded-[20px] border-2 border-[#5A7A92] text-[21px] font-semibold active:scale-[0.97]"
      >
        Отменить
      </button>
    </motion.div>
  )
}

function MicErrorView({ quiet, onRetry, onClose }: { quiet: boolean; onRetry: () => void; onClose: () => void }) {
  return (
    <motion.div
      {...screen}
      className="flex h-full flex-col items-center bg-navy px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] text-white"
    >
      <Header dark onBack={onClose} />
      <div className="mt-16">
        <Avatar mood="problem" size={180} className="box-border border-4 border-warn" />
      </div>
      <div className="mt-6 text-center text-[28px] font-bold">{quiet ? 'Не слышу мотор' : 'Нет доступа к микрофону'}</div>
      <div className="mt-2 text-center text-lg text-[#CFE0E8]">
        {quiet
          ? 'Заведи машину и положи телефон ближе к мотору. Звук никуда не отправляется.'
          : 'Разреши микрофон в настройках браузера. Звук не записывается и никуда не отправляется.'}
      </div>
      <div className="min-h-6 grow" />
      <button onClick={onRetry} className="h-16 w-full rounded-[20px] bg-teal text-[21px] font-bold text-navy active:scale-[0.97]">
        Попробовать снова
      </button>
      <button onClick={onClose} className="mt-3 h-14 w-full rounded-[20px] border-2 border-[#5A7A92] text-lg font-semibold active:scale-[0.97]">
        Назад
      </button>
    </motion.div>
  )
}

function checkTime(at: number): string {
  const d = new Date(at)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function ObdNote({ isDemo }: { isDemo: boolean }) {
  if (!isDemo) return null
  return <div className="mt-1.5 text-center text-[13px] text-slate">Данные OBD — демо-режим</div>
}

function Ok({ engine, obd, isDemoObd, onClose }: { engine: EngineResult; obd: ObdReading; isDemoObd: boolean; onClose: () => void }) {
  const first = engine.status === 'baseline'
  const tiles = [
    { label: 'Температура', value: `${obd.coolantC} °C` },
    { label: 'Ошибки двигателя', value: obd.codes.length ? obd.codes.join(', ') : 'нет' },
    { label: 'Аккумулятор', value: `${String(obd.batteryV).replace('.', ',')} В` },
  ]
  return (
    <motion.div
      {...screen}
      className="flex h-full flex-col overflow-y-auto bg-mist px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] text-navy"
    >
      <Header dark={false} onBack={onClose} />
      <div className="mt-3.5 flex justify-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="rounded-full shadow-[0_0_0_3px_#3FB97F,0_12px_30px_rgba(15,34,54,0.14)]"
        >
          <Avatar mood="ok" size={190} className="box-border border-4 border-white" />
        </motion.div>
      </div>
      <div className="mt-[18px] text-center text-[32px] font-bold leading-[1.12] tracking-[-0.01em]">
        {first ? (
          <>
            Запомнил
            <br />
            звук мотора
          </>
        ) : (
          <>
            Мотор звучит
            <br />
            как обычно
          </>
        )}
      </div>
      <div className="mt-1.5 text-center text-[15px] text-slate">
        {first ? 'Сравню через неделю' : `Проверка сегодня, ${checkTime(engine.now.recordedAt)}`}
      </div>

      <div className="mt-[18px] flex items-center justify-between gap-3 rounded-[22px] bg-white px-[18px] py-4">
        <div className="flex flex-col gap-1">
          <div className="text-[15px] text-slate">Звук мотора</div>
          <div className="text-xl font-semibold">{first ? 'записан как обычный' : 'как в прошлый раз'}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#D9F2E6] px-3 py-1.5 text-[15px] font-semibold text-[#1E6B45]">
          <CheckIcon size={16} color="#1E6B45" width={3} />
          {first ? 'Сохранён' : 'Норма'}
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-2.5">
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            className="flex flex-col gap-1.5 rounded-[20px] bg-white px-3 py-3.5"
          >
            <div className="min-h-[34px] text-sm leading-tight text-slate">{t.label}</div>
            <div className="text-[26px] font-bold leading-none">{t.value}</div>
          </motion.div>
        ))}
      </div>
      <ObdNote isDemo={isDemoObd} />

      <div className="min-h-6 grow" />
      <button onClick={onClose} className="h-[72px] shrink-0 rounded-[22px] bg-teal text-[26px] font-bold text-navy active:scale-[0.97]">
        Готово
      </button>
      <div className="mt-3 flex items-center justify-center gap-2">
        <CalendarIcon size={18} color="#3D5468" />
        <div className="text-[15px] text-slate">Следующая проверка через 7 дней</div>
      </div>
    </motion.div>
  )
}

// "Неделю назад", "Вчера", "3 дня назад"
function whenLabel(at: number): string {
  const days = Math.round((Date.now() - at) / (24 * 3600 * 1000))
  if (days <= 0) return 'Раньше сегодня'
  if (days === 1) return 'Вчера'
  if (days >= 7 && days < 14) return 'Неделю назад'
  return `${days} ${plural(days, 'день', 'дня', 'дней')} назад`
}

function knockLabel(s: EngineSample): string {
  return s.knocks >= 2 ? `стук · ${s.knocks} ${plural(s.knocks, 'пик', 'пика', 'пиков')}` : 'ровный'
}

// Sound picture: loudness every 100 ms as a line
function Wave({ data, color, bg }: { data: number[]; color: string; bg: string }) {
  const points = data.map((v, i) => `${((i / Math.max(1, data.length - 1)) * 310).toFixed(1)},${(4 + (1 - v) * 40).toFixed(1)}`).join(' ')
  return (
    <svg viewBox="0 0 310 48" preserveAspectRatio="none" className="block h-10 w-full rounded-[10px]" style={{ background: bg }} aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" points={points} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function Problem({
  engine,
  obd,
  isDemoObd,
  onClose,
  onTalk,
}: {
  engine: EngineResult
  obd: ObdReading
  isDemoObd: boolean
  onClose: () => void
  onTalk: () => void
}) {
  const before = engine.before!
  const when = whenLabel(before.recordedAt)
  const knock = engine.now.knocks > before.knocks + 1
  const text = knock
    ? `Появился стук, которого не было ${when.toLowerCase()}. Это может быть ремень или подшипник.`
    : `Звук мотора стал другим, чем ${when.toLowerCase()}. Лучше показать машину мастеру.`
  const code = obd.codes[0]

  return (
    <motion.div
      {...screen}
      className="flex h-full flex-col overflow-y-auto bg-mist px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-[max(18px,env(safe-area-inset-top))] text-navy"
    >
      <Header dark={false} onBack={onClose} />
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="mt-3 flex flex-col gap-2.5 rounded-3xl bg-warn px-[18px] py-4"
      >
        <div className="flex items-center gap-3.5">
          <Avatar mood="problem" size={92} className="box-border shrink-0 border-[3px] border-navy" />
          <div className="text-[27px] font-extrabold leading-[1.08] tracking-[-0.01em]">Звук мотора изменился</div>
        </div>
        <div className="text-[17px] font-medium leading-[1.35]">{text}</div>
      </motion.div>

      <div className="mt-2.5 flex flex-col gap-2 rounded-[22px] bg-white px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div className="text-[15px] font-medium text-slate">{when}</div>
          <div className="text-[13px] font-semibold text-[#0E5F69]">{knockLabel(before)}</div>
        </div>
        <Wave data={before.wave} color="#1B9AAA" bg="#EEF5F6" />
        <div className="mt-1 flex items-center justify-between">
          <div className="text-[15px] font-semibold">Сегодня</div>
          <div className="text-[13px] font-semibold text-[#A64E0E]">{knockLabel(engine.now)}</div>
        </div>
        <Wave data={engine.now.wave} color="#C25E14" bg="#FDF0E6" />
      </div>

      {code && (
        <div className="mt-2.5 flex items-start gap-3 rounded-[22px] bg-white px-4 py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FCE5D4]">
            <EngineIcon size={24} color="#A64E0E" />
          </div>
          <div className="flex flex-col gap-[3px]">
            <div className="text-lg font-bold">Ошибка {code}</div>
            <div className="text-[15px] leading-[1.35] text-slate-deep">{describeCode(code).title}</div>
            <div className="text-[15px] font-semibold leading-[1.35]">{describeCode(code).advice}</div>
          </div>
        </div>
      )}
      <ObdNote isDemo={isDemoObd} />

      <div className="min-h-4 grow" />
      <a
        href={`https://2gis.kz/search/${encodeURIComponent('СТО')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-16 shrink-0 items-center justify-center gap-2.5 rounded-[20px] bg-teal text-[22px] font-bold text-navy active:scale-[0.97]"
      >
        <PinIcon size={24} color="#0F2236" width={2.4} />
        Найти СТО рядом
      </a>
      <button
        onClick={onTalk}
        className="mt-2.5 flex h-14 shrink-0 items-center justify-center rounded-[20px] border-2 border-navy text-[19px] font-semibold active:scale-[0.97]"
      >
        Поговорить с Жолдасом
      </button>
      <div className="mt-2.5 text-center text-[13px] leading-[1.35] text-slate">Это подсказка, не диагноз. Точно скажет только мастер.</div>
    </motion.div>
  )
}
