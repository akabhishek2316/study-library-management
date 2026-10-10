import { useEffect, useState } from 'react'
import { api, fmtDate } from '../api'
import { Pager, usePaged } from '../components/ListTools'

export default function MyNotices() {
  const [list, setList] = useState(null)
  const [error, setError] = useState('')

  const paged = usePaged(list, { pageSize: 8 })

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

      {paged.items.map((n) => (
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

      <Pager list={paged} sizes={[8, 16, 32]} />
    </>
  )
}