import { config } from '../config'

// Rules from the config, without camera code. Time `t` is in seconds.

export type FaceSample = {
  blinkLeft: number
  blinkRight: number
  jawOpen: number
  ratio: number // dist(nose, midEye) / dist(midEye, chin); bigger = head more down
  yaw: number | null // head turn left/right in degrees (null if unknown)
}

export type DriverEvent =
  | 'calibrated'
  | 'alarmStart' // eyes closed too long
  | 'eyesOpen' // eyes open again after alarm
  | 'headDown' // looking at the phone too long
  | 'headUp'
  | 'lookSide' // looking to the side too long
  | 'lookBack'
  | 'yawn'
  | 'noFace'
  | 'faceBack'

export class DriverMonitor {
  private startedAt: number | null = null
  private lastFaceAt: number | null = null
  private noFace = false

  private calibStart: number | null = null
  private calibRatios: number[] = []
  private calibYaws: number[] = []
  baseline: number | null = null
  baselineYaw = 0

  private closedSince: number | null = null
  alarm = false

  private headDownSince: number | null = null
  private headDown = false

  private sideSince: number | null = null
  private side = false

  private jawSince: number | null = null
  private yawnCounted = false

  get calibrating() {
    return this.baseline === null
  }

  update(face: FaceSample | null, t: number): DriverEvent[] {
    const events: DriverEvent[] = []
    this.startedAt ??= t

    if (!face) {
      const since = this.lastFaceAt ?? this.startedAt
      if (!this.noFace && t - since >= config.noFaceSec) {
        this.noFace = true
        events.push('noFace')
      }
      // Timers stop, but an alarm stays on until we see open eyes
      this.closedSince = this.headDownSince = this.sideSince = this.jawSince = null
      return events
    }

    if (this.noFace) {
      this.noFace = false
      events.push('faceBack')
    }
    this.lastFaceAt = t

    // 1. Calibration: driver looks straight for the first seconds
    if (this.baseline === null) {
      this.calibStart ??= t
      this.calibRatios.push(face.ratio)
      if (face.yaw !== null) this.calibYaws.push(face.yaw)
      if (t - this.calibStart >= config.calibrationSec) {
        this.baseline = median(this.calibRatios)
        this.baselineYaw = this.calibYaws.length ? median(this.calibYaws) : 0
        events.push('calibrated')
      }
    }
    const headIsDown = this.baseline !== null && face.ratio > this.baseline * config.headDownFactor
    const lookingSide =
      this.baseline !== null && face.yaw !== null && Math.abs(face.yaw - this.baselineYaw) > config.sideYawDeg

    // 2. Eyes closed. Not counted during a yawn (eyes squeeze when yawning).
    const eyeThreshold = headIsDown ? config.eyeClosedThresholdHeadDown : config.eyeClosedThreshold
    const yawning = face.jawOpen > config.yawnThreshold
    const eyesClosed = face.blinkLeft > eyeThreshold && face.blinkRight > eyeThreshold && !yawning
    if (eyesClosed) {
      this.closedSince ??= t
      if (!this.alarm && t - this.closedSince >= config.eyeClosedAlarmSec) {
        this.alarm = true
        events.push('alarmStart')
      }
    } else {
      this.closedSince = null
      if (this.alarm) {
        this.alarm = false
        events.push('eyesOpen')
      }
    }

    // 3. Head down (phone)
    if (headIsDown && !this.alarm) {
      this.headDownSince ??= t
      if (!this.headDown && t - this.headDownSince >= config.headDownWarnSec) {
        this.headDown = true
        events.push('headDown')
      }
    } else {
      this.headDownSince = null
      if (this.headDown) {
        this.headDown = false
        events.push('headUp')
      }
    }

    // 4. Looking to the side (phone has priority)
    if (lookingSide && !headIsDown && !this.alarm) {
      this.sideSince ??= t
      if (!this.side && t - this.sideSince >= config.sideSec) {
        this.side = true
        events.push('lookSide')
      }
    } else {
      this.sideSince = null
      if (this.side) {
        this.side = false
        events.push('lookBack')
      }
    }

    // 5. Yawn: counted once per open mouth
    if (yawning) {
      this.jawSince ??= t
      if (!this.yawnCounted && t - this.jawSince >= config.yawnMinSec) {
        this.yawnCounted = true
        events.push('yawn')
      }
    } else {
      this.jawSince = null
      this.yawnCounted = false
    }

    return events
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}
