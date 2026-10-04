import { useEffect, useState } from 'react'
import { api, fmtDate, rupees } from '../api'

export default function Dashboard() {
  const [s, setS] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/dashboard/stats')
      .then(setS)
      .catch((e) => setError(e.message))
  }, [])

  if (error) {
    return <div className="alert error">{error}</div>
  }

  if (!s) {
    return <p className="muted">Loading...</p>
  }

  const cards = [
    ['Students', s.students],
    ['Seats in use', `${s.seatsInUse} / ${s.usableSeats}`],
    ['Occupancy', `${s.occupancy}%`],
    ['Active memberships', s.activeMemberships],
    ["Today's collection", rupees(s.collectedToday)],
    ['This month', rupees(s.collectedMonth)],
    ['Pending dues', rupees(s.pendingDues)],
    ['Inside now', s.insideNow],
    ['Present today', s.presentToday],
    ['Absent 3+ days', s.absent3],
    ['Open feedback', s.openFeedback],
  ]

  return (
    <>
      <h1>Dashboard</h1>

      <div className="stats">
        {cards.map(([k, v]) => (
          <div
            className="card stat"
            key={k}
          >
            <span>{k}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Expiring in the next 7 days</h3>

        {s.expiring.length === 0 ? (
          <p className="muted">
            Nobody's plan expires this week.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Phone</th>
                  <th>Seat</th>
                  <th>Plan</th>
                  <th>Ends</th>
                </tr>
              </thead>

              <tbody>
                {s.expiring.map((m) => (
                  <tr key={m._id}>
                    <td>{m.student?.name}</td>
                    <td>
                      {m.student?.phone || '-'}
                    </td>
                    <td>{m.seat?.number}</td>
                    <td>{m.plan?.name}</td>
                    <td>{fmtDate(m.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}