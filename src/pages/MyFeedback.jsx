import { useEffect, useState } from 'react'
import { api, fmtDate } from '../api'
import { Pager, usePaged } from '../components/ListTools'

export default function MyFeedback() {
  const [list, setList] = useState([])

  const [form, setForm] = useState({
    type: 'feedback',
    subject: '',
    message: '',
  })

  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const paged = usePaged(list, { pageSize: 5 })

  const load = () =>
    api('/feedback/mine')
      .then(setList)
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()
  }, [])

  const send = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')

    try {
      await api('/feedback', {
        method: 'POST',
        body: form,
      })

      setOk('Sent. We will reply soon.')

      setForm({
        ...form,
        subject: '',
        message: '',
      })

      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <h1>Feedback</h1>

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
        className="card"
        onSubmit={send}
      >
        <h3>Tell us something</h3>

        <div className="row-form">
          <label
            style={{
              flex: '0 0 150px',
            }}
          >
            Type

            <select
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value,
                })
              }
            >
              <option value="feedback">
                Feedback
              </option>

              <option value="suggestion">
                Suggestion
              </option>

              <option value="complaint">
                Complaint
              </option>
            </select>
          </label>

          <input
            placeholder="Subject *"
            value={form.subject}
            onChange={(e) =>
              setForm({
                ...form,
                subject: e.target.value,
              })
            }
            maxLength={120}
            required
          />
        </div>

        <textarea
          placeholder="Your message * (AC not working, noise, a suggestion...)"
          value={form.message}
          onChange={(e) =>
            setForm({
              ...form,
              message: e.target.value,
            })
          }
          rows={4}
          maxLength={2000}
          required
        />

        <button>Send</button>
      </form>

      <div className="card">
        <h3>My messages</h3>

        {paged.items.map((f) => (
          <div
            className="fb"
            key={f._id}
          >
            <div
              className="row-form"
              style={{
                justifyContent: 'space-between',
              }}
            >
              <b>{f.subject}</b>

              <span
                className={`badge ${
                  f.status === 'resolved'
                    ? 'green'
                    : 'amber'
                }`}
              >
                {f.status}
              </span>
            </div>

            <p>{f.message}</p>

            <small>
              {f.type} · {fmtDate(f.createdAt)}
            </small>

            {f.reply && (
              <div className="reply">
                <b>Reply</b>
                <p>{f.reply}</p>
              </div>
            )}
          </div>
        ))}

        <Pager list={paged} sizes={[5, 10, 20]} />
      </div>
    </>
  )
}