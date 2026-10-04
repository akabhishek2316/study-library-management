import { useState } from 'react'
import {
  downloadFile,
  thisMonth,
  todayISO,
} from '../api'

export default function Reports() {
  const [month, setMonth] = useState(thisMonth())

  const [range, setRange] = useState({
    from: '',
    to: '',
  })

  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  const get = async (key, path, file) => {
    setBusy(key)
    setError('')

    try {
      await downloadFile(path, file)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy('')
    }
  }

  const today = todayISO()

  const qs = new URLSearchParams(
    Object.entries(range).filter(
      ([, v]) => v
    )
  ).toString()

  const Card = ({
    id,
    title,
    text,
    children,
    action,
  }) => (
    <div className="card">
      <h3>{title}</h3>

      <p className="muted">
        {text}
      </p>

      {children}

      <button
        disabled={busy === id}
        onClick={action}
      >
        {busy === id
          ? 'Preparing...'
          : 'Download'}
      </button>
    </div>
  )

  return (
    <>
      <h1>Reports & export</h1>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <div className="card row-form">
        <label>
          Month (for the monthly report and attendance)

          <input
            type="month"
            value={month}
            max={thisMonth()}
            onChange={(e) =>
              setMonth(e.target.value)
            }
          />
        </label>
      </div>

      <Card
        id="pdf"
        title="Monthly report (PDF)"
        text="One-page summary for the month: money collected, collections by method, new students, attendance and pending dues. Good for your records or to share."
        action={() =>
          get(
            'pdf',
            `/reports/monthly.pdf?month=${month}`,
            `report-${month}.pdf`
          )
        }
      />

      <Card
        id="payments"
        title="Payments (Excel)"
        text="Every payment and refund with receipt number, date, student and method, with a net total at the end. Leave the dates empty for everything."
        action={() =>
          get(
            'payments',
            `/reports/export/payments?${qs}`,
            `payments-${today}.xlsx`
          )
        }
      >
        <div className="row-form">
          <label>
            From

            <input
              type="date"
              value={range.from}
              onChange={(e) =>
                setRange({
                  ...range,
                  from: e.target.value,
                })
              }
            />
          </label>

          <label>
            To

            <input
              type="date"
              value={range.to}
              onChange={(e) =>
                setRange({
                  ...range,
                  to: e.target.value,
                })
              }
            />
          </label>
        </div>
      </Card>

      <Card
        id="attendance"
        title="Attendance (Excel)"
        text="Two sheets for the chosen month: a summary per student and every single visit with check-in and check-out times."
        action={() =>
          get(
            'attendance',
            `/reports/export/attendance?month=${month}`,
            `attendance-${month}.xlsx`
          )
        }
      />

      <Card
        id="dues"
        title="Pending dues (Excel)"
        text="Who owes how much, with phone numbers, so you can follow up."
        action={() =>
          get(
            'dues',
            '/reports/export/dues',
            `dues-${today}.xlsx`
          )
        }
      />

      <Card
        id="students"
        title="Students (Excel)"
        text="All students with contact details, current seat and plan, valid-till date and any due amount."
        action={() =>
          get(
            'students',
            '/reports/export/students',
            `students-${today}.xlsx`
          )
        }
      />

      <Card
        id="memberships"
        title="All memberships (Excel)"
        text="The full history of seats, plans, dates, amounts, paid and due."
        action={() =>
          get(
            'memberships',
            '/reports/export/memberships',
            `memberships-${today}.xlsx`
          )
        }
      />
    </>
  )
}