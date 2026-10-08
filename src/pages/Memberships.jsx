import { useEffect, useState } from 'react'
import {
  api,
  fmtDate,
  rupees,
  todayISO,
} from '../api'

const VIEWS = [
  'active',
  'expiring',
  'upcoming',
  'expired',
  'cancelled',
  'all',
]

export default function Memberships() {
  const [view, setView] = useState('active')
  const [items, setItems] = useState([])
  const [students, setStudents] = useState([])
  const [plans, setPlans] = useState([])
  const [freeSeats, setFreeSeats] = useState([])
  const [halls, setHalls] = useState([])
  const [selectedHall, setSelectedHall] = useState('')

  const [form, setForm] = useState({
    studentId: '',
    planId: '',
    seatId: '',
    startDate: todayISO(),
  })

  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const loadList = () =>
    api(`/memberships?view=${view}`)
      .then(setItems)
      .catch((e) => setError(e.message))

  useEffect(() => {
    loadList()
  }, [view])

  useEffect(() => {
    api('/students').then(setStudents)

    api('/plans').then((p) => {
      setPlans(p)

      setForm((f) => ({
        ...f,
        planId: f.planId || p[0]?._id || '',
      }))
    })
  }, [])

  // free seats for the chosen plan's shift on the chosen start date
  useEffect(() => {
    const plan = plans.find(
      (p) => p._id === form.planId
    )

    if (!plan) return

    api(
      `/seats/map?shift=${plan.shift._id}&date=${form.startDate}`
    )
      .then((d) => {
        const f = d.seats.filter(
          (s) => s.state === 'available'
        )

        setFreeSeats(f)

        const uniqueHalls = []

        f.forEach((s) => {
          if (!s.hall) return

          const hall =
            typeof s.hall === 'object'
              ? s.hall
              : {
                  _id: s.hall,
                  name: `Hall ${s.hall}`,
                }

          if (
            !uniqueHalls.some(
              (h) => h._id === hall._id
            )
          ) {
            uniqueHalls.push(hall)
          }
        })

        setHalls(uniqueHalls)

        setSelectedHall((currentHall) => {
          const hallExists = uniqueHalls.some(
            (h) => h._id === currentHall
          )

          return hallExists
            ? currentHall
            : uniqueHalls[0]?._id || ''
        })

        setForm((x) => ({
          ...x,
          seatId: f.some(
            (s) => s._id === x.seatId
          )
            ? x.seatId
            : '',
        }))
      })
      .catch((e) => setError(e.message))
  }, [
    form.planId,
    form.startDate,
    plans,
  ])

  const hallSeats = freeSeats.filter((s) => {
    const hallId =
      typeof s.hall === 'object'
        ? s.hall?._id
        : s.hall

    return hallId === selectedHall
  })

  useEffect(() => {
    setForm((x) => ({
      ...x,
      seatId: hallSeats.some(
        (s) => s._id === x.seatId
      )
        ? x.seatId
        : hallSeats[0]?._id || '',
    }))
  }, [selectedHall, freeSeats])

  const act = async (fn, msg) => {
    setError('')
    setOk('')

    try {
      await fn()
      setOk(msg)
      loadList()
    } catch (err) {
      setError(err.message)
    }
  }

  const assign = (e) => {
    e.preventDefault()

    act(
      () =>
        api('/memberships', {
          method: 'POST',
          body: form,
        }),
      'Seat assigned.'
    )
  }

  const setStatus = (m, status) =>
    act(
      () =>
        api(`/memberships/${m._id}/status`, {
          method: 'PATCH',
          body: { status },
        }),
      `Marked ${status}.`
    )

  const renew = (m) =>
    act(
      () =>
        api(`/memberships/${m._id}/renew`, {
          method: 'POST',
          body: {},
        }),
      'Renewed.'
    )

  const plan = plans.find(
    (p) => p._id === form.planId
  )

  return (
    <>
      <h1>Memberships</h1>

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

      <form
        className="card row-form"
        onSubmit={assign}
      >
        <label>
          Student

          <select
            value={form.studentId}
            onChange={(e) =>
              setForm({
                ...form,
                studentId: e.target.value,
              })
            }
            required
          >
            <option value="">
              Select student
            </option>

            {students.map((s) => (
              <option
                key={s._id}
                value={s._id}
              >
                {s.name} — {s.phone}
              </option>
            ))}
          </select>
        </label>

        <label>
          Plan

          <select
            value={form.planId}
            onChange={(e) =>
              setForm({
                ...form,
                planId: e.target.value,
                seatId: '',
              })
            }
            required
          >
            {plans.map((p) => (
              <option
                key={p._id}
                value={p._id}
              >
                {p.name} · {rupees(p.price)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Start date

          <input
            type="date"
            value={form.startDate}
            onChange={(e) =>
              setForm({
                ...form,
                startDate: e.target.value,
                seatId: '',
              })
            }
            required
          />
        </label>

        <label>
          Hall

          <select
            value={selectedHall}
            onChange={(e) => {
              setSelectedHall(e.target.value)

              setForm({
                ...form,
                seatId: '',
              })
            }}
            required
          >
            {halls.length === 0 && (
              <option value="">
                No available hall
              </option>
            )}

            {halls.map((hall) => (
              <option
                key={hall._id}
                value={hall._id}
              >
                {hall.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Seat

          <select
            value={form.seatId}
            onChange={(e) =>
              setForm({
                ...form,
                seatId: e.target.value,
              })
            }
            required
            disabled={!selectedHall}
          >
            {hallSeats.length === 0 && (
              <option value="">
                No free seat
              </option>
            )}

            {hallSeats.map((s) => (
              <option
                key={s._id}
                value={s._id}
              >
                {s.number}
                 {/* ({s.type}) */}
              </option>
            ))}
          </select>
        </label>

        <button disabled={!form.seatId}>
          Assign seat
        </button>

        {plan && (
          <small className="muted">
            {plan.shift.name} shift,{' '}
            {plan.durationDays} days
          </small>
        )}
      </form>

      <div className="card">
        <div className="tabs">
          {VIEWS.map((v) => (
            <button
              key={v}
              className={
                v === view ? 'on' : ''
              }
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Hall</th>
                <th>Seat</th>
                <th>Plan</th>
                <th>Dates</th>
                <th>Paid / Due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {items.map((m) => (
                <tr key={m._id}>
                  <td>
                    {m.student?.name}

                    <small>
                      {m.student?.phone}
                    </small>
                  </td>

                  <td>
                    {m.hall?.name || '-'}
                  </td>

                  <td>
                    {m.seat?.number || '-'}
                  </td>

                  <td>
                    {m.plan?.name}

                    <small>
                      {m.shift?.name} ·{' '}
                      {rupees(m.amount)}
                    </small>
                  </td>

                  <td>
                    {fmtDate(m.startDate)} →{' '}
                    {fmtDate(m.endDate)}
                  </td>

                  <td>
                    {rupees(m.paid)}

                    {m.due > 0 && (
                      <small
                        style={{
                          color: '#dc2626',
                        }}
                      >
                        due {rupees(m.due)}
                      </small>
                    )}
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        m.status === 'active'
                          ? 'green'
                          : m.status === 'paused'
                            ? 'amber'
                            : 'gray'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>

                  <td className="actions">
                    {m.status !== 'cancelled' && (
                      <button
                        className="ghost"
                        onClick={() =>
                          renew(m)
                        }
                      >
                        Renew
                      </button>
                    )}

                    {m.status === 'active' && (
                      <button
                        className="ghost"
                        onClick={() =>
                          setStatus(
                            m,
                            'paused'
                          )
                        }
                      >
                        Pause
                      </button>
                    )}

                    {m.status === 'paused' && (
                      <button
                        className="ghost"
                        onClick={() =>
                          setStatus(
                            m,
                            'active'
                          )
                        }
                      >
                        Resume
                      </button>
                    )}

                    {m.status !== 'cancelled' && (
                      <button
                        className="ghost danger"
                        onClick={() =>
                          confirm(
                            'Cancel this membership?'
                          ) &&
                          setStatus(
                            m,
                            'cancelled'
                          )
                        }
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="muted"
                  >
                    Nothing here.
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