import { useEffect, useState } from 'react'
import {
  api,
  fmtDate,
  todayISO,
} from '../api'
import { useAuth } from '../AuthContext'
import FloorPlan, {
  autoPos,
} from '../components/FloorPlan'

export default function Seats() {
  const { user } = useAuth()
  const owner = user.role === 'owner'

  const [shifts, setShifts] = useState([])
  const [shift, setShift] = useState('')
  const [date, setDate] = useState(todayISO())
  const [seats, setSeats] = useState([])
  const [picked, setPicked] = useState(null)
  const [view, setView] = useState('plan')
  const [editing, setEditing] = useState(false)

  // unsaved positions while editing: { seatId: {x, y} }
  const [layout, setLayout] = useState({})

  const [form, setForm] = useState({
    number: '',
    section: 'Main Hall',
    type: 'Non-AC',
  })

  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    api('/shifts').then((s) => {
      setShifts(s)

      if (s[0]) {
        setShift(s[0]._id)
      }
    })
  }, [])

  const load = () =>
    shift &&
    api(
      `/seats/map?shift=${shift}&date=${date}`
    )
      .then((d) => setSeats(d.seats))
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()
  }, [shift, date])

  const addSeat = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await api('/seats', {
        method: 'POST',
        body: form,
      })

      setForm({
        ...form,
        number: '',
      })

      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleMaintenance = async (s) => {
    try {
      await api(`/seats/${s._id}`, {
        method: 'PUT',
        body: {
          ...s,
          status:
            s.status === 'active'
              ? 'maintenance'
              : 'active',
        },
      })

      setPicked(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const removeSeat = async (s) => {
    if (
      !confirm(
        `Delete seat ${s.number}?`
      )
    ) {
      return
    }

    try {
      await api(`/seats/${s._id}`, {
        method: 'DELETE',
      })

      setPicked(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const shown = seats.map((s) =>
    layout[s._id]
      ? {
          ...s,
          position: layout[s._id],
        }
      : s
  )

  const sections = [
    ...new Set(
      seats.map((s) => s.section)
    ),
  ]

  const count = (st) =>
    seats.filter(
      (s) => s.state === st
    ).length

  const autoArrange = () => {
    const next = {
      ...layout,
    }

    sections.forEach((sec) =>
      seats
        .filter(
          (s) => s.section === sec
        )
        .forEach((s, i, arr) => {
          next[s._id] = autoPos(
            i,
            arr.length
          )
        })
    )

    setLayout(next)
  }

  const saveLayout = async () => {
    setError('')
    setOk('')

    try {
      const positions = []

      sections.forEach((sec) =>
        shown
          .filter(
            (s) => s.section === sec
          )
          .forEach((s, i, arr) => {
            const p =
              s.position?.x != null
                ? s.position
                : autoPos(
                    i,
                    arr.length
                  )

            positions.push({
              id: s._id,
              x: p.x,
              y: p.y,
            })
          })
      )

      await api('/seats/layout', {
        method: 'PUT',
        body: {
          positions,
        },
      })

      setOk('Layout saved.')
      setEditing(false)
      setLayout({})
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <h1>Seat map</h1>

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

      <div className="card row-form">
        <label>
          Date

          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(e.target.value)
            }
          />
        </label>

        <label>
          Shift

          <select
            value={shift}
            onChange={(e) =>
              setShift(e.target.value)
            }
          >
            {shifts.map((s) => (
              <option
                key={s._id}
                value={s._id}
              >
                {s.name} ({s.startTime}-
                {s.endTime})
              </option>
            ))}
          </select>
        </label>

        <div
          className="tabs"
          style={{
            margin: 0,
          }}
        >
          <button
            className={
              view === 'plan' ? 'on' : ''
            }
            onClick={() =>
              setView('plan')
            }
          >
            Floor plan
          </button>

          <button
            className={
              view === 'grid' ? 'on' : ''
            }
            onClick={() => {
              setView('grid')
              setEditing(false)
            }}
          >
            Grid
          </button>
        </div>

        <div className="legend">
          <span className="badge green">
            Available {count('available')}
          </span>

          <span className="badge red">
            Occupied {count('occupied')}
          </span>

          <span className="badge gray">
            Maintenance {count('maintenance')}
          </span>
        </div>
      </div>

      {owner && view === 'plan' && (
        <div className="card row-form">
          {!editing ? (
            <button
              className="ghost"
              onClick={() => {
                setEditing(true)
                setPicked(null)
              }}
            >
              ✏️ Edit layout
            </button>
          ) : (
            <>
              <span
                className="muted"
                style={{
                  flex: '1 1 220px',
                }}
              >
                Drag the seats to match your
                real hall, then save.
              </span>

              <button
                className="ghost"
                onClick={autoArrange}
              >
                Auto-arrange
              </button>

              <button
                className="ghost"
                onClick={() => {
                  setEditing(false)
                  setLayout({})
                }}
              >
                Cancel
              </button>

              <button onClick={saveLayout}>
                Save layout
              </button>
            </>
          )}
        </div>
      )}

      {sections.map((sec) => (
        <div
          className="card"
          key={sec}
        >
          <h3>{sec}</h3>

          {view === 'plan' ? (
            <FloorPlan
              seats={shown.filter(
                (s) => s.section === sec
              )}
              pickedId={picked?._id}
              onPick={setPicked}
              editable={editing}
              onMove={(id, x, y) =>
                setLayout((l) => ({
                  ...l,
                  [id]: {
                    x,
                    y,
                  },
                }))
              }
            />
          ) : (
            <div className="seat-grid">
              {shown
                .filter(
                  (s) => s.section === sec
                )
                .map((s) => (
                  <button
                    key={s._id}
                    className={`seat ${
                      s.state
                    } ${
                      picked?._id === s._id
                        ? 'picked'
                        : ''
                    }`}
                    onClick={() =>
                      setPicked(s)
                    }
                  >
                    <b>{s.number}</b>

                    <small>
                      {s.state === 'occupied'
                        ? s.occupant.name
                        : s.type}
                    </small>
                  </button>
                ))}
            </div>
          )}
        </div>
      ))}

      {seats.length === 0 && (
        <p className="muted">
          No seats yet. Add your first seat
          below.
        </p>
      )}

      {picked && !editing && (
        <div className="card">
          <h3>
            Seat {picked.number}{' '}
            <span className="muted">
              · {picked.type} ·{' '}
              {picked.section}
            </span>
          </h3>

          {picked.occupant ? (
            <p>
              Booked by{' '}
              <b>{picked.occupant.name}</b>{' '}
              (
              {picked.occupant.phone ||
                'no phone'}
              ), till{' '}
              {fmtDate(
                picked.occupant.endDate
              )}
              .
            </p>
          ) : (
            <p className="muted">
              {picked.state ===
              'maintenance'
                ? 'Under maintenance.'
                : 'Free for this date and shift. Assign it from the Memberships page.'}
            </p>
          )}

          {owner && (
            <div className="actions">
              <button
                className="ghost"
                onClick={() =>
                  toggleMaintenance(
                    picked
                  )
                }
              >
                {picked.status === 'active'
                  ? 'Mark maintenance'
                  : 'Mark working'}
              </button>

              <button
                className="ghost danger"
                onClick={() =>
                  removeSeat(picked)
                }
              >
                Delete seat
              </button>
            </div>
          )}
        </div>
      )}

      {owner && (
        <form
          className="card row-form"
          onSubmit={addSeat}
        >
          <input
            placeholder="Seat number, e.g. S21"
            value={form.number}
            onChange={(e) =>
              setForm({
                ...form,
                number: e.target.value,
              })
            }
            required
          />

          <input
            placeholder="Section"
            value={form.section}
            onChange={(e) =>
              setForm({
                ...form,
                section: e.target.value,
              })
            }
          />

          <select
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value,
              })
            }
          >
            <option>Non-AC</option>
            <option>AC</option>
            <option>Cabin</option>
          </select>

          <button>
            Add seat
          </button>
        </form>
      )}
    </>
  )
}