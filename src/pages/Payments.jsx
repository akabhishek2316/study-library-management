import { useEffect, useState } from 'react'
import {
  api,
  downloadReceipt,
  fmtDate,
  fmtDateTime,
  rupees,
} from '../api'
import { useAuth } from '../AuthContext'

export default function Payments() {
  const { user } = useAuth()

  const [tab, setTab] = useState('dues')
  const [dues, setDues] = useState([])

  const [hist, setHist] = useState({
    items: [],
    totals: {
      collected: 0,
      refunded: 0,
      net: 0,
    },
  })

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    method: '',
  })

  const [form, setForm] = useState({
    membershipId: '',
    amount: '',
    method: 'cash',
    note: '',
  })

  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  const loadDues = () =>
    api('/payments/dues')
      .then(setDues)
      .catch((e) => setError(e.message))

  const loadHist = () => {
    const qs = new URLSearchParams(
      Object.entries(filters).filter(
        ([, v]) => v
      )
    ).toString()

    return api(`/payments?${qs}`)
      .then(setHist)
      .catch((e) => setError(e.message))
  }

  useEffect(() => {
    loadDues()
  }, [])

  useEffect(() => {
    loadHist()
  }, [filters])

  const pick = (id) => {
    const m = dues.find(
      (d) => d._id === id
    )

    setForm((f) => ({
      ...f,
      membershipId: id,
      amount: m ? m.due : '',
    }))
  }

  const record = async (e) => {
    e.preventDefault()
    setError('')
    setDone(null)

    try {
      const p = await api('/payments', {
        method: 'POST',
        body: {
          ...form,
          amount: Number(form.amount),
        },
      })

      setDone(p)

      setForm({
        membershipId: '',
        amount: '',
        method: form.method,
        note: '',
      })

      loadDues()
      loadHist()
    } catch (err) {
      setError(err.message)
    }
  }

  const refund = async (p) => {
    const v = prompt(
      `Refund amount (max ${rupees(p.amount)})`,
      p.amount
    )

    if (!v) return

    try {
      await api(
        `/payments/${p._id}/refund`,
        {
          method: 'POST',
          body: {
            amount: Number(v),
            note: 'Refund',
          },
        }
      )

      loadDues()
      loadHist()
    } catch (err) {
      setError(err.message)
    }
  }

  const receipt = (p) =>
    downloadReceipt(
      p._id,
      p.receiptNo
    ).catch((e) =>
      setError(e.message)
    )

  const totalDue = dues.reduce(
    (s, d) => s + d.due,
    0
  )

  return (
    <>
      <h1>Payments</h1>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {done && (
        <div className="alert ok">
          Recorded {rupees(done.amount)} from{' '}
          <b>{done.student?.name}</b> · receipt{' '}
          {done.receiptNo}

          <button
            className="ghost"
            onClick={() => receipt(done)}
          >
            Download receipt
          </button>
        </div>
      )}

      <form
        className="card row-form"
        onSubmit={record}
      >
        <label>
          Student with dues

          <select
            value={form.membershipId}
            onChange={(e) =>
              pick(e.target.value)
            }
            required
          >
            <option value="">
              Select...
            </option>

            {dues.map((d) => (
              <option
                key={d._id}
                value={d._id}
              >
                {d.student?.name} ·{' '}
{d.membership?.hall?.name || d.hall?.name || '-'} · Seat{' '}
{d.seat?.number || '-'} · due{' '}
{rupees(d.due)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Amount (₹)

          <input
            type="number"
            min="1"
            step="any"
            value={form.amount}
            onChange={(e) =>
              setForm({
                ...form,
                amount: e.target.value,
              })
            }
            required
          />
        </label>

        <label>
          Method

          <select
            value={form.method}
            onChange={(e) =>
              setForm({
                ...form,
                method: e.target.value,
              })
            }
          >
            <option value="cash">
              Cash
            </option>

            <option value="upi">
              UPI
            </option>

            <option value="bank">
              Bank
            </option>

            <option value="card">
              Card
            </option>
          </select>
        </label>

        <label>
          Note

          <input
            value={form.note}
            onChange={(e) =>
              setForm({
                ...form,
                note: e.target.value,
              })
            }
            placeholder="optional"
          />
        </label>

        <button>
          Record payment
        </button>
      </form>

      <div className="card">
        <div className="tabs">
          <button
            className={
              tab === 'dues' ? 'on' : ''
            }
            onClick={() => setTab('dues')}
          >
            Pending dues ({dues.length})
          </button>

          <button
            className={
              tab === 'history' ? 'on' : ''
            }
            onClick={() => setTab('history')}
          >
            History
          </button>
        </div>

        {tab === 'dues' ? (
          <>
            <p className="muted">
              Total pending:{' '}
              <b>{rupees(totalDue)}</b>
            </p>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Hall / Seat / Plan</th>
                    <th>Ends</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {dues.map((d) => (
                    <tr key={d._id}>
                      <td>
                        {d.student?.name}

                        <small>
                          {d.student?.phone}
                        </small>
                      </td>

                      <td>
  {d.hall?.name || d.membership?.hall?.name || '-'} · Seat{' '}
  {d.seat?.number || '-'}

  <small>
    {d.plan?.name} ·{' '}
    {d.shift?.name}
  </small>
</td>

                      <td>
                        {fmtDate(d.endDate)}
                      </td>

                      <td>
                        {rupees(d.paid)}
                      </td>

                      <td>
                        <b>
                          {rupees(d.due)}
                        </b>
                      </td>

                      <td>
                        <button
                          className="ghost"
                          onClick={() => {
                            pick(d._id)

                            window.scrollTo({
                              top: 0,
                              behavior: 'smooth',
                            })
                          }}
                        >
                          Collect
                        </button>
                      </td>
                    </tr>
                  ))}

                  {dues.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="muted"
                      >
                        No pending dues 🎉
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="row-form">
              <label>
                From

                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      from: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                To

                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      to: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Method

                <select
                  value={filters.method}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      method: e.target.value,
                    })
                  }
                >
                  <option value="">
                    All
                  </option>

                  <option value="cash">
                    Cash
                  </option>

                  <option value="upi">
                    UPI
                  </option>

                  <option value="bank">
                    Bank
                  </option>

                  <option value="card">
                    Card
                  </option>

                  <option value="online">
                    Online
                  </option>
                </select>
              </label>
            </div>

            <p className="muted">
              Collected{' '}
              {rupees(hist.totals.collected)} ·
              Refunded{' '}
              {rupees(hist.totals.refunded)} ·{' '}
              <b>
                Net {rupees(hist.totals.net)}
              </b>
            </p>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {hist.items.map((p) => (
                    <tr key={p._id}>
                      <td>
                        {p.receiptNo}

                        {p.type === 'refund' && (
                          <small>
                            refund
                          </small>
                        )}
                      </td>

                      <td>
                        {fmtDateTime(p.paidAt)}
                      </td>

                      <td>
                        {p.student?.name}

                        <small>
  {p.membership?.hall?.name || '-'} · Seat{' '}
  {p.membership?.seat?.number || '-'} ·{' '}
  {p.membership?.plan?.name}
</small>
                      </td>

                      <td>
                        {p.method}
                      </td>

                      <td
                        style={{
                          color:
                            p.type === 'refund'
                              ? '#dc2626'
                              : undefined,
                        }}
                      >
                        {p.type === 'refund'
                          ? '−'
                          : ''}
                        {rupees(p.amount)}
                      </td>

                      <td className="actions">
                        <button
                          className="ghost"
                          onClick={() =>
                            receipt(p)
                          }
                        >
                          Receipt
                        </button>

                        {user.role === 'owner' &&
                          p.type === 'payment' && (
                            <button
                              className="ghost danger"
                              onClick={() =>
                                refund(p)
                              }
                            >
                              Refund
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}

                  {hist.items.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="muted"
                      >
                        No payments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  )
}