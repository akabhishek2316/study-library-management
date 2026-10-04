import { useEffect, useState } from 'react'
import { api, rupees } from '../api'
import BarChart from '../components/BarChart'

const monthName = (k) =>
  new Date(`${k}-01T00:00:00Z`).toLocaleDateString(
    'en-IN',
    {
      timeZone: 'UTC',
      month: 'short',
      year: '2-digit',
    }
  )

const hourName = (h) =>
  h === 0
    ? '12a'
    : h < 12
      ? `${h}a`
      : h === 12
        ? '12p'
        : `${h - 12}p`

export default function Analytics() {
  const [months, setMonths] = useState(6)
  const [d, setD] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/reports/analytics?months=${months}`)
      .then(setD)
      .catch((e) => setError(e.message))
  }, [months])

  if (error) {
    return <div className="alert error">{error}</div>
  }

  if (!d) {
    return <p className="muted">Loading...</p>
  }

  const change =
    d.lastMonth > 0
      ? Math.round(
          ((d.thisMonth - d.lastMonth) / d.lastMonth) * 100
        )
      : null

  const peak = d.peakHours.slice(5, 24) // 5 AM to 11 PM

  return (
    <>
      <div
        className="row-form"
        style={{ justifyContent: 'space-between' }}
      >
        <h1>Analytics</h1>

        <label style={{ flex: '0 0 auto' }}>
          Months

          <select
            value={months}
            onChange={(e) => setMonths(+e.target.value)}
          >
            {[3, 6, 12].map((n) => (
              <option key={n} value={n}>
                Last {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="stats">
        <div className="card stat">
          <span>This month (net)</span>
          <b>{rupees(d.thisMonth)}</b>
        </div>

        <div className="card stat">
          <span>Last month</span>
          <b>{rupees(d.lastMonth)}</b>
        </div>

        <div className="card stat">
          <span>Change</span>

          <b
            style={{
              color:
                change === null
                  ? undefined
                  : change >= 0
                    ? '#16a34a'
                    : '#dc2626',
            }}
          >
            {change === null
              ? '-'
              : `${change > 0 ? '+' : ''}${change}%`}
          </b>
        </div>
      </div>

      <div className="card">
        <h3>Collection by month (net of refunds)</h3>

        <BarChart
          data={d.revenue.map((r) => ({
            label: monthName(r.month),
            value: Math.max(0, r.amount),
          }))}
          fmt={rupees}
          color="#16a34a"
        />
      </div>

      <div className="card">
        <h3>Seats booked today, by shift</h3>

        {d.occupancy.map((o) => (
          <div className="meter" key={o.shift}>
            <div>
              <b>{o.shift}</b>
              <span className="muted">
                {' '}
                {o.booked} of {o.total} seats
              </span>
            </div>

            <div className="meter-track">
              <div
                style={{
                  width: `${o.percent}%`,
                }}
              />
            </div>

            <b>{o.percent}%</b>
          </div>
        ))}

        {d.occupancy.length === 0 && (
          <p className="muted">
            Add shifts to see this.
          </p>
        )}
      </div>

      <div className="card">
        <h3>Students who came, last 30 days</h3>

        <BarChart
          data={d.attendance.map((a) => ({
            label: a.date.slice(8),
            value: a.students,
          }))}
          labelEvery={3}
          color="#2563eb"
        />
      </div>

      <div className="card">
        <h3>Busiest hours (check-ins, last 30 days)</h3>

        <BarChart
          data={peak.map((p) => ({
            label: hourName(p.hour),
            value: p.count,
          }))}
          labelEvery={2}
          color="#7c3aed"
          showValues={false}
        />
      </div>

      <div className="card">
        <h3>New students per month</h3>

        <BarChart
          data={d.newStudents.map((r) => ({
            label: monthName(r.month),
            value: r.count,
          }))}
          color="#0ea5e9"
        />
      </div>

      <div className="card">
        <h3>Running plans right now</h3>

        {d.planMix.map((p) => (
          <div className="meter" key={p.plan}>
            <div>
              <b>{p.plan}</b>
            </div>

            <div className="meter-track">
              <div
                style={{
                  width: `${(p.count / d.planMix[0].count) * 100}%`,
                }}
              />
            </div>

            <b>{p.count}</b>
          </div>
        ))}

        {d.planMix.length === 0 && (
          <p className="muted">
            No running memberships.
          </p>
        )}
      </div>
    </>
  )
}