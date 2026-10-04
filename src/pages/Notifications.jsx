import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, fmtDateTime } from '../api'

const ICON = {
  payment: '💳',
  membership: '🪑',
  expiry: '⏳',
  due: '💰',
  notice: '📣',
  feedback: '💬',
  info: '🔔',
}

// Used by both the owner/staff area and the student area
export default function Notifications() {
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = () =>
    api('/notifications')
      .then(setData)
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()
  }, [])

  const open = async (n) => {
    if (!n.read) {
      await api(
        `/notifications/${n._id}/read`,
        {
          method: 'PATCH',
        }
      ).catch(() => {})
    }

    if (n.link) {
      navigate(n.link)
    } else {
      load()
    }
  }

  const readAll = async () => {
    await api(
      '/notifications/read-all',
      {
        method: 'POST',
      }
    )

    load()
  }

  if (!data) {
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
      <div
        className="row-form"
        style={{
          justifyContent: 'space-between',
        }}
      >
        <h1>Notifications</h1>

        {data.unread > 0 && (
          <button
            className="ghost"
            onClick={readAll}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div
        className="card"
        style={{
          padding: 0,
        }}
      >
        {data.items.map((n) => (
          <button
            key={n._id}
            className={`notif ${
              n.read ? '' : 'unread'
            }`}
            onClick={() => open(n)}
          >
            <span className="ico">
              {ICON[n.type] || '🔔'}
            </span>

            <span className="txt">
              <b>{n.title}</b>

              <small>
                {n.message}
              </small>

              <small>
                {fmtDateTime(n.createdAt)}
              </small>
            </span>

            {!n.read && (
              <i className="dot" />
            )}
          </button>
        ))}

        {data.items.length === 0 && (
          <p
            className="muted"
            style={{
              padding: 18,
            }}
          >
            No notifications yet.
          </p>
        )}
      </div>
    </>
  )
}