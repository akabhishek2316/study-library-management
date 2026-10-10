import { useEffect, useState } from 'react'

import {
  ListBar,
  Pager,
  usePaged,
} from '../components/ListTools'
import { Link } from 'react-router-dom'
import {
  api,
  downloadFile,
  fmtDate,
  fmtDateTime,
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

        <Link to="/kiosk" target="_blank" rel="noreferrer">
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
          ['kiosks', 'Kiosks'],
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

      {tab === 'kiosks' && (
        <Kiosks setError={setError} />
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

  const todayPaged = usePaged(d?.sessions, {
    pageSize: 15,
    searchText: (s) => `${s.student?.name} ${s.student?.phone}`,
  })

  const notInPaged = usePaged(d?.notIn, {
    pageSize: 15,
    searchText: (n) => `${n.student?.name} ${n.student?.phone} ${n.seat?.number}`,
  })

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

        <ListBar
          list={todayPaged}
          placeholder="Search student or phone..."
        />

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
              {todayPaged.items.map((s) => (
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

            </tbody>
          </table>
        </div>

        <Pager list={todayPaged} />
      </div>

      <div className="card">
        <h3>Not in yet today</h3>

        <ListBar
          list={notInPaged}
          placeholder="Search student, phone or seat..."
        />

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
              {notInPaged.items.map((n) => (
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

            </tbody>
          </table>
        </div>

        <Pager list={notInPaged} />
      </div>
    </>
  )
}

function Report({ setError }) {
  const [month, setMonth] = useState(thisMonth())
  const [r, setR] = useState(null)

  const rowsPaged = usePaged(r?.rows, {
    pageSize: 20,
    searchText: (x) => `${x.name} ${x.phone}`,
  })

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
        <>
          <ListBar
            list={rowsPaged}
            placeholder="Search student or phone..."
          />

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
                {rowsPaged.items.map((x) => (
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

          <Pager list={rowsPaged} />
        </>
      )}
    </div>
  )
}

function Absent({ setError }) {
  const [days, setDays] = useState(3)
  const [list, setList] = useState(null)

  const absentPaged = usePaged(list, {
    pageSize: 15,
    searchText: (a) => `${a.student?.name} ${a.student?.phone}`,
  })

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
        <>
          <ListBar
            list={absentPaged}
            placeholder="Search student or phone..."
          />

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
                {absentPaged.items.map((a) => (
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

              </tbody>
            </table>
          </div>

          <Pager list={absentPaged} />
        </>
      )}
    </div>
  )
}


function Kiosks({ setError }) {
  const [kiosks, setKiosks] = useState([])

  const kiosksPaged = usePaged(kiosks, {
    pageSize: 10,
    searchText: (k) =>
      `${k.name} ${k.active ? 'active' : 'disabled'}`,
  })
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [activationCode, setActivationCode] =
    useState('')

  const load = () => {
    api('/attendance/kiosk')
      .then(setKiosks)
      .catch((e) => setError(e.message))
  }

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    const kioskName = name.trim()

    if (!kioskName) {
      setError('Kiosk name is required')
      return
    }

    setCreating(true)
    setError('')
    setActivationCode('')

    try {
      const data = await api(
        '/attendance/kiosk',
        {
          method: 'POST',
          body: {
            name: kioskName,
          },
        }
      )

      setActivationCode(
        data.activationCode
      )

      setName('')
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const disable = async (id) => {
    if (
      !confirm(
        'Disable this attendance kiosk? The current kiosk token will stop working.'
      )
    ) {
      return
    }

    setError('')

    try {
      await api(
        `/attendance/kiosk/${id}/disable`,
        {
          method: 'PATCH',
        }
      )

      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const copyCode = async () => {
    if (!activationCode) return

    try {
      await navigator.clipboard.writeText(
        activationCode
      )
    } catch {
      setError(
        'Could not copy the activation code.'
      )
    }
  }

  return (
    <>
      <div className="card">
        <h3>Create Attendance Kiosk</h3>

        <div className="row-form">
          <label>
            Kiosk name

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Gate 1"
            />
          </label>

          <button
            onClick={create}
            disabled={
              creating || !name.trim()
            }
          >
            {creating
              ? 'Creating...'
              : 'Create Kiosk'}
          </button>
        </div>
      </div>

      {activationCode && (
        <div className="card">
          <h3>Activation Code</h3>

          <p className="muted">
            Open <b>/kiosk</b> on the gate
            tablet and enter this code.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <strong
              style={{
                fontSize: '2rem',
                letterSpacing: 6,
              }}
            >
              {activationCode}
            </strong>

            <button
              className="ghost"
              onClick={copyCode}
            >
              Copy
            </button>
          </div>

          <small className="muted">
            This code expires in 10 minutes and
            can only be used once.
          </small>
        </div>
      )}

      <div className="card">
        <div
          className="row-form"
          style={{
            justifyContent: 'space-between',
          }}
        >
          <h3>Attendance Kiosks</h3>

          <button
            className="ghost"
            onClick={load}
          >
            Refresh
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Last used</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {kiosksPaged.items.map((kiosk) => (
                <tr key={kiosk._id}>
                  <td>
                    <b>{kiosk.name}</b>
                  </td>

                  <td>
                    {kiosk.active ? (
                      <span className="badge green">
                        Active
                      </span>
                    ) : (
                      <span className="badge red">
                        Disabled
                      </span>
                    )}
                  </td>

                  <td>
                    {kiosk.lastUsedAt
                      ? fmtDateTime(
                        kiosk.lastUsedAt
                      )
                      : 'Never'}
                  </td>

                  <td>
                    {fmtDateTime(
                      kiosk.createdAt
                    )}
                  </td>

                  <td className="actions">
                    {kiosk.active && (
                      <button
                        className="ghost danger"
                        onClick={() =>
                          disable(kiosk._id)
                        }
                      >
                        Disable
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {kiosksPaged.items.length === 0 &&
                kiosks.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="muted"
                    >
                      No attendance kiosks created
                      yet.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        <Pager list={kiosksPaged} />
      </div>
    </>
  )
}