import { config } from '../config'

// Voice (speechSynthesis), beep (Web Audio) and vibration.

let audio: AudioContext | null = null
const lastSaid = new Map<string, number>()
let onSpeakingChange: (speaking: boolean) => void = () => {}

// Must be called from a tap (browsers block sound before the first tap)
export function unlockAudio() {
  audio ??= new AudioContext()
  if (audio.state === 'suspended') void audio.resume()
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance('')
    u.volume = 0
    speechSynthesis.speak(u)
  }
}

export function setSpeakingListener(fn: (speaking: boolean) => void) {
  onSpeakingChange = fn
}

function russianVoice(): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices()
  return voices.find((v) => v.lang === 'ru-RU') ?? voices.find((v) => v.lang.startsWith('ru'))
}

// Says the text. Returns false if the same text was said less than `phraseCooldownSec` ago.
export function say(text: string, { interrupt = false } = {}): boolean {
  const now = performance.now()
  const last = lastSaid.get(text) ?? -Infinity
  if (now - last < config.phraseCooldownSec * 1000) return false
  lastSaid.set(text, now)
  if (!('speechSynthesis' in window)) return true

  if (interrupt) speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ru-RU'
  const voice = russianVoice()
  if (voice) u.voice = voice
  u.rate = 1.05
  u.onstart = () => onSpeakingChange(true)
  u.onend = u.onerror = () => onSpeakingChange(speechSynthesis.speaking)
  speechSynthesis.speak(u)
  return true
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) speechSynthesis.cancel()
  onSpeakingChange(false)
}

// Loud double beep
export function beep() {
  if (!audio) return
  const t = audio.currentTime
  for (const start of [0, 0.25]) {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'square'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, t + start)
    gain.gain.exponentialRampToValueAtTime(0.5, t + start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + start + 0.2)
    osc.connect(gain).connect(audio.destination)
    osc.start(t + start)
    osc.stop(t + start + 0.22)
  }
}

export function vibrate(pattern: number | number[]) {
  navigator.vibrate?.(pattern)
}
