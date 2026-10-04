import { useEffect, useState } from 'react'
import {
  api,
  downloadFile,
  todayISO,
} from '../api'

export default function Settings() {
  const [f, setF] = useState(null)
  const [info, setInfo] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const fill = (r) => {
    const s = r.settings

    setInfo(r.integrations)

    setF({
      libraryName: s.libraryName,
      address: s.address,
      phone: s.phone,
      closeTime: s.closeTime,
      qrRotateSeconds: s.qrRotateSeconds,
      remindDays: s.remindDays.join(', '),
      geoEnabled: s.geoEnabled,
      geoLat: s.geoLat ?? '',
      geoLng: s.geoLng ?? '',
      geoMeters: s.geoMeters,
    })
  }

  useEffect(() => {
    api('/settings')
      .then(fill)
      .catch((e) => setError(e.message))
  }, [])

  if (!f) {
    return error ? (
      <div className="alert error">
        {error}
      </div>
    ) : (
      <p className="muted">
        Loading...
      </p>
    )
  }

  const set = (k) => (e) =>
    setF({
      ...f,
      [k]:
        e.target.type === 'checkbox'
          ? e.target.checked
          : e.target.value,
    })

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')

    try {
      const body = {
        ...f,
        remindDays: f.remindDays,
      }

      if (
        f.geoLat === '' ||
        f.geoLng === ''
      ) {
        delete body.geoLat
        delete body.geoLng
      }

      fill(
        await api('/settings', {
          method: 'PUT',
          body,
        })
      )

      setOk('Settings saved.')
    } catch (err) {
      setError(err.message)
    }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      return setError(
        'Location is not available in this browser.'
      )
    }

    navigator.geolocation.getCurrentPosition(
      (p) =>
        setF((x) => ({
          ...x,
          geoLat:
            p.coords.latitude.toFixed(6),
          geoLng:
            p.coords.longitude.toFixed(6),
        })),
      () =>
        setError(
          'Allow location access (open the app on a phone or laptop at the library).'
        ),
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    )
  }

  const Dot = ({ on }) => (
    <span
      className={`badge ${
        on ? 'green' : 'gray'
      }`}
    >
      {on ? 'connected' : 'not set up'}
    </span>
  )

  return (
    <>
      <h1>Settings</h1>

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

      <form onSubmit={save}>
        <div className="card">
          <h3>Library details</h3>

          <p className="muted">
            Shown on receipts, reports and emails.
          </p>

          <div className="row-form">
            <label>
              Name

              <input
                value={f.libraryName}
                onChange={set('libraryName')}
                maxLength={80}
              />
            </label>

            <label>
              Phone

              <input
                value={f.phone}
                onChange={set('phone')}
                maxLength={30}
              />
            </label>
          </div>

          <label
            style={{
              marginTop: 10,
            }}
          >
            Address

            <input
              value={f.address}
              onChange={set('address')}
              maxLength={200}
            />
          </label>
        </div>

        <div className="card">
          <h3>
            Timings and reminders
          </h3>

          <div className="row-form">
            <label>
              Closing time

              <input
                type="time"
                value={f.closeTime}
                onChange={set('closeTime')}
                required
              />
            </label>

            <label>
              QR code changes every (seconds)

              <input
                type="number"
                min="15"
                max="300"
                value={f.qrRotateSeconds}
                onChange={set(
                  'qrRotateSeconds'
                )}
                required
              />
            </label>

            <label>
              Remind before plan ends (days)

              <input
                value={f.remindDays}
                onChange={set('remindDays')}
                placeholder="7, 3, 1, 0"
              />
            </label>
          </div>

          <small>
            Students still checked in at closing
            time are checked out automatically.
            Reminder days: 0 means the last day.
          </small>
        </div>

        <div className="card">
          <h3>
            Check-in only at the library (optional)
          </h3>

          <p className="muted">
            Students must be near the library to
            check in. Works on phones with HTTPS.
          </p>

          <label className="check">
            <input
              type="checkbox"
              checked={f.geoEnabled}
              onChange={set('geoEnabled')}
            />

            Turn on the location check
          </label>

          <div
            className="row-form"
            style={{
              marginTop: 10,
            }}
          >
            <label>
              Latitude

              <input
                type="number"
                step="any"
                value={f.geoLat}
                onChange={set('geoLat')}
              />
            </label>

            <label>
              Longitude

              <input
                type="number"
                step="any"
                value={f.geoLng}
                onChange={set('geoLng')}
              />
            </label>

            <label>
              Allowed distance (metres)

              <input
                type="number"
                min="20"
                max="2000"
                value={f.geoMeters}
                onChange={set('geoMeters')}
              />
            </label>

            <button
              type="button"
              className="ghost"
              onClick={useMyLocation}
            >
              📍 Use my current location
            </button>
          </div>

          <small>
            Stand inside the library and tap the
            button. Keep 100 to 200 metres, because
            phone GPS indoors is not exact.
          </small>
        </div>

        <button>
          Save settings
        </button>
      </form>

      <div
        className="card"
        style={{
          marginTop: 16,
        }}
      >
        <h3>Connections</h3>

        <p>
          Email reminders:{' '}
          <Dot on={info.email} />
        </p>

        <p>
          Online payments (Razorpay):{' '}
          <Dot on={info.razorpay} />

          {info.razorpay && (
            <>
              · webhook{' '}
              <Dot
                on={info.razorpayWebhook}
              />
            </>
          )}
        </p>

        <small>
          These are set in the server's{' '}
          <code>.env</code> file, not here,
          because they contain secrets.
        </small>
      </div>

      <div className="card">
        <h3>Backup</h3>

        <p className="muted">
          Download all your data (students,
          seats, plans, payments, attendance,
          notices) as one file. Do this regularly
          and keep the file somewhere safe and
          private: it contains password hashes.
          Restore it with{' '}
          <code>
            npm run restore -- backup.json
          </code>{' '}
          in the server folder.
        </p>

        <button
          className="ghost"
          onClick={() =>
            downloadFile(
              '/settings/backup',
              `study-library-backup-${todayISO()}.json`
            ).catch((e) =>
              setError(e.message)
            )
          }
        >
          Download backup
        </button>
      </div>
    </>
  )
}