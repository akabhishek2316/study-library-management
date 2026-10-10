import { useEffect, useState } from 'react'

import {
  ListBar,
  Pager,
  usePaged,
} from '../components/ListTools'
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

  const paged = usePaged(data?.items, {
    pageSize: 15,
    searchText: (n) => `${n.title} ${n.message}`,
    filters: {
      state: (n, v) => (v === 'unread' ? !n.read : n.read),
    },
  })

  const removeOne = async (n) => {
    try {
      await api(`/notifications/${n._id}`, {
        method: 'DELETE',
      })

      window.dispatchEvent(
        new Event('notifications-updated')
      )

      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const clearRead = async () => {
    try {
      await api('/notifications/read', {
        method: 'DELETE',
      })

      window.dispatchEvent(
        new Event('notifications-updated')
      )

      load()
    } catch (e) {
      setError(e.message)
    }
  }

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

  const clearAll = async () => {
  

  try {
    await api('/notifications', {
      method: 'DELETE',
    })

    setData({
      items: [],
      unread: 0,
    })

    window.dispatchEvent(
      new Event('notifications-updated')
    )
  } catch (e) {
    setError(e.message)
  }
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

        <div className="row-form">
  {data.unread > 0 && (
    <button
      className="ghost"
      onClick={readAll}
    >
      Mark all as read
    </button>
  )}

  {data.items.some((n) => n.read) && (
    <button
      className="ghost"
      onClick={clearRead}
    >
      Clear read
    </button>
  )}

  {data.items.length > 0 && (
    <button
      className="danger"
      onClick={() =>
        confirm('Delete ALL notifications?') &&
        clearAll()
      }
    >
      Clear all
    </button>
  )}
</div>
      </div>

      <ListBar
        list={paged}
        placeholder="Search notifications..."
        filters={[
          {
            key: 'state',
            label: 'Show',
            options: [
              ['unread', 'Unread'],
              ['read', 'Read'],
            ],
          },
        ]}
      />

      <div
        className="card"
        style={{
          padding: 0,
        }}
      >
        {paged.items.map((n) => (
          <div
            key={n._id}
            className="notif-row"
          >
          <button
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

          <button
            type="button"
            className="notif-delete ghost"
            aria-label="Delete notification"
            title="Delete"
            onClick={() => removeOne(n)}
          >
            ×
          </button>
          </div>
        ))}

      </div>

      <Pager list={paged} />
    </>
  )
}