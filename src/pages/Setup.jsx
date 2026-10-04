import { useEffect, useState } from 'react'
import { api, rupees } from '../api'

export default function Setup() {
  const [shifts, setShifts] = useState([])
  const [plans, setPlans] = useState([])

  const [sf, setSf] = useState({
    name: '',
    startTime: '06:00',
    endTime: '14:00',
  })

  const [pf, setPf] = useState({
    name: '',
    durationDays: 30,
    shift: '',
    price: '',
  })

  const [error, setError] = useState('')

  const load = async () => {
    const [s, p] = await Promise.all([
      api('/shifts'),
      api('/plans'),
    ])

    setShifts(s)
    setPlans(p)

    setPf((f) => ({
      ...f,
      shift: f.shift || s[0]?._id || '',
    }))
  }

  useEffect(() => {
    load().catch((e) =>
      setError(e.message)
    )
  }, [])

  const run = (fn) => async (e) => {
    e?.preventDefault()
    setError('')

    try {
      await fn()
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <h1>Shifts & Plans</h1>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <div className="card">
        <h3>Shifts</h3>

        <p className="muted">
          Two shifts that overlap in time
          (e.g. Full Day and Morning) can't
          share a seat on the same dates.
        </p>

        <ul className="plain">
          {shifts.map((s) => (
            <li key={s._id}>
              <span>
                {s.name}{' '}
                <small>
                  {s.startTime} - {s.endTime}
                </small>
              </span>

              <button
                className="ghost danger"
                onClick={run(async () => {
                  if (
                    confirm(
                      `Delete ${s.name}?`
                    )
                  ) {
                    await api(
                      `/shifts/${s._id}`,
                      {
                        method: 'DELETE',
                      }
                    )
                  }
                })}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        <form
          className="row-form"
          onSubmit={run(async () => {
            await api('/shifts', {
              method: 'POST',
              body: sf,
            })

            setSf({
              ...sf,
              name: '',
            })
          })}
        >
          <input
            placeholder="Shift name"
            value={sf.name}
            onChange={(e) =>
              setSf({
                ...sf,
                name: e.target.value,
              })
            }
            required
          />

          <input
            type="time"
            value={sf.startTime}
            onChange={(e) =>
              setSf({
                ...sf,
                startTime: e.target.value,
              })
            }
            required
          />

          <input
            type="time"
            value={sf.endTime}
            onChange={(e) =>
              setSf({
                ...sf,
                endTime: e.target.value,
              })
            }
            required
          />

          <button>
            Add shift
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Plans</h3>

        <ul className="plain">
          {plans.map((p) => (
            <li key={p._id}>
              <span>
                {p.name}{' '}
                <small>
                  {p.shift?.name} ·{' '}
                  {p.durationDays} days ·{' '}
                  {rupees(p.price)}
                </small>
              </span>

              <button
                className="ghost danger"
                onClick={run(async () => {
                  if (
                    confirm(
                      `Deactivate ${p.name}?`
                    )
                  ) {
                    await api(
                      `/plans/${p._id}`,
                      {
                        method: 'DELETE',
                      }
                    )
                  }
                })}
              >
                Deactivate
              </button>
            </li>
          ))}
        </ul>

        <form
          className="row-form"
          onSubmit={run(async () => {
            await api('/plans', {
              method: 'POST',
              body: {
                ...pf,
                durationDays:
                  +pf.durationDays,
                price: +pf.price,
              },
            })

            setPf({
              ...pf,
              name: '',
              price: '',
            })
          })}
        >
          <input
            placeholder="Plan name"
            value={pf.name}
            onChange={(e) =>
              setPf({
                ...pf,
                name: e.target.value,
              })
            }
            required
          />

          <select
            value={pf.shift}
            onChange={(e) =>
              setPf({
                ...pf,
                shift: e.target.value,
              })
            }
          >
            {shifts.map((s) => (
              <option
                key={s._id}
                value={s._id}
              >
                {s.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            placeholder="Days"
            value={pf.durationDays}
            onChange={(e) =>
              setPf({
                ...pf,
                durationDays: e.target.value,
              })
            }
            required
          />

          <input
            type="number"
            min="0"
            placeholder="Price (₹)"
            value={pf.price}
            onChange={(e) =>
              setPf({
                ...pf,
                price: e.target.value,
              })
            }
            required
          />

          <button>
            Add plan
          </button>
        </form>
      </div>
    </>
  )
}