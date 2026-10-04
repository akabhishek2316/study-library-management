import { useEffect, useState } from 'react'
import {
  api,
  fmtMins,
  fmtTime,
  thisMonth,
} from '../api'
import Scanner from '../components/Scanner'

const getPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(
        new Error(
          'Location is not available on this device.'
        )
      )
    }

    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
        }),
      () =>
        reject(
          new Error(
            'Please allow location access to check in at the library.'
          )
        ),
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    )
  })

export default function MyAttendance() {
  const [cfg, setCfg] = useState({
    geofence: false,
  })

  const [today, setToday] = useState(null)
  const [month, setMonth] = useState(thisMonth())
  const [data, setData] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const [, tick] = useState(0)

  const load = () => {
    api('/attendance/me/today')
      .then(setToday)
      .catch((e) => setError(e.message))

    api(`/attendance/me?month=${month}`)
      .then(setData)
      .catch((e) => setError(e.message))
  }

  useEffect(() => {
    api('/attendance/config')
      .then(setCfg)
      .catch(() => {})
  }, [])

  useEffect(load, [month])

  useEffect(() => {
    const t = setInterval(
      () => tick((n) => n + 1),
      30000
    )

    return () => clearInterval(t)
  }, [])

  const submit = async (text) => {
    setScanning(false)
    setBusy(true)
    setError('')
    setOk('')

    try {
      const pos = cfg.geofence
        ? await getPosition()
        : {}

      const r = await api('/attendance/scan', {
        method: 'POST',
        body: {
          code: text,
          ...pos,
        },
      })

      setOk(
        r.action === 'checkin'
          ? `Checked in at ${fmtTime(r.at)}. Happy studying! 📖`
          : `Checked out at ${fmtTime(r.at)}. Today: ${fmtMins(r.todayMinutes)}.`
      )

      setCode('')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!today || !data) {
    return error ? (
      <div className="alert error">
        {error}
      </div>
    ) : (
      <p className="muted">Loading...</p>
    )
  }

  const inside = today.open

  const elapsed = inside
    ? Math.max(
        0,
        Math.round(
          (Date.now() -
            new Date(inside.checkIn)) /
            60000
        )
      )
    : 0

  const [y, m] = month.split('-').map(Number)

  const daysInMonth = new Date(
    y,
    m,
    0
  ).getDate()

  const offset = new Date(
    y,
    m - 1,
    1
  ).getDay()

  const mins = new Map(
    data.days.map((d) => [
      d.date,
      d.minutes,
    ])
  )

  return (
    <>
      <h1>Attendance</h1>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {ok && (
        <div className="alert ok">
          {ok}
        </div>
      )}

      <div
        className={`card status ${
          inside ? 'in' : ''
        }`}
      >
        <div>
          <b>
            {inside
              ? `You're inside since ${fmtTime(
                  inside.checkIn
                )}`
              : 'You are not checked in'}
          </b>

          <small>
            {inside
              ? `${fmtMins(
                  elapsed
                )} so far · today total ${fmtMins(
                  today.todayMinutes + 0
                )}`
              : `Today so far: ${fmtMins(
                  today.todayMinutes
                )}`}
          </small>
        </div>

        <button
          onClick={() => {
            setScanning(!scanning)
            setError('')
          }}
          disabled={busy}
        >
          {scanning
            ? 'Close camera'
            : inside
              ? 'Scan to check out'
              : 'Scan to check in'}
        </button>
      </div>

      {scanning && (
        <div className="card">
          <Scanner
            onCode={submit}
            onError={(e) => {
              setError(e)
              setScanning(false)
            }}
          />
        </div>
      )}

      <form
        className="card row-form"
        onSubmit={(e) => {
          e.preventDefault()
          submit(code)
        }}
      >
        <label>
          Camera not working? Type the 6-digit code from the screen

          <input
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value.replace(/\D/g, '')
              )
            }
          />
        </label>

        <button
          disabled={
            busy || code.length !== 6
          }
        >
          {busy ? 'Please wait...' : 'Submit'}
        </button>
      </form>

      {today.sessions.length > 0 && (
        <div className="card">
          <h3>Today</h3>

          <ul className="plain">
            {today.sessions.map((s) => (
              <li key={s._id}>
                <span>
                  {fmtTime(s.checkIn)} →{' '}
                  {s.open ? (
                    <b className="green-text">
                      inside
                    </b>
                  ) : (
                    fmtTime(s.checkOut)
                  )}

                  {s.autoCheckOut && (
                    <small>
                      auto check-out at closing
                    </small>
                  )}
                </span>

                <b>
                  {fmtMins(s.minutes)}
                </b>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="stats">
        <div className="card stat">
          <span>Days present</span>
          <b>{data.daysPresent}</b>
        </div>

        <div className="card stat">
          <span>Hours this month</span>
          <b>
            {fmtMins(data.totalMinutes)}
          </b>
        </div>

        <div className="card stat">
          <span>Streak</span>
          <b>
            {data.streak} 🔥
          </b>
        </div>
      </div>

      <div className="card">
        <div className="row-form">
          <h3
            style={{
              margin: 0,
              flex: 1,
            }}
          >
            My month
          </h3>

          <input
            type="month"
            value={month}
            max={thisMonth()}
            onChange={(e) =>
              setMonth(e.target.value)
            }
            style={{
              flex: '0 0 auto',
            }}
          />
        </div>

        <div className="cal head">
          {[
            'S',
            'M',
            'T',
            'W',
            'T',
            'F',
            'S',
          ].map((d, i) => (
            <span key={i}>
              {d}
            </span>
          ))}
        </div>

        <div className="cal">
          {Array.from(
            { length: offset },
            (_, i) => (
              <span key={'o' + i} />
            )
          )}

          {Array.from(
            { length: daysInMonth },
            (_, i) => {
              const key = `${month}-${String(
                i + 1
              ).padStart(2, '0')}`

              const v = mins.get(key)

              return (
                <span
                  key={key}
                  className={`day ${
                    v ? 'on' : ''
                  }`}
                  title={
                    v
                      ? fmtMins(v)
                      : 'Absent'
                  }
                >
                  {i + 1}

                  {v ? (
                    <small>
                      {Math.round(v / 60)}h
                    </small>
                  ) : null}
                </span>
              )
            }
          )}
        </div>
      </div>
    </>
  )
}