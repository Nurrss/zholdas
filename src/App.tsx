import { useState } from 'react'
import { StartScreen } from './screens/StartScreen'
import { DriveScreen } from './screens/DriveScreen'
import { SummaryScreen, type TripSummary } from './screens/SummaryScreen'
import { stopStream } from './lib/camera'

type Screen = 'start' | 'drive' | 'summary'

export default function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [trip, setTrip] = useState<TripSummary | null>(null)

  if (screen === 'start')
    return (
      <StartScreen
        onStart={(s) => {
          setStream(s)
          setScreen('drive')
        }}
      />
    )
  if (screen === 'summary' && trip) return <SummaryScreen trip={trip} onNewTrip={() => setScreen('start')} />
  return (
    <DriveScreen
      stream={stream}
      onEnd={(t) => {
        stopStream(stream)
        setStream(null)
        setTrip(t)
        setScreen('summary')
      }}
    />
  )
}
