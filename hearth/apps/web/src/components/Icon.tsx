import type { SVGProps } from 'react';

export type IconName =
  | 'running'
  | 'swimming'
  | 'weights'
  | 'fitness-class'
  | 'basketball'
  | 'bell'
  | 'calendar'
  | 'book-open'
  | 'check'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chores'
  | 'cloud'
  | 'cloud-rain'
  | 'cloud-sun'
  | 'cloud-off'
  | 'droplet'
  | 'eye'
  | 'eye-off'
  | 'home'
  | 'games'
  | 'image'
  | 'leaf'
  | 'link'
  | 'list'
  | 'location'
  | 'meal'
  | 'mic'
  | 'moon'
  | 'more'
  | 'pause'
  | 'play'
  | 'plus'
  | 'power'
  | 'refresh'
  | 'shield'
  | 'sun'
  | 'sunrise'
  | 'star'
  | 'television'
  | 'today'
  | 'trash'
  | 'users'
  | 'wallet'
  | 'warning'
  | 'wind';

const paths: Record<IconName, React.ReactNode> = {
  running: (
    <>
      <circle cx="15" cy="4" r="2" />
      <path d="m8 10 4-3 3 5 5 1M12 7l-2 7 5 3-1 5M10 14l-5 6H2" />
    </>
  ),
  swimming: (
    <>
      <circle cx="18" cy="8" r="2" />
      <path d="m5 12 5-5 6 6M10 7 7 4l-4 2M2 17q2-2 5 0t5 0 5 0 5 0M2 21q2-2 5 0t5 0 5 0 5 0" />
    </>
  ),
  weights: (
    <>
      <path d="M7 12h10M3 8v8M21 8v8" />
      <rect x="4" y="5" width="3" height="14" rx="1" />
      <rect x="17" y="5" width="3" height="14" rx="1" />
    </>
  ),
  'fitness-class': (
    <>
      <circle cx="12" cy="5" r="2" />
      <path d="M5 9h14M12 7v7m-5 7 5-7 5 7M2 4v6M22 4v6" />
    </>
  ),
  basketball: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2v20M5 5c8 3 11 8 14 14M19 5C11 8 8 13 5 19" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  'book-open': (
    <>
      <path d="M2 4.5A3.5 3.5 0 0 1 5.5 1H11v18H5.5A3.5 3.5 0 0 0 2 22.5Z" />
      <path d="M22 4.5A3.5 3.5 0 0 0 18.5 1H13v18h5.5a3.5 3.5 0 0 1 3.5 3.5Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-left': <path d="m15 18-6-6 6-6" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  'chevron-up': <path d="m18 15-6-6-6 6" />,
  chores: (
    <>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  cloud: <path d="M17.5 19H7a5 5 0 0 1-.8-9.9A7 7 0 0 1 19.4 11 4 4 0 0 1 17.5 19Z" />,
  'cloud-rain': (
    <>
      <path d="M17.5 17H7a5 5 0 0 1-.8-9.9A7 7 0 0 1 19.4 9 4 4 0 0 1 17.5 17Z" />
      <path d="m8 21 1-2M12 21l1-2M16 21l1-2" />
    </>
  ),
  'cloud-sun': (
    <>
      <path d="M12 3V1M5.6 5.6 4.2 4.2M18.4 5.6l1.4-1.4M16 3h.01" />
      <path d="M17.5 19H7a5 5 0 0 1-.8-9.9A7 7 0 0 1 19.4 11 4 4 0 0 1 17.5 19Z" />
    </>
  ),
  'cloud-off': (
    <>
      <path d="m2 2 20 20" />
      <path d="M5.8 5.8A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 3.8-6.9M8.7 3.6A7 7 0 0 1 19 9.3" />
    </>
  ),
  droplet: <path d="M12 2.5S5.5 9.4 5.5 14a6.5 6.5 0 0 0 13 0C18.5 9.4 12 2.5 12 2.5Z" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <path d="m3 3 18 18" />
      <path d="M10.6 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-2.1 3.2M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7a10.4 10.4 0 0 0 4.1-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  games: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 4.7 19 2 19 2s2 9-4 14c-1.2 1-2.6 1.4-4 1.4" />
      <path d="M2 21c0-3 1.9-5.4 5.8-7.2" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </>
  ),
  location: (
    <>
      <path d="m21 3-8.1 18-2.2-7.7L3 10.9 21 3Z" />
      <path d="m10.7 13.3 4-4" />
    </>
  ),
  meal: (
    <>
      <path d="M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11M17 3v18M17 3c3 2 3 7 0 9" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8" />
    </>
  ),
  moon: <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </>
  ),
  play: <path d="m7 4 13 8-13 8V4Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  power: (
    <>
      <path d="M12 2v10" />
      <path d="M18.4 6.6a8 8 0 1 1-12.8 0" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.9-4L3 10" />
      <path d="M3 4v6h6" />
      <path d="M4 13a8 8 0 0 0 14.9 4l2.1-3" />
      <path d="M21 20v-6h-6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  sunrise: (
    <>
      <path d="M4 18h16M7 15a5 5 0 0 1 10 0M12 3v3M4.9 7.9l2.1 2.1M19.1 7.9 17 10M2 22h20" />
    </>
  ),
  star: <path d="m12 2 3.1 6.3 6.9 1-5 4.8 1.2 6.9-6.2-3.3L5.8 21 7 14.1l-5-4.8 6.9-1L12 2Z" />,
  television: (
    <>
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 22h8M12 18v4" />
    </>
  ),
  today: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 9h18M8 13h3v3H8z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 6.5h14a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12v3.5" />
      <path d="M16 12h6v5h-6a2.5 2.5 0 0 1 0-5Z" />
      <path d="M17 14.5h.01" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.4 2.2 18a2 2 0 0 0 1.8 3h16a2 2 0 0 0 1.8-3L13.7 3.4a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  wind: (
    <>
      <path d="M3 8h11.5a3 3 0 1 0-2.1-5.1" />
      <path d="M3 12h16a3 3 0 1 1-2.1 5.1" />
      <path d="M3 16h7" />
    </>
  ),
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
