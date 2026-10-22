import { config } from '../config'

// Engine sound check with the microphone. Everything stays on the phone.

export type EngineSample = {
  bands: number[] // "fingerprint": loudness in each frequency band, unit length
  knocks: number // sudden loud peaks
  wave: number[] // loudness every 100 ms (0..1), for the picture
  recordedAt: number // Date.now()
}

export type EngineResult = {
  status: 'baseline' | 'ok' | 'problem'
  similarity: number // 1 = same sound
  before: EngineSample | null
  now: EngineSample
}

const BASELINE_KEY = 'zholdas.engineBaseline'

export class MicError extends Error {}
export class QuietError extends Error {} // nothing heard: do not save silence as "normal"

// Records the engine for `config.diagSec` seconds. `onProgress` gets seconds done.
export async function recordEngine(onProgress: (sec: number) => void, signal: AbortSignal): Promise<EngineSample> {
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      // Raw sound: phone "voice" filters would remove the engine noise
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })
  } catch {
    throw new MicError('no microphone')
  }

  const ctx = new AudioContext()
  await ctx.resume()
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 4096 // ~12 Hz per bin: enough for low engine sounds
  analyser.smoothingTimeConstant = 0
  ctx.createMediaStreamSource(stream).connect(analyser)

  const binHz = ctx.sampleRate / analyser.fftSize
  const freq = new Float32Array(analyser.frequencyBinCount)
  const time = new Float32Array(analyser.fftSize)
  const n = config.engineBands
  const edges = Array.from({ length: n + 1 }, (_, i) => config.engineMinHz * (config.engineMaxHz / config.engineMinHz) ** (i / n))
  const bandPower = new Array<number>(n).fill(0)

  const wave: number[] = []
  let frames = 0
  let rmsSum = 0
  let knocks = 0
  let lastKnock = -Infinity
  const started = performance.now()

  try {
    await new Promise<void>((resolve, reject) => {
      const id = setInterval(() => {
        if (signal.aborted) {
          clearInterval(id)
          reject(new DOMException('cancelled', 'AbortError'))
          return
        }
        const t = (performance.now() - started) / 1000

        // 1. Spectrum -> power in each band
        analyser.getFloatFrequencyData(freq)
        for (let b = 0; b < n; b++) {
          let from = Math.floor(edges[b] / binHz)
          const to = Math.max(from + 1, Math.ceil(edges[b + 1] / binHz))
          from = Math.min(from, freq.length - 1)
          let p = 0
          for (let k = from; k < Math.min(to, freq.length); k++) p += 10 ** (freq[k] / 10)
          bandPower[b] += p
        }

        // 2. Loudness and knocks
        analyser.getFloatTimeDomainData(time)
        let peak = 0
        let sq = 0
        for (const x of time) {
          peak = Math.max(peak, Math.abs(x))
          sq += x * x
        }
        const rms = Math.sqrt(sq / time.length)
        frames++
        rmsSum += rms
        const avg = rmsSum / frames
        // Wait 1 s, so the average level is known
        if (t > 1 && peak > 0.02 && peak > avg * config.knockPeakFactor && t - lastKnock > config.knockMinGapSec) {
          knocks++
          lastKnock = t
        }
        wave.push(peak)

        onProgress(Math.min(config.diagSec, t))
        if (t >= config.diagSec) {
          clearInterval(id)
          resolve()
        }
      }, 100)
    })
  } finally {
    stream.getTracks().forEach((tr) => tr.stop())
    void ctx.close()
  }

  if (rmsSum / Math.max(1, frames) < config.engineMinLevel) throw new QuietError('too quiet')

  const amp = bandPower.map((p) => Math.sqrt(p / Math.max(1, frames)))
  const max = Math.max(...wave, 1e-6)
  return {
    bands: unit(amp),
    knocks,
    wave: wave.map((v) => Math.round((v / max) * 100) / 100),
    recordedAt: Date.now(),
  }
}

function unit(v: number[]): number[] {
  const len = Math.hypot(...v) || 1
  return v.map((x) => x / len)
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0
  for (let i = 0; i < Math.min(a.length, b.length); i++) dot += a[i] * b[i]
  return dot // both are unit length
}

export function loadBaseline(): EngineSample | null {
  try {
    const raw = localStorage.getItem(BASELINE_KEY)
    return raw ? (JSON.parse(raw) as EngineSample) : null
  } catch {
    return null
  }
}

function saveBaseline(s: EngineSample) {
  try {
    localStorage.setItem(BASELINE_KEY, JSON.stringify(s))
  } catch {
    // storage may be full or blocked
  }
}

// First check saves the "normal" sound. Next checks compare with it.
export function judgeEngine(now: EngineSample): EngineResult {
  const before = loadBaseline()
  if (!before) {
    saveBaseline(now)
    return { status: 'baseline', similarity: 1, before: null, now }
  }
  const similarity = cosine(before.bands, now.bands)
  const newKnocks = now.knocks >= config.knocksForProblem && now.knocks > before.knocks + 1
  const status = similarity < config.engineSimilarityOk || newKnocks ? 'problem' : 'ok'
  return { status, similarity, before, now }
}

// Fake samples for the test buttons (no microphone): like the pictures in the design
export function demoResult(scenario: 'ok' | 'problem'): EngineResult {
  const week = 7 * 24 * 3600 * 1000
  const smooth = (seed: number) => Array.from({ length: 150 }, (_, i) => 0.5 + 0.12 * Math.sin(i * 0.9 + seed) + 0.04 * Math.sin(i * 0.31))
  const withKnocks = smooth(1).map((v, i) => (i % 37 === 30 ? 1 : i % 37 === 31 ? 0.05 : v))
  const bands = unit(Array.from({ length: config.engineBands }, (_, i) => 1 / (1 + i * 0.3)))
  const before: EngineSample = { bands, knocks: 0, wave: smooth(0), recordedAt: Date.now() - week }
  const now: EngineSample =
    scenario === 'ok'
      ? { bands, knocks: 0, wave: smooth(0.5), recordedAt: Date.now() }
      : { bands: unit(bands.map((b, i) => (i > 20 ? b * 3 : b))), knocks: 4, wave: withKnocks, recordedAt: Date.now() }
  return { status: scenario, similarity: scenario === 'ok' ? 0.98 : 0.71, before, now }
}
