import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  api,
  downloadFile,
  fmtDate,
  fmtMins,
  fmtTime,
  thisMonth,
} from '../api'

export default function Attendance() {
  const [tab, setTab] = useState('today')
  const [error, setError] = useState('')

  return (
    <>
      <div
        className="row-form"
        style={{ justifyContent: 'space-between' }}
      >
        <h1>Attendance</h1>

        <Link to="/kiosk" target="_blank">
          <button>Open QR display ↗</button>
        </Link>
      </div>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <div className="tabs">
        {[
          ['today', 'Today'],
          ['report', 'Monthly report'],
          ['absent', 'Absent'],
        ].map(([k, l]) => (
          <button
            key={k}
            className={tab === k ? 'on' : ''}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <Today setError={setError} />
      )}

      {tab === 'report' && (
        <Report setError={setError} />
      )}

      {tab === 'absent' && (
        <Absent setError={setError} />
      )}
    </>
  )
}

function Today({ setError }) {
  const [d, setD] = useState(null)
  const [students, setStudents] = useState([])
  const [pick, setPick] = useState('')

  const load = () =>
    api('/attendance/today')
      .then(setD)
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()

    api('/students').then(setStudents)

    const t = setInterval(load, 30000)

    return () => clearInterval(t)
  }, [])

  const manual = async (studentId, action) => {
    setError('')

    try {
      await api('/attendance/manual', {
        method: 'POST',
        body: {
          studentId,
          action,
        },
      })

      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this entry?')) return

    try {
      await api(`/attendance/${id}`, {
        method: 'DELETE',
      })

      load()
    } catch (e) {
      setError(e.message)
    }
  }

  if (!d) {
    return <p className="muted">Loading...</p>
  }

  return (
    <>
      <div className="stats">
        <div className="card stat">
          <span>Inside now</span>
          <b>{d.insideNow}</b>
        </div>

        <div className="card stat">
          <span>Present today</span>
          <b>
            {d.presentToday} / {d.expected}
          </b>
        </div>

        <div className="card stat">
          <span>Not in yet</span>
          <b>{d.notIn.length}</b>
        </div>
      </div>

      <div className="card row-form">
        <label>
          Manual entry (phone dead, forgot to scan...)
          <select
            value={pick}
            onChange={(e) => setPick(e.target.value)}
          >
            <option value="">Select student</option>

            {students.map((s) => (
              <option
                key={s._id}
                value={s._id}
              >
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <button
          disabled={!pick}
          onClick={() => manual(pick, 'checkin')}
        >
          Check in
        </button>

        <button
          className="ghost"
          disabled={!pick}
          onClick={() => manual(pick, 'checkout')}
        >
          Check out
        </button>
      </div>

      <div className="card">
        <h3>Today's visits</h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>In</th>
                <th>Out</th>
                <th>Time</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {d.sessions.map((s) => (
                <tr key={s._id}>
                  <td>
                    {s.student?.name}
                    <small>{s.student?.phone}</small>
                  </td>

                  <td>
                    {fmtTime(s.checkIn)}
                    <small>{s.method}</small>
                  </td>

                  <td>
                    {s.open ? (
                      <span className="badge green">
                        Inside
                      </span>
                    ) : (
                      <>
                        {fmtTime(s.checkOut)}

                        {s.autoCheckOut && (
                          <small>auto</small>
                        )}
                      </>
                    )}
                  </td>

                  <td>
                    {fmtMins(s.minutes)}
                  </td>

                  <td className="actions">
                    {s.open && (
                      <button
                        className="ghost"
                        onClick={() =>
                          manual(
                            s.student._id,
                            'checkout'
                          )
                        }
                      >
                        Check out
                      </button>
                    )}

                    <button
                      className="ghost danger"
                      onClick={() => remove(s._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {d.sessions.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="muted"
                  >
                    Nobody has checked in yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Not in yet today</h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Seat</th>
                <th>Shift</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {d.notIn.map((n) => (
                <tr key={n.student._id}>
                  <td>
                    {n.student.name}
                    <small>{n.student.phone}</small>
                  </td>

                  <td>
                    {n.seat?.number}
                  </td>

                  <td>
                    {n.shift?.name}
                  </td>

                  <td>
                    {n.student.phone && (
                      <a href={`tel:${n.student.phone}`}>
                        <button className="ghost">
                          Call
                        </button>
                      </a>
                    )}
                  </td>
                </tr>
              ))}

              {d.notIn.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="muted"
                  >
                    Everyone has come 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function Report({ setError }) {
  const [month, setMonth] = useState(thisMonth())
  const [r, setR] = useState(null)

  useEffect(() => {
    api(`/attendance/report?month=${month}`)
      .then(setR)
      .catch((e) => setError(e.message))
  }, [month])

  return (
    <div className="card">
      <div className="row-form">
        <label>
          Month

          <input
            type="month"
            value={month}
            max={thisMonth()}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>

        <button
          className="ghost"
          onClick={() =>
            downloadFile(
              `/attendance/report.csv?month=${month}`,
              `attendance-${month}.csv`
            ).catch((e) => setError(e.message))
          }
        >
          Download CSV
        </button>
      </div>

      {!r ? (
        <p className="muted">Loading...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Days present</th>
                <th>Total hours</th>
                <th>Avg / day</th>
                <th>Last visit</th>
              </tr>
            </thead>

            <tbody>
              {r.rows.map((x) => (
                <tr key={x.studentId}>
                  <td>
                    {x.name}
                    <small>{x.phone}</small>
                  </td>

                  <td>
                    {x.daysPresent}
                  </td>

                  <td>
                    {fmtMins(x.minutes)}
                  </td>

                  <td>
                    {x.daysPresent
                      ? fmtMins(
                          Math.round(
                            x.minutes / x.daysPresent
                          )
                        )
                      : '-'}
                  </td>

                  <td>
                    {fmtDate(x.last)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Absent({ setError }) {
  const [days, setDays] = useState(3)
  const [list, setList] = useState(null)

  useEffect(() => {
    api(`/attendance/absent?days=${days}`)
      .then(setList)
      .catch((e) => setError(e.message))
  }, [days])

  return (
    <div className="card">
      <div className="row-form">
        <label>
          Not seen for at least

          <select
            value={days}
            onChange={(e) =>
              setDays(+e.target.value)
            }
          >
            {[2, 3, 5, 7, 14].map((n) => (
              <option
                key={n}
                value={n}
              >
                {n} days
              </option>
            ))}
          </select>
        </label>
      </div>

      {!list ? (
        <p className="muted">Loading...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Seat / Shift</th>
                <th>Last seen</th>
                <th>Days absent</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {list.map((a) => (
                <tr key={a.student._id}>
                  <td>
                    {a.student.name}
                    <small>{a.student.phone}</small>
                  </td>

                  <td>
                    {a.seat?.number}
                    <small>{a.shift?.name}</small>
                  </td>

                  <td>
                    {a.lastSeen
                      ? fmtDate(a.lastSeen)
                      : 'Never'}
                  </td>

                  <td>
                    <span className="badge red">
                      {a.absentDays}
                    </span>
                  </td>

                  <td>
                    {a.student.phone && (
                      <a
                        href={`tel:${a.student.phone}`}
                      >
                        <button className="ghost">
                          Call
                        </button>
                      </a>
                    )}
                  </td>
                </tr>
              ))}

              {list.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="muted"
                  >
                    No one is missing for {days}+ days 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}