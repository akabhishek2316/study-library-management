import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../api'

// Full-screen page for the tablet / TV at the library entrance.
// Log in as staff or owner on that device.
export default function Kiosk() {
  const [c, setC] = useState(null)
  const [left, setLeft] = useState(0)
  const [error, setError] = useState('')

  const load = () =>
    api('/attendance/code')
      .then((d) => {
        setC(d)
        setLeft(d.secondsLeft)
        setError('')
      })
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()

    const tick = setInterval(
      () => setLeft((l) => Math.max(0, l - 1)),
      1000
    )

    const poll = setInterval(load, 10000)

    return () => {
      clearInterval(tick)
      clearInterval(poll)
    }
  }, [])

  useEffect(() => {
    if (left === 0 && c) {
      load()
    }
  }, [left])

  return (
    <div className="kiosk">
      <Link
        to="/admin/attendance"
        className="kiosk-back"
      >
        ← Back
      </Link>

      <h1>Scan to check in / out</h1>

      <p>
        Open the Study Library app on your phone → Attendance → Scan
      </p>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {c && (
        <>
          <div className="kiosk-qr">
            <QRCodeSVG
              value={`SL:${c.code}`}
              size={320}
              level="M"
            />
          </div>

          <div className="kiosk-code">
            {c.code}
          </div>

          <div className="kiosk-bar">
            <span
              style={{
                width: `${(left / c.rotateSeconds) * 100}%`,
              }}
            />
          </div>

          <small>
            Code changes every {c.rotateSeconds} seconds
          </small>
        </>
      )}
    </div>
  )
}