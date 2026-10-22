import { useState } from 'react'

export type AvatarMood = 'calm' | 'watching' | 'alert' | 'talk' | 'listen' | 'ok' | 'problem'

// Shows public/avatar/<mood>.png cropped in a circle. If the file is missing, shows a placeholder.
export function Avatar({ mood = 'calm', size = 88, className = '' }: { mood?: AvatarMood; size?: number; className?: string }) {
  const [missing, setMissing] = useState<Record<string, boolean>>({})
  const src = `${import.meta.env.BASE_URL}avatar/${mood}.png`

  if (missing[mood]) return <AvatarPlaceholder mood={mood} size={size} />
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="Жолдас"
      draggable={false}
      className={`block rounded-full bg-[#EEEEEE] object-cover ${className}`}
      style={{ width: size, height: size }}
      onError={() => setMissing((m) => ({ ...m, [mood]: true }))}
    />
  )
}

function AvatarPlaceholder({ mood, size }: { mood: AvatarMood; size: number }) {
  const eyeR = mood === 'alert' ? 9 : 7
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Жолдас">
      <circle cx="50" cy="50" r="46" fill="#1B9AAA" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#5FC7D4" strokeWidth="4" />
      <g fill="#0F2236">
        <circle cx="36" cy="44" r={eyeR} />
        <circle cx="64" cy="44" r={eyeR} />
        <circle cx="38.5" cy="41.5" r="2.4" fill="#fff" />
        <circle cx="66.5" cy="41.5" r="2.4" fill="#fff" />
      </g>
      {mood === 'talk' || mood === 'alert' ? (
        <ellipse cx="50" cy="68" rx="9" ry="7" fill="#0F2236" />
      ) : (
        <path d="M38 64 q12 10 24 0" stroke="#0F2236" strokeWidth="5" strokeLinecap="round" fill="none" />
      )}
    </svg>
  )
}
