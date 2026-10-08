import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../api'

const KIOSK_TOKEN_KEY = 'kioskToken'

export default function Kiosk() {
  const [kioskToken, setKioskToken] = useState(
    () => localStorage.getItem(KIOSK_TOKEN_KEY)
  )

  const [activationCode, setActivationCode] =
    useState('')

  const [activating, setActivating] =
    useState(false)

  const [c, setC] = useState(null)
  const [left, setLeft] = useState(0)
  const [error, setError] = useState('')

  const activate = async () => {
    const code = activationCode.trim()

    if (!/^\d{6}$/.test(code)) {
      setError(
        'Please enter a valid 6-digit activation code.'
      )
      return
    }

    setActivating(true)
    setError('')

    try {
      const data = await api(
        '/attendance/kiosk/activate',
        {
          method: 'POST',
          auth: false,
          body: {
            code,
          },
        }
      )

      localStorage.setItem(
        KIOSK_TOKEN_KEY,
        data.token
      )

      setKioskToken(data.token)
      setActivationCode('')
    } catch (e) {
      setError(e.message)
    } finally {
      setActivating(false)
    }
  }

  const load = async () => {
    if (!kioskToken) return

    try {
      const data = await api(
        '/attendance/code',
        {
          auth: false,
          headers: {
            'x-kiosk-token': kioskToken,
          },
        }
      )

      setC(data)
      setLeft(data.secondsLeft)
      setError('')
    } catch (e) {
      setError(e.message)

      // Token invalid/disabled ho gaya
      if (
        /kiosk/i.test(e.message) &&
        /invalid|disabled|authentication|required/i.test(
          e.message
        )
      ) {
        localStorage.removeItem(
          KIOSK_TOKEN_KEY
        )

        setKioskToken(null)
        setC(null)
      }
    }
  }

  useEffect(() => {
    if (!kioskToken) return

    load()

    const tick = setInterval(() => {
      setLeft((l) =>
        Math.max(0, l - 1)
      )
    }, 1000)

    const poll = setInterval(
      load,
      10000
    )

    return () => {
      clearInterval(tick)
      clearInterval(poll)
    }
  }, [kioskToken])

  useEffect(() => {
    if (
      kioskToken &&
      c &&
      left === 0
    ) {
      load()
    }
  }, [left, kioskToken, c])

  if (!kioskToken) {
    return (
      <div className="kiosk">
        <div className="kiosk-activation">
          <h1>Study Library</h1>

          <h2>
            Attendance Kiosk
          </h2>

          <p>
            Enter the activation code
            provided by the library
            staff.
          </p>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={activationCode}
            onChange={(e) =>
              setActivationCode(
                e.target.value
                  .replace(/\D/g, '')
                  .slice(0, 6)
              )
            }
            placeholder="6-digit code"
            autoFocus
          />

          <button
            type="button"
            onClick={activate}
            disabled={
              activating ||
              activationCode.length !== 6
            }
          >
            {activating
              ? 'Activating...'
              : 'Activate Kiosk'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="kiosk">
      <h1>
        Scan to check in / out
      </h1>

      <p>
        Open the Study Library app on
        your phone → Attendance → Scan
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
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    (left /
                      c.rotateSeconds) *
                    100
                  )
                )}%`,
              }}
            />
          </div>

          <small>
            Code changes every{' '}
            {c.rotateSeconds} seconds
          </small>
        </>
      )}
    </div>
  )
}