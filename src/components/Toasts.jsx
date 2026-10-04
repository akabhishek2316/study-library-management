import { useEffect, useState } from 'react'

// Shows the small confirmation / error messages sent by toast() in effects.js
export default function Toasts() {
  const [list, setList] = useState([])

  useEffect(() => {
    const show = (e) => {
      const id = Math.random()
        .toString(36)
        .slice(2)

      setList((l) => [
        ...l.slice(-2),
        {
          id,
          ...e.detail,
        },
      ])

      setTimeout(
        () =>
          setList((l) =>
            l.filter(
              (t) => t.id !== id
            )
          ),
        3200
      )
    }

    window.addEventListener(
      'toast',
      show
    )

    return () =>
      window.removeEventListener(
        'toast',
        show
      )
  }, [])

  return (
    <div
      className="toasts"
      aria-live="polite"
    >
      {list.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.type}`}
          role="status"
        >
          <span className="toast-ico">
            {t.type === 'error'
              ? '!'
              : '✓'}
          </span>

          <span>{t.text}</span>
        </div>
      ))}
    </div>
  )
}