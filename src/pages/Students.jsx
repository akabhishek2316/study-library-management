import { useEffect, useState } from 'react'
import {
  api,
  fmtDate,
} from '../api'

const empty = {
  name: '',
  email: '',
  phone: '',
  emergencyContact: '',
}

export default function Students() {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  const load = () =>
    api(
      `/students?q=${encodeURIComponent(q)}`
    )
      .then(setList)
      .catch((e) =>
        setError(e.message)
      )

  useEffect(() => {
    const t = setTimeout(
      load,
      250
    )

    return () =>
      clearTimeout(t)
  }, [q])

  const add = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const d = await api('/students', {
        method: 'POST',
        body: form,
      })

      setCreated({
        name: d.student.name,
        email: d.student.email,
        password: d.tempPassword,
      })

      setForm(empty)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const deactivate = async (s) => {
    if (
      !confirm(
        `Deactivate ${s.name}? Their seat will be released.`
      )
    ) {
      return
    }

    try {
      await api(
        `/students/${s._id}`,
        {
          method: 'DELETE',
        }
      )

      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const set = (k) => (e) =>
    setForm({
      ...form,
      [k]: e.target.value,
    })

  return (
    <>
      <h1>Students</h1>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {created && (
        <div className="alert ok">
          <b>{created.name}</b> added.
          Login: {created.email} /
          password:{' '}
          <b>{created.password}</b>{' '}
          (shown only once, share it with
          the student)

          <button
            className="ghost"
            onClick={() =>
              setCreated(null)
            }
          >
            Close
          </button>
        </div>
      )}

      <form
        className="card row-form"
        onSubmit={add}
      >
        <input
          placeholder="Full name *"
          value={form.name}
          onChange={set('name')}
          required
        />

        <input
          placeholder="Email *"
          type="email"
          value={form.email}
          onChange={set('email')}
          required
        />

        <input
          placeholder="Phone"
          value={form.phone}
          onChange={set('phone')}
        />

        <input
          placeholder="Emergency contact"
          value={form.emergencyContact}
          onChange={set(
            'emergencyContact'
          )}
        />

        <button>
          Add student
        </button>
      </form>

      <div className="card">
        <input
          className="search"
          placeholder="Search name, email or phone..."
          value={q}
          onChange={(e) =>
            setQ(e.target.value)
          }
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Seat / Plan</th>
                <th>Valid till</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {list.map((s) => (
                <tr key={s._id}>
                  <td>
                    {s.name}

                    <small>
                      {s.email}
                    </small>
                  </td>

                  <td>
                    {s.phone || '-'}
                  </td>

                  <td>
                    {s.current ? (
                      <>
                        Seat{' '}
                        {s.current.seat?.number}

                        <small>
                          {s.current.plan?.name} ·{' '}
                          {s.current.shift?.name}
                        </small>
                      </>
                    ) : (
                      <span className="badge gray">
                        No seat
                      </span>
                    )}
                  </td>

                  <td>
                    {s.current
                      ? fmtDate(
                          s.current.endDate
                        )
                      : '-'}
                  </td>

                  <td>
                    <button
                      className="ghost danger"
                      onClick={() =>
                        deactivate(s)
                      }
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}

              {list.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="muted"
                  >
                    No students yet.
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