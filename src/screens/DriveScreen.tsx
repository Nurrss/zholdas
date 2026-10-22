import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { config } from '../config'
import { DriveMap } from '../components/DriveMap'
import { NavCard } from '../components/NavCard'
import { ZholdasAvatar, loadCorner, type AvatarState, type ChipTone } from '../components/ZholdasAvatar'
import { TalkSheet, type TalkAction } from '../components/TalkSheet'
import { TestPanel } from '../components/TestPanel'
import { AlarmOverlay, WarningBackdrop, WarningCard, type WarningKind } from '../components/Overlays'
import { CameraIcon, ClockIcon } from '../components/Icons'
import type { TripSummary } from './SummaryScreen'
import { DiagnosticsScreen, type DiagMode } from './DiagnosticsScreen'
import { routeLength } from '../lib/route'
import { formatClock, formatHoursMin } from '../lib/format'
import { chatPhrases, diagPhrases, phrases } from '../lib/phrases'
import { beep, say, setSpeakingListener, stopSpeaking, vibrate } from '../lib/voice'
import { keepScreenOn } from '../lib/wakeLock'
import { useDriverMonitor, type MonitorStatus } from '../lib/useDriverMonitor'
import type { DriverEvent } from '../lib/driverMonitor'

const chipFor: Record<MonitorStatus, { label: string; tone: ChipTone }> = {
  off: { label: 'Без камеры', tone: 'idle' },
  loading: { label: 'Загрузка…', tone: 'idle' },
  calibrating: { label: 'Смотри прямо', tone: 'ok' },
  watching: { label: 'Слежу', tone: 'ok' },
  noface: { label: 'Не вижу', tone: 'warn' },
  error: { label: 'Нет камеры', tone: 'idle' },
}

export type TripStats = { alarms: number; yawns: number; phone: number; side: number }

type TalkTopic = 'chat' | 'yawn' | 'tea'
type Talk = { topic: TalkTopic; text: string; fromTap: boolean }

type Props = { stream: MediaStream | null; onEnd: (trip: TripSummary) => void }

export function DriveScreen({ stream, onEnd }: Props) {
  const startedAt = useRef(performance.now())
  const metersPerSec = (config.demoSpeedKmh / 3.6) * config.demoSpeedMultiplier

  // Fake drive: distance only depends on time
  const getMeters = useCallback(
    () => Math.min(routeLength, ((performance.now() - startedAt.current) / 1000) * metersPerSec),
    [metersPerSec],
  )

  const [meters, setMeters] = useState(0)
  const [tripSec, setTripSec] = useState(0)
  const [speed, setSpeed] = useState(config.demoSpeedKmh)

  useEffect(() => {
    const id = setInterval(() => {
      setMeters(getMeters())
      setTripSec((performance.now() - startedAt.current) / 1000)
      setSpeed(getMeters() >= routeLength ? 0 : config.demoSpeedKmh + Math.round(Math.random() * 4 - 2))
    }, 1000)
    return () => clearInterval(id)
  }, [getMeters])

  useEffect(() => keepScreenOn(), [])

  // --- Camera video ---
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  useEffect(() => {
    if (!video || !stream) return
    video.srcObject = stream
    void video.play().catch(() => {})
  }, [video, stream])

  // --- Voice and the short text bubble ---
  const [speaking, setSpeaking] = useState(false)
  const [bubble, setBubble] = useState<string | null>(null)
  const bubbleTimer = useRef<number>()
  useEffect(() => {
    setSpeakingListener(setSpeaking)
    say(phrases.start)
    return () => stopSpeaking()
  }, [])

  const showBubble = useCallback((text: string) => {
    setBubble(text)
    clearTimeout(bubbleTimer.current)
    bubbleTimer.current = window.setTimeout(() => setBubble(null), config.speechBubbleSec * 1000)
  }, [])

  const talk = useCallback(
    (text: string, interrupt = false) => {
      if (say(text, { interrupt })) showBubble(text)
    },
    [showBubble],
  )

  // --- Talk sheet ---
  const [talkSheet, setTalkSheet] = useState<Talk | null>(null)
  const [fuelAt, setFuelAt] = useState<number | null>(null)
  const talkTimer = useRef<number>()
  const lastChat = useRef(-1)

  const nextChat = () => {
    let i = Math.floor(Math.random() * chatPhrases.length)
    if (i === lastChat.current) i = (i + 1) % chatPhrases.length
    lastChat.current = i
    return chatPhrases[i]
  }

  const openTalk = useCallback(
    (topic: TalkTopic, text: string, fromTap = false) => {
      clearTimeout(talkTimer.current)
      setTalkSheet({ topic, text, fromTap })
      say(text, { interrupt: true })
      if (topic === 'tea') setFuelAt(getMeters() + 12000)
      // Opened by itself -> closes by itself, so the map is free again
      if (!fromTap) talkTimer.current = window.setTimeout(() => setTalkSheet(null), config.talkAutoCloseSec * 1000)
    },
    [getMeters],
  )

  const closeTalk = () => {
    clearTimeout(talkTimer.current)
    stopSpeaking()
    if (talkSheet?.topic === 'tea') setFuelAt(null)
    setTalkSheet(null)
  }

  // --- Alarm and warning ---
  const [stats, setStats] = useState<TripStats>({ alarms: 0, yawns: 0, phone: 0, side: 0 })
  const yawnCount = useRef(0)
  const [alarm, setAlarm] = useState(false)
  const [alarmSound, setAlarmSound] = useState(false) // on while eyes are closed
  const alarmCloseTimer = useRef<number>()
  const [warning, setWarning] = useState<WarningKind | null>(null)
  const warningShownAt = useRef(0)
  const warningTimer = useRef<number>()

  // While eyes are closed: beep, vibrate and repeat the phrase
  useEffect(() => {
    if (!alarmSound) return
    const ring = () => {
      beep()
      vibrate([400, 100, 400])
      say(phrases.alarm, { interrupt: true })
    }
    ring()
    const id = setInterval(ring, config.alarmBeepEverySec * 1000)
    return () => clearInterval(id)
  }, [alarmSound])

  const closeAlarm = useCallback(() => {
    clearTimeout(alarmCloseTimer.current)
    setAlarm(false)
    setAlarmSound(false)
  }, [])

  const startAlarm = useCallback(() => {
    clearTimeout(alarmCloseTimer.current)
    clearTimeout(talkTimer.current)
    setTalkSheet(null)
    setWarning(null)
    setAlarm(true)
    setAlarmSound(true)
    setStats((s) => ({ ...s, alarms: s.alarms + 1 }))
  }, [])

  const startWarning = useCallback((kind: WarningKind) => {
    clearTimeout(warningTimer.current)
    warningShownAt.current = performance.now()
    setWarning(kind)
    setStats((s) => ({ ...s, [kind]: s[kind] + 1 }))
    say(kind === 'phone' ? phrases.phone : phrases.side, { interrupt: true })
    vibrate(300)
  }, [])

  const endWarning = useCallback(() => {
    const shown = performance.now() - warningShownAt.current
    const wait = Math.max(0, config.warningMinShowSec * 1000 - shown)
    clearTimeout(warningTimer.current)
    warningTimer.current = window.setTimeout(() => setWarning(null), wait)
  }, [])

  const onYawn = useCallback(() => {
    yawnCount.current += 1
    setStats((s) => ({ ...s, yawns: s.yawns + 1 }))
    const tired = yawnCount.current % config.yawnsBeforeStopAdvice === 0
    if (tired) openTalk('tea', phrases.yawnStop)
    else openTalk('yawn', phrases.yawn)
  }, [openTalk])

  const onDriverEvent = useCallback(
    (e: DriverEvent) => {
      switch (e) {
        case 'calibrated':
          showBubble('Готово! Я слежу за тобой.')
          break
        case 'alarmStart':
          startAlarm()
          break
        case 'eyesOpen':
          // Sound stops now; the red screen closes by itself a bit later
          setAlarmSound(false)
          stopSpeaking()
          alarmCloseTimer.current = window.setTimeout(() => setAlarm(false), config.alarmAutoCloseSec * 1000)
          break
        case 'headDown':
          if (!alarm) startWarning('phone')
          break
        case 'lookSide':
          if (!alarm) startWarning('side')
          break
        case 'headUp':
        case 'lookBack':
          endWarning()
          break
        case 'yawn':
          onYawn()
          break
        case 'noFace':
          talk(phrases.noFace)
          break
      }
    },
    [alarm, startAlarm, startWarning, endWarning, onYawn, talk, showBubble],
  )

  // --- Pause ---
  const [pausedUntil, setPausedUntil] = useState<number | null>(null)
  const paused = pausedUntil !== null
  const pauseLeftSec = paused ? Math.max(0, (pausedUntil - performance.now()) / 1000) : 0

  useEffect(() => {
    if (pausedUntil === null) return
    const id = setTimeout(() => {
      setPausedUntil(null)
      talk(phrases.resume)
    }, pausedUntil - performance.now())
    return () => clearTimeout(id)
  }, [pausedUntil, talk])

  // --- Car diagnostics (on top of the drive, so the trip keeps going) ---
  const [diag, setDiag] = useState<DiagMode | null>(null)
  const openDiag = (mode: DiagMode) => {
    clearTimeout(talkTimer.current)
    stopSpeaking()
    setTalkSheet(null)
    setWarning(null)
    setDiag(mode)
  }

  // Camera button moves to the right side when the avatar is in the top-left corner
  const [avatarTopLeft, setAvatarTopLeft] = useState(() => loadCorner() === 'tl')

  // --- Hidden test panel (long press on trip time) ---
  const [testOpen, setTestOpen] = useState(false)
  const longPress = useRef<number>()
  const pressStart = () => {
    longPress.current = window.setTimeout(() => {
      vibrate(30)
      setTestOpen(true)
    }, 700)
  }
  const pressEnd = () => clearTimeout(longPress.current)

  const testSleep = () => {
    // Like real eyes closed: sound for a few seconds, then like eyes opened
    startAlarm()
    clearTimeout(alarmCloseTimer.current)
    alarmCloseTimer.current = window.setTimeout(() => {
      setAlarmSound(false)
      stopSpeaking()
      alarmCloseTimer.current = window.setTimeout(() => setAlarm(false), config.alarmAutoCloseSec * 1000)
    }, 4000)
  }
  const testWarning = (kind: WarningKind) => {
    startWarning(kind)
    clearTimeout(warningTimer.current)
    warningTimer.current = window.setTimeout(() => setWarning(null), 3000)
  }

  // No face detection during the pause and the engine check (the car is standing)
  const status = useDriverMonitor(video, !!stream && !paused && !diag, onDriverEvent)
  const chip = paused ? { label: `Пауза ${formatClock(pauseLeftSec)}`, tone: 'idle' as const } : chipFor[status]

  const avatarState: AvatarState = paused ? 'paused' : speaking ? 'talk' : 'calm'
  const overlayOpen = alarm || warning !== null || talkSheet !== null

  // Green button in the Talk sheet
  const primaryAction = (t: Talk): TalkAction | null => {
    if (t.topic === 'tea')
      return {
        label: 'Да, на чай',
        onClick: () => {
          clearTimeout(talkTimer.current)
          setTalkSheet(null)
          talk(phrases.teaYes, true)
        },
      }
    if (t.topic === 'yawn') return { label: 'Давай', onClick: () => openTalk('chat', nextChat(), true) }
    return { label: 'Ещё', onClick: () => openTalk('chat', nextChat(), true) }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0A1724] text-white">
      <DriveMap getMeters={getMeters} fuelAt={fuelAt} />

      {/* Navigation card (small during the warning, hidden during Talk) */}
      <motion.div
        className="absolute inset-x-4 top-[max(16px,env(safe-area-inset-top))] z-[35]"
        animate={{ opacity: talkSheet ? 0 : 1, y: talkSheet ? -30 : 0 }}
        transition={{ duration: 0.25 }}
      >
        <NavCard meters={meters} compact={warning !== null} />
      </motion.div>

      {/* Camera preview button (useful on stage) */}
      {stream && (
        <div
          className={`absolute top-[calc(max(16px,env(safe-area-inset-top))+152px)] z-20 flex flex-col gap-2 ${
            avatarTopLeft ? 'right-4 items-end' : 'left-4 items-start'
          }`}
        >
          <button
            onClick={() => setShowPreview((v) => !v)}
            aria-label={showPreview ? 'Скрыть камеру' : 'Показать камеру'}
            className={`flex h-11 w-11 items-center justify-center rounded-full border border-[#1E3A55] active:scale-95 ${
              showPreview ? 'bg-teal' : 'bg-navy'
            }`}
          >
            <CameraIcon size={22} color={showPreview ? '#0F2236' : '#5FC7D4'} />
          </button>
          {/* The video is always on (needed for detection), only hidden */}
          <video
            ref={setVideo}
            autoPlay
            playsInline
            muted
            className={`-scale-x-100 rounded-2xl border-[3px] border-teal-light object-cover shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all ${
              showPreview ? 'h-40 w-[120px] opacity-100' : 'pointer-events-none h-px w-px opacity-0'
            }`}
          />
        </div>
      )}

      <ZholdasAvatar
        state={avatarState}
        hidden={overlayOpen}
        chip={chip}
        bubble={overlayOpen ? null : bubble}
        onTap={() => openTalk('chat', nextChat(), true)}
        onCornerChange={(c) => setAvatarTopLeft(c === 'tl')}
      />

      {/* Bottom bar: trip time and speed. Long press on the time -> test panel. */}
      <div className="absolute inset-x-0 bottom-0 z-[35] border-t border-[#1E3A55] bg-navy pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-16 items-center justify-between px-5">
          <div
            className="flex items-center gap-2.5"
            onPointerDown={pressStart}
            onPointerUp={pressEnd}
            onPointerLeave={pressEnd}
            onPointerCancel={pressEnd}
            onContextMenu={(e) => e.preventDefault()}
          >
            <ClockIcon size={22} color="#5FC7D4" />
            <div className="text-2xl font-semibold tabular-nums">{formatHoursMin(tripSec)}</div>
            <div className="text-sm text-[#8FB3C4]">в пути</div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <div className="text-[32px] font-bold tabular-nums tracking-[-0.02em]">{speed}</div>
            <div className="text-base text-[#8FB3C4]">км/ч</div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {warning && !alarm && <WarningBackdrop key="warn-bg" />}
        {warning && !alarm && <WarningCard key={`warn-${warning}`} kind={warning} onClose={() => setWarning(null)} />}
        {talkSheet && !alarm && (
          <TalkSheet
            key="talk"
            text={talkSheet.text}
            speaking={speaking}
            primary={primaryAction(talkSheet)}
            onLater={closeTalk}
            onRepeat={() => {
              stopSpeaking()
              say(talkSheet.text, { interrupt: true })
            }}
            menu={
              talkSheet.fromTap
                ? {
                    paused,
                    onPause: () => {
                      setPausedUntil(performance.now() + config.pauseMin * 60 * 1000)
                      setWarning(null)
                      setTalkSheet(null)
                      talk(phrases.pause, true)
                    },
                    onResume: () => {
                      setPausedUntil(null)
                      setTalkSheet(null)
                      talk(phrases.resume, true)
                    },
                    onEnd: () => {
                      stopSpeaking()
                      onEnd({ ...stats, tripSec, km: getMeters() / 1000 })
                    },
                    onCheckCar: () => openDiag({ kind: 'real' }),
                  }
                : null
            }
          />
        )}
        {testOpen && (
          <TestPanel
            key="test"
            onClose={() => setTestOpen(false)}
            actions={[
              { label: 'Тест: сон', color: 'bg-alarm text-white', onClick: testSleep },
              { label: 'Тест: телефон', color: 'bg-warn text-navy', onClick: () => testWarning('phone') },
              { label: 'Тест: взгляд в сторону', color: 'bg-warn text-navy', onClick: () => testWarning('side') },
              { label: 'Тест: зевок', color: 'bg-teal text-navy', onClick: onYawn },
              { label: '2 часа за рулём', color: 'bg-white/10 text-white', onClick: () => openTalk('tea', phrases.longDrive) },
              { label: 'Тест: мотор ОК', color: 'bg-ok text-navy', onClick: () => openDiag({ kind: 'test', scenario: 'ok' }) },
              { label: 'Тест: мотор проблема', color: 'bg-warn text-navy', onClick: () => openDiag({ kind: 'test', scenario: 'problem' }) },
            ]}
          />
        )}
        {alarm && (
          <AlarmOverlay
            key="alarm"
            onOk={() => {
              closeAlarm()
              talk(phrases.okAfterAlarm, true)
            }}
            onFindStop={() => {
              closeAlarm()
              talk(phrases.findStop, true)
            }}
          />
        )}
      </AnimatePresence>

      {diag && (
        <DiagnosticsScreen
          mode={diag}
          onClose={() => setDiag(null)}
          onTalk={() => {
            setDiag(null)
            openTalk('chat', diagPhrases.talk, true)
          }}
        />
      )}
    </div>
  )
}
