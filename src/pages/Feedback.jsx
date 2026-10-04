import { useEffect, useState } from 'react'
import { api, fmtDate } from '../api'

export default function Feedback() {
  const [status, setStatus] = useState('open')
  const [list, setList] = useState([])
  const [replies, setReplies] = useState({})
  const [error, setError] = useState('')

  const load = () =>
    api(`/feedback?status=${status}`)
      .then(setList)
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()
  }, [status])

  const patch = async (id, body) => {
    setError('')

    try {
      await api(`/feedback/${id}`, {
        method: 'PATCH',
        body,
      })

      setReplies({
        ...replies,
        [id]: '',
      })

      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <h1>Feedback & complaints</h1>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <div className="tabs">
        {['open', 'resolved'].map((s) => (
          <button
            key={s}
            className={status === s ? 'on' : ''}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {list.map((f) => (
        <div className="card" key={f._id}>
          <div
            className="row-form"
            style={{ justifyContent: 'space-between' }}
          >
            <b>{f.subject}</b>

            <span
              className={`badge ${
                f.type === 'complaint' ? 'red' : 'gray'
              }`}
            >
              {f.type}
            </span>
          </div>

          <small>
            {f.student?.name}
            {f.student?.phone && ` · ${f.student.phone}`}
            {' · '}
            {fmtDate(f.createdAt)}
          </small>

          <p>{f.message}</p>

          {f.reply && (
            <div className="reply">
              <b>
                Reply by {f.repliedBy?.name || 'staff'}
              </b>

              <p>{f.reply}</p>
            </div>
          )}

          {status === 'open' ? (
            <>
              <textarea
                rows={2}
                placeholder="Write a reply (the student gets a notification)"
                value={replies[f._id] || ''}
                onChange={(e) =>
                  setReplies({
                    ...replies,
                    [f._id]: e.target.value,
                  })
                }
              />

              <div className="actions">
                <button
                  disabled={!(replies[f._id] || '').trim()}
                  onClick={() =>
                    patch(f._id, {
                      reply: replies[f._id],
                    })
                  }
                >
                  Reply & resolve
                </button>

                <button
                  className="ghost"
                  onClick={() =>
                    patch(f._id, {
                      status: 'resolved',
                    })
                  }
                >
                  Resolve without reply
                </button>
              </div>
            </>
          ) : (
            <button
              className="ghost"
              onClick={() =>
                patch(f._id, {
                  status: 'open',
                })
              }
            >
              Reopen
            </button>
          )}
        </div>
      ))}

      {list.length === 0 && (
        <div className="card">
          <p className="muted">
            Nothing {status} 🎉
          </p>
        </div>
      )}
    </>
  )
}