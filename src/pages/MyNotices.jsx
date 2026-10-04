import { useEffect, useState } from 'react'
import { api, fmtDate } from '../api'

export default function MyNotices() {
  const [list, setList] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/notices')
      .then(setList)
      .catch((e) => setError(e.message))
  }, [])

  if (!list) {
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

  return (
    <>
      <h1>Notices</h1>

      {list.map((n) => (
        <div
          className={`card notice-card ${
            n.pinned ? 'pinned' : ''
          }`}
          key={n._id}
        >
          <b>
            {n.pinned && '📌 '}
            {n.title}
          </b>

          <p>{n.body}</p>

          <small>
            {fmtDate(n.createdAt)}
            {n.createdBy?.name &&
              ` · ${n.createdBy.name}`}
          </small>
        </div>
      ))}

      {list.length === 0 && (
        <div className="card">
          <p className="muted">
            No notices right now.
          </p>
        </div>
      )}
    </>
  )
}