import { useEffect, useState } from 'react'

import {
  ListBar,
  Pager,
  usePaged,
} from '../components/ListTools'
import { api, fmtDate } from '../api'

const STATUS_FILTERS = [
  'pending',
  'approved',
  'rejected',
  'all',
]

export default function SeatChangeRequests() {
  const [status, setStatus] = useState('pending')
  const [items, setItems] = useState([])

  const paged = usePaged(items, {
    pageSize: 15,
    searchText: (r) =>
      `${r.student?.name} ${r.student?.phone} ${r.hall?.name} ${r.currentSeat?.number} ${r.requestedSeat?.number}`,
  })

  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await api(
        `/seat-change-requests?status=${status}`
      )

      setItems(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status])

  const review = async (
    request,
    nextStatus
  ) => {
    setError('')
    setOk('')
    setSaving(true)

    try {
      await api(
        `/seat-change-requests/${request._id}/status`,
        {
          method: 'PATCH',
          body: {
            status: nextStatus,
            message,
          },
        }
      )

      setOk(
        nextStatus === 'approved'
          ? 'Seat change request approved.'
          : 'Seat change request rejected.'
      )

      setSelected(null)
      setMessage('')

      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="scr-page">
      <div className="page-head">
        <div>
          <h1>Seat Change Requests</h1>

          <p className="muted">
            Review student requests to change
            their seats.
          </p>
        </div>

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
        >
          {STATUS_FILTERS.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item === 'all'
                ? 'All'
                : item[0].toUpperCase() +
                  item.slice(1)}
            </option>
          ))}
        </select>
      </div>

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

      <div className="card">
        {loading ? (
          <p className="muted">
            Loading...
          </p>
        ) : (
          <>
          <ListBar
            list={paged}
            placeholder="Search student, phone or seat..."
          />

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Current Hall / Seat</th>
                  <th>Requested Hall / Seat</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {paged.items.map((request) => (
                  <tr key={request._id}>
                    <td>
                      <b>
                        {request.student?.name}
                      </b>

                      <small>
                        {request.student?.phone}
                      </small>
                    </td>

                    <td>
                      <b>
                        {request.currentSeat
                          ?.hall?.name || '-'}
                      </b>

                      <small>
                        Seat{' '}
                        {request.currentSeat
                          ?.number || '-'}
                      </small>
                    </td>

                    <td>
                      <b>
                        {request.requestedSeat
                          ?.hall?.name || '-'}
                      </b>

                      <small>
                        Seat{' '}
                        {request.requestedSeat
                          ?.number || '-'}
                      </small>
                    </td>

                    <td>
                      {request.membership ? (
                        <>
                          {fmtDate(
                            request.membership
                              .startDate
                          )}
                          {' → '}
                          {fmtDate(
                            request.membership
                              .endDate
                          )}
                        </>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td>
                      {request.reason || '-'}
                    </td>

                    <td>
                      {request.status}
                    </td>

                    <td>
                      {request.status ===
                        'pending' && (
                        <div className="row-form">
                          <button
                            onClick={() => {
                              setSelected(
                                request
                              )
                              setMessage('')
                            }}
                          >
                            Review
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          <Pager list={paged} />
          </>
        )}
      </div>

      {selected && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="page-head">
              <div>
                <h2>
                  Seat Change Request
                </h2>

                <p className="muted">
                  Review the requested seat
                  change.
                </p>
              </div>

              <button
                className="ghost"
                onClick={() =>
                  setSelected(null)
                }
              >
                Close
              </button>
            </div>

            <div className="grid-2">
              <div>
                <span className="muted">
                  Student
                </span>

                <b>
                  {selected.student?.name}
                </b>
              </div>

              <div>
                <span className="muted">
                  Phone
                </span>

                <b>
                  {selected.student?.phone}
                </b>
              </div>

              <div>
                <span className="muted">
                  Current Hall
                </span>

                <b>
                  {selected.currentSeat
                    ?.hall?.name || '-'}
                </b>
              </div>

              <div>
                <span className="muted">
                  Current Seat
                </span>

                <b>
                  {selected.currentSeat
                    ?.number || '-'}
                </b>
              </div>

              <div>
                <span className="muted">
                  Requested Hall
                </span>

                <b>
                  {selected.requestedSeat
                    ?.hall?.name || '-'}
                </b>
              </div>

              <div>
                <span className="muted">
                  Requested Seat
                </span>

                <b>
                  {selected.requestedSeat
                    ?.number || '-'}
                </b>
              </div>

              <div>
                <span className="muted">
                  Valid From
                </span>

                <b>
                  {fmtDate(
                    selected.membership
                      ?.startDate
                  )}
                </b>
              </div>

              <div>
                <span className="muted">
                  Valid Till
                </span>

                <b>
                  {fmtDate(
                    selected.membership
                      ?.endDate
                  )}
                </b>
              </div>
            </div>

            <div className="card">
              <b>Student Reason</b>

              <p>
                {selected.reason ||
                  'No reason provided.'}
              </p>
            </div>

            <label>
              Admin Message

              <textarea
                value={message}
                onChange={(e) =>
                  setMessage(
                    e.target.value
                  )
                }
                placeholder="Optional message to the student"
                rows="4"
                maxLength="500"
              />
            </label>

            <div className="row-form">
              <button
                disabled={saving}
                onClick={() =>
                  review(
                    selected,
                    'approved'
                  )
                }
              >
                {saving
                  ? 'Processing...'
                  : 'Approve'}
              </button>

              <button
                className="danger"
                disabled={saving}
                onClick={() =>
                  review(
                    selected,
                    'rejected'
                  )
                }
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}