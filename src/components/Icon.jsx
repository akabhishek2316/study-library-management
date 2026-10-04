import { ICONS } from './icons'

export default function Icon({
  name,
  size = 20,
}) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: ICONS[name] || '',
      }}
    />
  )
}