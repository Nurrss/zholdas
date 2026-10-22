// Line icons from the design (24×24, stroke).
type P = { size?: number; color?: string; width?: number; className?: string }

function Svg({ size = 24, color = 'currentColor', width = 2, className, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

export const EyeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
)
export const TrendIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 18l6-6 4 4 8-8" />
    <path d="M15 8h6v6" />
  </Svg>
)
export const YawnIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <ellipse cx="12" cy="15" rx="3" ry="2.5" />
    <path d="M8 9h.01M16 9h.01" />
  </Svg>
)
export const LockIcon = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Svg>
)
export const ArrowRightIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
)
export const ClockIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
)
export const WarningIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l9.5 17h-19z" />
    <path d="M12 10v4M12 17h.01" />
  </Svg>
)
export const CupIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
    <path d="M16 10h2a2 2 0 0 1 0 4h-2" />
    <path d="M8 2v3M12 2v3" />
  </Svg>
)
export const TurnRightIcon = (p: P) => (
  <Svg {...p}>
    <path d="M7 21V12a4 4 0 0 1 4-4h8" />
    <path d="M15 4l4 4-4 4" />
  </Svg>
)
export const TurnLeftIcon = (p: P) => (
  <Svg {...p}>
    <path d="M17 21V12a4 4 0 0 0-4-4H5" />
    <path d="M9 4L5 8l4 4" />
  </Svg>
)
export const StraightIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 21V4" />
    <path d="M6 10l6-6 6 6" />
  </Svg>
)
export const FlagIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5 21V4h11l-2 4 2 4H5" />
  </Svg>
)
export const ClosedEyeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M2 12s3.5 4 10 4 10-4 10-4" />
    <path d="M5 15l-2 2M19 15l2 2M12 16v3" />
  </Svg>
)
export const PinIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Svg>
)
export const PhoneIcon = (p: P) => (
  <Svg {...p}>
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <path d="M11 18h2" />
  </Svg>
)
// Eye with an arrow to the side
export const SideLookIcon = (p: P) => (
  <Svg {...p}>
    <path d="M1.5 12s3-6 8.5-6 8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6z" />
    <circle cx="10" cy="12" r="2.5" />
    <path d="M17 8.5h5.5M20 6l2.5 2.5L20 11" />
  </Svg>
)
export const MicIcon = (p: P) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Svg>
)
export const CameraIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="13" r="3.5" />
  </Svg>
)
export const PauseIcon = (p: P) => (
  <Svg {...p}>
    <path d="M9 5v14M15 5v14" />
  </Svg>
)
export const PlayIcon = (p: P) => (
  <Svg {...p}>
    <path d="M7 4l13 8-13 8z" />
  </Svg>
)
export const StopIcon = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </Svg>
)
export const BackIcon = (p: P) => (
  <Svg {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
)
export const CheckIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5 12l5 5 9-10" />
  </Svg>
)
export const BluetoothIcon = (p: P) => (
  <Svg {...p}>
    <path d="M7 7l10 10-5 5V2l5 5L7 17" />
  </Svg>
)
export const CalendarIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
)
export const EngineIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 10h3l2-3h6v3h2l2 2v5h-2v2h-4l-2-2H7v-3H4z" />
  </Svg>
)
export const WrenchIcon = (p: P) => (
  <Svg {...p}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />
  </Svg>
)
