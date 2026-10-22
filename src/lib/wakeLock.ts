// Keeps the screen on while driving.
export function keepScreenOn(): () => void {
  let lock: WakeLockSentinel | null = null
  let active = true

  const request = async () => {
    if (!active || document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return
    try {
      lock = await navigator.wakeLock.request('screen')
    } catch {
      // Not allowed (for example, battery saver). The app still works.
    }
  }
  // The lock is lost when the app goes to background, so take it again
  const onVisible = () => void request()

  void request()
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    active = false
    document.removeEventListener('visibilitychange', onVisible)
    void lock?.release()
  }
}
