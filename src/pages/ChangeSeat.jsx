import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, fmtDate } from '../api'
import './ChangeSeat.css'

export default function ChangeSeat() {
  const [data, setData] = useState(null)
  const [seats, setSeats] = useState([])
  const [seatId, setSeatId] = useState('')
  const [reason, setReason] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')

    try {
      const [membershipData, requests] =
        await Promise.all([
          api('/memberships/mine'),
          api('/seat-change-requests/mine'),
        ])

      setData({
        membership: membershipData.current,
        requests,
      })

      const current =
        membershipData.current

      if (!current) {
        setSeats([])
        return
      }

      const map = await api(
        `/seats/map?shift=${current.shift._id}&date=${current.startDate}`
      )

      const available = map.seats.filter(
        (seat) =>
          seat.state === 'available' &&
          seat.status === 'active' &&
          seat._id !== current.seat?._id
      )

      setSeats(available)

      setSeatId(
        available.length > 0
          ? available[0]._id
          : ''
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <p className="muted">
        Loading...
      </p>
    )
  }

  if (error) {
    return (
      <div className="alert error">
        {error}
      </div>
    )
  }

  const membership = data?.membership
  const requests = data?.requests || []

  const pendingRequest = requests.find(
    (request) =>
      request.status === 'pending' &&
      request.membership?._id ===
        membership?._id
  )

  const groupedSeats = seats.reduce(
    (groups, seat) => {
      const hallName =
        seat.hall?.name || 'Other Hall'

      if (!groups[hallName]) {
        groups[hallName] = []
      }

      groups[hallName].push(seat)

      return groups
    },
    {}
  )

  if (!membership) {
    return (
      <div className="page-head">
        <div>
          <h1>Change Seat</h1>

          <p className="muted">
            Request a different seat for your
            current membership.
          </p>

          <Link to="/student">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()

    setError('')
    setOk('')

    if (!seatId) {
      setError(
        'Please select a new hall and seat.'
      )
      return
    }

    setSubmitting(true)

    try {
      await api(
        '/seat-change-requests',
        {
          method: 'POST',
          body: {
            membershipId:
              membership._id,
            seatId,
            reason,
          },
        }
      )

      setOk(
        'Seat change request submitted. Please wait for admin approval.'
      )

      setReason('')

      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Change Seat</h1>

          <p className="muted">
            Request a different seat for your
            current membership.
          </p>
        </div>

        <Link to="/student">
          Back to Dashboard
        </Link>
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
        <h3>Current Membership</h3>

        <div className="grid-4">
          <div>
            <span className="muted">
              Current Hall
            </span>

            <b>
              {membership.hall?.name ||
                '-'}
            </b>
          </div>

          <div>
            <span className="muted">
              Current Seat
            </span>

            <b>
              {membership.seat?.number ||
                '-'}
            </b>
          </div>

          <div>
            <span className="muted">
              Plan
            </span>

            <b>
              {membership.plan?.name ||
                '-'}
            </b>
          </div>

          <div>
            <span className="muted">
              Shift
            </span>

            <b>
              {membership.shift?.name ||
                '-'}
            </b>
          </div>
        </div>

        <p className="muted">
          Valid from{' '}
          {fmtDate(
            membership.startDate
          )}{' '}
          to{' '}
          {fmtDate(
            membership.endDate
          )}
        </p>
      </div>

      {pendingRequest ? (
        <div className="card">
          <h3>Request Pending</h3>

          <p>
            You already have a pending
            request to change your seat
            from{' '}
            <b>
              {pendingRequest.currentSeat
                ?.hall?.name || '-'}
              {' · '}
              Seat{' '}
              {pendingRequest.currentSeat
                ?.number || '-'}
            </b>{' '}
            to{' '}
            <b>
              {pendingRequest.requestedSeat
                ?.hall?.name || '-'}
              {' · '}
              Seat{' '}
              {pendingRequest
                .requestedSeat?.number ||
                '-'}
            </b>
            .
          </p>

          <p className="muted">
            Please wait for the library
            admin to review your request.
          </p>
        </div>
      ) : (
        <form
          className="card"
          onSubmit={submit}
        >
          <h3>Request New Seat</h3>

          {seats.length === 0 ? (
            <p className="muted">
              No other seats are currently
              available for your membership
              dates and shift.
            </p>
          ) : (
            <>
              <label>
                New Hall & Seat

                <select
                  value={seatId}
                  onChange={(e) =>
                    setSeatId(
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select a hall and seat
                  </option>

                  {Object.entries(
                    groupedSeats
                  ).map(
                    ([
                      hallName,
                      hallSeats,
                    ]) => (
                      <optgroup
                        key={hallName}
                        label={hallName}
                      >
                        {hallSeats.map(
                          (seat) => (
                            <option
                              key={seat._id}
                              value={
                                seat._id
                              }
                            >
                              Seat{' '}
                              {seat.number}
                              {seat.section
                                ? ` · Section ${seat.section}`
                                : ''}
                              {seat.type
                                ? ` · ${seat.type}`
                                : ''}
                            </option>
                          )
                        )}
                      </optgroup>
                    )
                  )}
                </select>
              </label>

              <p className="muted">
                Available seats are grouped
                by hall. Select the hall first,
                then choose your preferred
                seat.
              </p>

              <label>
                Reason

                <textarea
                  value={reason}
                  onChange={(e) =>
                    setReason(
                      e.target.value
                    )
                  }
                  placeholder="Optional reason for changing your seat"
                  rows="4"
                  maxLength="500"
                />
              </label>

              <p className="muted">
                Your request will be reviewed
                by the library admin. Your
                current seat will remain
                unchanged until approval.
              </p>

              <button
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? 'Submitting...'
                  : 'Submit Seat Change Request'}
              </button>
            </>
          )}
        </form>
      )}

      {requests.length > 0 && (
        <div className="card">
          <h3>Request History</h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    Current Hall / Seat
                  </th>

                  <th>
                    Requested Hall / Seat
                  </th>

                  <th>Reason</th>

                  <th>Status</th>

                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {requests.map(
                  (request) => (
                    <tr
                      key={
                        request._id
                      }
                    >
                      <td>
                        {request
                          .currentSeat
                          ?.hall?.name ||
                          '-'}
                        {' · '}
                        Seat{' '}
                        {request
                          .currentSeat
                          ?.number ||
                          '-'}
                      </td>

                      <td>
                        {request
                          .requestedSeat
                          ?.hall?.name ||
                          '-'}
                        {' · '}
                        Seat{' '}
                        {request
                          .requestedSeat
                          ?.number ||
                          '-'}
                      </td>

                      <td>
                        {request.reason ||
                          '-'}
                      </td>

                      <td>
                        {request.status}
                      </td>

                      <td>
                        {fmtDate(
                          request.createdAt
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}