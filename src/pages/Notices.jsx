import { useEffect, useState } from 'react'

import {
  ListBar,
  Pager,
  usePaged,
} from '../components/ListTools'
import { api, fmtDate } from '../api'
import { useAuth } from '../AuthContext'

const empty = {
  title: '',
  body: '',
  audience: 'all',
  pinned: false,
  expiresAt: '',
  sendEmail: false,
}

export default function Notices() {
  const { user } = useAuth()

  const [list, setList] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const paged = usePaged(list, {
    pageSize: 10,
    searchText: (n) => `${n.title} ${n.body}`,
    filters: {
      state: (n, v) => {
        const ended =
          n.expiresAt && new Date(n.expiresAt) < new Date()

        return v === 'expired' ? ended : !ended
      },
    },
  })

  const load = () =>
    api('/notices/all')
      .then(setList)
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()
  }, [])

  const run = (fn, msg) => async (e) => {
    e?.preventDefault()
    setError('')
    setOk('')

    try {
      const r = await fn()

      if (msg) {
        setOk(
          typeof msg === 'function'
            ? msg(r)
            : msg
        )
      }

      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const set = (k) => (e) =>
    setForm({
      ...form,
      [k]:
        e.target.type === 'checkbox'
          ? e.target.checked
          : e.target.value,
    })

  const expired = (n) =>
    n.expiresAt &&
    new Date(n.expiresAt) < new Date()

  return (
    <>
      <h1>Notices</h1>

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
        onSubmit={run(
          async () => {
            await api('/notices', {
              method: 'POST',
              body: {
                ...form,
                expiresAt:
                  form.expiresAt || undefined,
              },
            })

            setForm(empty)
          },
          'Notice published. Students are being notified.'
        )}
      >
        <h3>New notice</h3>

        <div className="row-form">
          <input
            placeholder="Title *"
            value={form.title}
            onChange={set('title')}
            maxLength={120}
            required
          />

          <label
            style={{
              flex: '0 0 190px',
            }}
          >
            Show to

            <select
              value={form.audience}
              onChange={set('audience')}
            >
              <option value="all">
                All students
              </option>

              <option value="active">
                Students with a running plan
              </option>
            </select>
          </label>

          <label
            style={{
              flex: '0 0 160px',
            }}
          >
            Hide after (optional)

            <input
              type="date"
              value={form.expiresAt}
              onChange={set('expiresAt')}
            />
          </label>
        </div>

        <textarea
          placeholder="Message * (e.g. Library closed on Diwali, extra hours during exams...)"
          value={form.body}
          onChange={set('body')}
          rows={3}
          maxLength={2000}
          required
        />

        <div className="row-form">
          <label className="check">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={set('pinned')}
            />

            Pin to top
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={form.sendEmail}
              onChange={set('sendEmail')}
            />

            Also email students
          </label>

          <button>
            Publish
          </button>
        </div>
      </form>

      <div className="card">
        <h3>All notices</h3>

        <ListBar
          list={paged}
          placeholder="Search notices..."
          filters={[
            {
              key: 'state',
              label: 'Show',
              options: [
                ['active', 'Active'],
                ['expired', 'Expired'],
              ],
            },
          ]}
        />

        {list.some(
          (n) =>
            n.expiresAt &&
            new Date(n.expiresAt) < new Date()
        ) && (
          <p>
            <button
              className="ghost danger"
              onClick={run(async () => {
                if (
                  confirm(
                    'Delete all expired notices?'
                  )
                ) {
                  await api(
                    '/notices/expired/all',
                    { method: 'DELETE' }
                  )
                }
              })}
            >
              Delete all expired notices
            </button>
          </p>
        )}

        {paged.items.map((n) => (
          <div
            className={`notice ${
              expired(n) ? 'old' : ''
            }`}
            key={n._id}
          >
            <div>
              <b>
                {n.pinned && '📌 '}
                {n.title}
              </b>

              <p>{n.body}</p>

              <small>
                {fmtDate(n.createdAt)} ·{' '}
                {n.audience === 'all'
                  ? 'All students'
                  : 'Running plans only'}
                {n.expiresAt &&
                  ` · ${
                    expired(n)
                      ? 'expired'
                      : 'until'
                  } ${fmtDate(n.expiresAt)}`}
              </small>
            </div>

            <div className="actions">
              <button
                className="ghost"
                onClick={run(() =>
                  api(`/notices/${n._id}`, {
                    method: 'PUT',
                    body: {
                      title: n.title,
                      body: n.body,
                      pinned: !n.pinned,
                    },
                  })
                )}
              >
                {n.pinned ? 'Unpin' : 'Pin'}
              </button>

              <button
                className="ghost danger"
                onClick={run(async () => {
                  if (
                    confirm(
                      'Delete this notice?'
                    )
                  ) {
                    await api(
                      `/notices/${n._id}`,
                      {
                        method: 'DELETE',
                      }
                    )
                  }
                })}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        <Pager list={paged} />
      </div>

      {user.role === 'owner' && (
        <div className="card">
          <h3>Reminders</h3>

          <p className="muted">
            The app sends "plan ending soon" and
            "fee pending" reminders by itself every
            morning. You can also run them now.
          </p>

          <button
            className="ghost"
            onClick={run(
              () =>
                api(
                  '/notifications/run-reminders',
                  {
                    method: 'POST',
                  }
                ),
              (r) =>
                `Sent ${r.expiry} plan-ending and ${r.dues} fee-pending reminders (already-sent ones are skipped).`
            )}
          >
            Send reminders now
          </button>
        </div>
      )}
    </>
  )
}