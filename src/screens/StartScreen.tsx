import { useState } from 'react'
import { motion } from 'framer-motion'
import { Avatar } from '../components/Avatar'
import { ArrowRightIcon, EyeIcon, LockIcon, TrendIcon, WrenchIcon, YawnIcon } from '../components/Icons'
import { DiagnosticsScreen, type DiagMode } from './DiagnosticsScreen'
import { openFrontCamera, type CameraError } from '../lib/camera'
import { say, unlockAudio } from '../lib/voice'
import { diagPhrases } from '../lib/phrases'

const errorText: Record<CameraError, string> = {
  denied: 'Нет доступа к камере. Разреши камеру в настройках браузера.',
  notfound: 'Камера не найдена.',
  insecure: 'Камера работает только по HTTPS.',
  other: 'Не получилось включить камеру.',
}

const features = [
  { label: 'Глаза', Icon: EyeIcon },
  { label: 'Взгляд', Icon: TrendIcon },
  { label: 'Зевки', Icon: YawnIcon },
]

export function StartScreen({ onStart }: { onStart: (stream: MediaStream | null) => void }) {
  const [error, setError] = useState<CameraError | null>(null)
  const [busy, setBusy] = useState(false)
  const [diag, setDiag] = useState<DiagMode | null>(null)

  const start = async () => {
    unlockAudio() // sound works only after a tap
    setBusy(true)
    try {
      onStart(await openFrontCamera())
    } catch (e) {
      setError(e as CameraError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative h-full overflow-y-auto bg-mist text-navy">
      <div className="safe-top mx-auto flex min-h-full max-w-[480px] flex-col px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <div className="text-2xl font-bold tracking-[-0.01em]">Жолдас</div>
            <div className="text-sm text-slate">ИИ-попутчик водителя</div>
          </div>
          <div className="rounded-full border border-slate-line px-3 py-1.5 text-[13px] font-medium text-slate">проект ЧистоПро</div>
        </div>

        <div className="mt-3 flex justify-center">
          <motion.div
            className="box-border h-[268px] w-[268px] rounded-full border-2 border-teal-light p-[10px]"
            animate={{ scale: [1, 1.02, 1], y: [0, -3, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Avatar mood="calm" size={244} className="shadow-[0_16px_40px_rgba(15,34,54,0.14)]" />
          </motion.div>
        </div>

        <div className="mt-4 text-center">
          <div className="text-[48px] font-bold leading-[1.05] tracking-[-0.02em]">Сәлем!</div>
          <div className="mt-2.5 text-2xl font-medium leading-[1.25] text-slate-deep">
            Я буду следить,
            <br />
            чтобы ты не уснул
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {features.map(({ label, Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-2 py-3">
              <Icon size={28} color="#137C89" />
              <div className="text-base font-medium">{label}</div>
            </div>
          ))}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-warn/60 bg-[#FCE5D4] px-4 py-3 text-[15px] leading-[1.35] text-navy">
            {errorText[error]}
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-2.5 px-1">
            <LockIcon size={20} color="#2C7A4F" className="mt-px shrink-0" />
            <div className="text-[15px] leading-[1.35] text-slate">Камера работает только на телефоне. Видео никуда не отправляется.</div>
          </div>
        )}

        <div className="min-h-4 grow" />

        <button
          onClick={() => {
            unlockAudio()
            setDiag({ kind: 'real' })
          }}
          className="mb-3 flex h-10 items-center justify-center gap-2 self-center rounded-full border border-slate-line px-4 text-[15px] font-medium text-slate-deep active:scale-95"
        >
          <WrenchIcon size={18} color="#137C89" />
          Диагностика машины
        </button>

        <button
          onClick={start}
          disabled={busy}
          className="flex h-[76px] items-center justify-center gap-3 rounded-[22px] bg-teal text-[28px] font-bold text-navy shadow-[0_10px_24px_rgba(27,154,170,0.35)] transition active:scale-[0.97] disabled:opacity-60"
        >
          {error ? 'Попробовать снова' : 'Поехали'}
          <ArrowRightIcon size={28} color="#0F2236" width={2.6} />
        </button>
        {error ? (
          <button onClick={() => onStart(null)} className="mt-3 text-[15px] text-slate underline">
            Продолжить без камеры
          </button>
        ) : (
          <div className="mt-3 text-center text-[15px] text-slate">Поставь телефон в держатель экраном к себе</div>
        )}
      </div>

      {diag && (
        <DiagnosticsScreen
          mode={diag}
          onClose={() => setDiag(null)}
          onTalk={() => {
            setDiag(null)
            say(diagPhrases.talk, { interrupt: true })
          }}
        />
      )}
    </div>
  )
}
