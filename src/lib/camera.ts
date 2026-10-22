export type CameraError = 'denied' | 'notfound' | 'insecure' | 'other'

// Asks for the front camera. Throws a CameraError.
export async function openFrontCamera(): Promise<MediaStream> {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw 'insecure' as CameraError
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    })
  } catch (e) {
    const name = (e as DOMException)?.name
    if (name === 'NotAllowedError' || name === 'SecurityError') throw 'denied' as CameraError
    if (name === 'NotFoundError' || name === 'OverconstrainedError') throw 'notfound' as CameraError
    throw 'other' as CameraError
  }
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop())
}
