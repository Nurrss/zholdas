import { useEffect, useRef, useState } from 'react'
import type { FaceLandmarker, FaceLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { config } from '../config'
import { createFaceLandmarker } from './faceDetector'
import { DriverMonitor, type DriverEvent, type FaceSample } from './driverMonitor'

export type MonitorStatus = 'off' | 'loading' | 'calibrating' | 'watching' | 'noface' | 'error'

function toSample(result: FaceLandmarkerResult, w: number, h: number): FaceSample | null {
  const lm = result.faceLandmarks[0]
  const shapes = result.faceBlendshapes[0]?.categories
  if (!lm || !shapes) return null
  const score = (name: string) => shapes.find((c) => c.categoryName === name)?.score ?? 0

  // Pixel coordinates, so width and height have the same scale
  const p = (l: NormalizedLandmark) => [l.x * w, l.y * h]
  const [nose, eyeL, eyeR, chin] = [lm[1], lm[33], lm[263], lm[152]].map(p)
  const mid = [(eyeL[0] + eyeR[0]) / 2, (eyeL[1] + eyeR[1]) / 2]
  const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1])

  // Yaw from the 4×4 head rotation matrix (column-major): atan2(R[0][2], R[2][2])
  const m = result.facialTransformationMatrixes?.[0]?.data
  const yaw = m ? (Math.atan2(m[8], m[10]) * 180) / Math.PI : null

  return {
    yaw,
    blinkLeft: score('eyeBlinkLeft'),
    blinkRight: score('eyeBlinkRight'),
    jawOpen: score('jawOpen'),
    ratio: dist(nose, mid) / (dist(mid, chin) || 1),
  }
}

// Runs face detection on the video and sends events.
export function useDriverMonitor(
  video: HTMLVideoElement | null,
  enabled: boolean,
  onEvent: (e: DriverEvent) => void,
): MonitorStatus {
  const [status, setStatus] = useState<MonitorStatus>('off')
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!video || !enabled) {
      setStatus('off')
      return
    }
    let stopped = false
    let landmarker: FaceLandmarker | null = null
    let frame = 0
    let lastRun = 0
    let lastVideoTime = -1
    const monitor = new DriverMonitor()
    let calibrating = true
    let noFace = false

    const loop = () => {
      frame = requestAnimationFrame(loop)
      const now = performance.now()
      if (now - lastRun < 1000 / config.detectionFps) return
      if (video.readyState < 2 || video.currentTime === lastVideoTime) return
      lastRun = now
      lastVideoTime = video.currentTime

      const result = landmarker!.detectForVideo(video, now)
      const sample = toSample(result, video.videoWidth, video.videoHeight)
      for (const e of monitor.update(sample, now / 1000)) {
        if (e === 'calibrated') calibrating = false
        if (e === 'noFace') noFace = true
        if (e === 'faceBack') noFace = false
        onEventRef.current(e)
      }
      setStatus(noFace ? 'noface' : calibrating ? 'calibrating' : 'watching')
    }

    setStatus('loading')
    ;(async () => {
      try {
        const created = await createFaceLandmarker()
        if (stopped) return created.close()
        landmarker = created
        frame = requestAnimationFrame(loop)
      } catch (err) {
        console.warn('Face detection failed to start', err)
        if (!stopped) setStatus('error')
      }
    })()

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      landmarker?.close()
    }
  }, [video, enabled])

  return status
}
