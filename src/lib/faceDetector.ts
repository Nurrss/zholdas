import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

// MediaPipe prints normal INFO/warning lines with console.error. Hide them.
const consoleError = console.error.bind(console)
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && /^(INFO:|[IW]\d{4} |Graph successfully)/.test(args[0])) return
  consoleError(...args)
}

// Model and WASM files are in public/, so nothing is loaded from Google.
export async function createFaceLandmarker(): Promise<FaceLandmarker> {
  const base = import.meta.env.BASE_URL
  const fileset = await FilesetResolver.forVisionTasks(`${base}mediapipe/wasm`)
  const options = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: `${base}models/face_landmarker.task`, delegate },
    runningMode: 'VIDEO' as const,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true, // head rotation (yaw)
    numFaces: 1,
  })
  try {
    return await FaceLandmarker.createFromOptions(fileset, options('GPU'))
  } catch {
    // Some phones have no WebGL2 -> use CPU
    return await FaceLandmarker.createFromOptions(fileset, options('CPU'))
  }
}
