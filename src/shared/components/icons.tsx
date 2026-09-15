import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

// ─── Common ───

export function IcoChevronRight(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IcoClose(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Social ───

export function IcoKakao(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" {...props}>
      <path
        d="M9 1C4.58 1 1 3.79 1 7.21C1 9.34 2.56 11.2 4.86 12.24L3.89 15.73C3.83 15.95 4.08 16.13 4.27 16L8.27 13.37C8.51 13.39 8.75 13.41 9 13.41C13.42 13.41 17 10.62 17 7.21C17 3.79 13.42 1 9 1Z"
        fill="#191919"
      />
    </svg>
  )
}

export function IcoEmail(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="white" strokeWidth="1.5" />
      <path d="M2 7L12 13L22 7" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function IcoNaver(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M13.56 10.7L6.15 0H0V20H6.44V9.3L13.85 20H20V0H13.56V10.7Z" fill="white" />
    </svg>
  )
}

export function IcoFacebook(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M13.397 20.997V12.801H16.162L16.573 9.592H13.397V7.548C13.397 6.622 13.655 5.988 14.984 5.988H16.668V3.127C15.849 3.039 15.025 2.997 14.201 3C11.757 3 10.079 4.492 10.079 7.231V9.586H7.332V12.795H10.085V20.997H13.397Z"
        fill="white"
      />
    </svg>
  )
}

export function IcoApple(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M17.05 20.28C16.07 21.23 15 21.08 13.97 20.63C12.88 20.17 11.88 20.15 10.73 20.63C9.29 21.25 8.53 21.07 7.67 20.28C2.79 15.25 3.51 7.59 9.05 7.31C10.4 7.38 11.34 8.05 12.13 8.11C13.31 7.87 14.44 7.18 15.7 7.27C17.21 7.39 18.35 7.99 19.1 9.07C15.98 10.94 16.72 15.05 19.58 16.2C18.97 17.82 18.17 19.42 17.04 20.29L17.05 20.28ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3C16.06 5.58 13.43 7.5 12.03 7.25Z"
        fill="white"
      />
    </svg>
  )
}

// ─── Dock Navigation ───

export function IcoHome({ active, ...props }: IconProps & { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
        fill={active ? 'var(--color-primary)' : 'none'}
        stroke={active ? 'var(--color-primary)' : 'var(--color-neutral-900)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IcoReviews({ active, ...props }: IconProps & { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 3.25C7.72 3.25 4.25 6.77 4.25 11.1C4.25 12.55 4.64 13.94 5.38 15.15L4.46 18.77L8.15 18.02C9.28 18.66 10.6 19 12 19C16.28 19 19.75 15.48 19.75 11.15C19.75 6.82 16.28 3.25 12 3.25Z"
        fill={active ? 'var(--color-primary)' : 'none'}
        stroke={active ? 'var(--color-primary)' : 'var(--color-neutral-900)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.25 9.35H15.75M8.25 12.65H13.6"
        stroke={active ? 'white' : 'var(--color-neutral-900)'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IcoNearby({ active, ...props }: IconProps & { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
        fill={active ? 'var(--color-primary)' : 'none'}
        stroke={active ? 'var(--color-primary)' : 'var(--color-neutral-900)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="9"
        r="2.5"
        fill={active ? 'white' : 'none'}
        stroke={active ? 'white' : 'var(--color-neutral-900)'}
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function IcoTickets({ active, ...props }: IconProps & { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
      <rect
        x="4.25"
        y="3.75"
        width="15.5"
        height="16.5"
        rx="2.5"
        fill={active ? 'var(--color-primary)' : 'none'}
        stroke={active ? 'var(--color-primary)' : 'var(--color-neutral-900)'}
        strokeWidth="1.8"
      />
      <path
        d="M8.25 8.5H15.75M8.25 12H14.1M8.25 15.5H12.25"
        stroke={active ? 'white' : 'var(--color-neutral-900)'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IcoMyPage({ active, ...props }: IconProps & { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
      <circle
        cx="12"
        cy="8"
        r="4"
        fill={active ? 'var(--color-primary)' : 'none'}
        stroke={active ? 'var(--color-primary)' : 'var(--color-neutral-900)'}
        strokeWidth="1.8"
      />
      <path
        d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20V21H4V20Z"
        fill={active ? 'var(--color-primary)' : 'none'}
        stroke={active ? 'var(--color-primary)' : 'var(--color-neutral-900)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
