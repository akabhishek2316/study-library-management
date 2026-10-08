import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  api,
  downloadReceipt,
  fmtDate,
  fmtDateTime,
  rupees,
} from '../api'

import './MyDashboard.css'

import { useAuth } from '../AuthContext'

const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      return resolve()
    }

    const s = document.createElement('script')

    s.src =
      'https://checkout.razorpay.com/v1/checkout.js'

    s.onload = resolve

    s.onerror = () =>
      reject(
        new Error(
          'Could not open the payment window. Check your internet.'
        )
      )

    document.body.appendChild(s)
  })

export default function MyDashboard() {
  const { user } = useAuth()

  const [admission, setAdmission] =
    useState(null)

  const [d, setD] = useState(null)
  const [payments, setPayments] = useState([])

  const [online, setOnline] =
    useState(false)

  const [notice, setNotice] =
    useState(null)

  const [amount, setAmount] =
    useState('')

  const [error, setError] =
    useState('')

  const [ok, setOk] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const loadAdmission = async () => {
    const data =
      await api('/admissions/mine')

    setAdmission(data)
  }

  const loadApprovedDashboard =
    async () => {
      const [
        m,
        p,
        c,
        n,
      ] = await Promise.all([
        api('/memberships/mine'),
        api('/payments/mine'),
        api('/payments/config'),
        api('/notices'),
      ])

      setD(m)
      setPayments(p)
      setOnline(c.online)
      setNotice(n[0] || null)

      setAmount(
        (a) =>
          a ||
          m.current?.due ||
          ''
      )
    }

  const load = async () => {
    setLoading(true)
    setError('')

    try {
      await loadAdmission()

      if (
        user.admissionStatus ===
        'approved'
      ) {
        await loadApprovedDashboard()
      }
    } catch (e) {
      setError(e.message)
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

  if (
    user.admissionStatus ===
    'pending'
  ) {
    return (
      <>
        <h1>
          Hi,{' '}
          {user.name.split(' ')[0]} 👋
        </h1>

        <div className="card admission-status pending">
          <span className="status-badge">
            Pending
          </span>

          <h2>
            Admission Under Review
          </h2>

          <p>
            Your admission request has
            been submitted successfully.
            Our team is currently
            reviewing your application.
          </p>

          <p>
            <b>
              Status:
            </b>{' '}
            Pending
          </p>

          <p className="muted">
            Please check your dashboard
            regularly for updates.
          </p>
        </div>
      </>
    )
  }

  if (
    user.admissionStatus ===
    'rejected'
  ) {
    return (
      <>
        <h1>
          Hi,{' '}
          {user.name.split(' ')[0]} 👋
        </h1>

        <div className="card admission-status rejected">
          <span className="status-badge">
            Not Approved
          </span>

          <h2>
            Admission Not Approved
          </h2>

          <p>
            Unfortunately, your
            admission request was not
            approved.
          </p>

          {admission?.adminNote && (
            <div className="admission-reason">
              <b>
                Reason:
              </b>

              <p>
                {admission.adminNote}
              </p>
            </div>
          )}

          <p className="muted">
            If you would like to apply
            again, please contact the
            library desk.
          </p>
        </div>
      </>
    )
  }

  const c =
    d?.current

  const left = c
    ? Math.max(
      0,
      Math.round(
        (
          new Date(
            c.endDate
          ) -
          new Date()
        ) /
        86400000
      ) + 1
    )
    : 0

  const owing =
    d?.history?.filter(
      (m) => m.due > 0
    ) || []

  const pay = async (
    m,
    amt
  ) => {
    setError('')
    setOk('')

    try {
      const order =
        await api(
          '/payments/razorpay/order',
          {
            method: 'POST',
            body: {
              membershipId:
                m._id,

              amount:
                Number(amt),
            },
          }
        )

      await loadRazorpay()

      new window.Razorpay({
        key: order.keyId,

        amount:
          order.amount,

        currency: 'INR',

        order_id:
          order.orderId,

        name:
          'Study Library',

        description:
          `${m.plan?.name} · ${m.hall?.name || '-'} · Seat ${m.seat?.number || '-'}`,

        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },

        theme: {
          color: '#2563eb',
        },

        handler:
          async (r) => {
            try {
              await api(
                '/payments/razorpay/verify',
                {
                  method: 'POST',
                  body: r,
                }
              )

              setOk(
                'Payment successful. Thank you!'
              )

              setAmount('')

              await load()
            } catch (err) {
              setError(
                err.message +
                ' If money was deducted, it will be confirmed shortly.'
              )
            }
          },
      }).open()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <h1>
        Hi,{' '}
        {user.name.split(' ')[0]} 👋
      </h1>

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

      {notice && (
        <Link
          to="/student/notices"
          className="card notice-card pinned"
          style={{
            display: 'block',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <b>
            {notice.pinned &&
              '📌 '}

            {notice.title}
          </b>

          <p>
            {notice.body.length >
              140
              ? notice.body.slice(
                0,
                140
              ) + '…'
              : notice.body}
          </p>
        </Link>
      )}

      {c ? (
        <div className="card hero">
          <span className="muted">
            Your seat
          </span>

          <b className="big">
            {c.hall?.name || '-'} · Seat{' '}
            {c.seat?.number || '-'}
          </b>

          <p>
            {c.plan?.name} ·{' '}
            {c.shift?.name}{' '}
            (
            {c.shift?.startTime}-
            {c.shift?.endTime}
            )
          </p>

          <p className="expiry-info">
            Valid till{' '}
            <b className={left <= 3 ? 'expiry-date urgent' : 'expiry-date'} style={{ color: "orange" }}>
              {fmtDate(c.endDate)}
            </b>{' '}
            ·{' '}
            <b className={left <= 3 ? 'expiry-days urgent' : 'expiry-days'} style={{ color: "pink" }}>
              {left} day{left === 1 ? '' : 's'} left
            </b>

            {c.status === 'paused' && (
              <span className="paused-label"> (paused)</span>
            )}
          </p>
          {c.status ===
            'active' && (
              <Link
                to="/student/change-seat"
                className="button"
              >
                Change Seat
              </Link>
            )}
        </div>
      ) : (
        <div className="card">
          <p>
            You don't have an
            active seat right now.
            Please contact the
            library desk.
          </p>
        </div>
      )}

      {owing.map((m) => (
        <div
          className="card due"
          key={m._id}
        >
          <div>
            <b>
              {rupees(m.due)} due
            </b>

            <small>
              {m.plan?.name} ·{' '}
              {m.hall?.name || '-'} · Seat{' '}
              {m.seat?.number || '-'} ·{' '}
              {fmtDate(
                m.startDate
              )}{' '}
              →{' '}
              {fmtDate(
                m.endDate
              )}{' '}
              (paid{' '}
              {rupees(m.paid)} of{' '}
              {rupees(
                m.amount
              )}
              )
            </small>
          </div>

          {online ? (
            <div className="row-form">
              <input
                type="number"
                min="1"
                max={m.due}
                value={
                  m._id ===
                    c?._id
                    ? amount
                    : m.due
                }
                disabled={
                  m._id !==
                  c?._id
                }
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                style={{
                  maxWidth: 120,
                }}
              />

              <button
                onClick={() =>
                  pay(
                    m,
                    m._id ===
                      c?._id
                      ? amount
                      : m.due
                  )
                }
              >
                Pay online
              </button>
            </div>
          ) : (
            <small>
              Pay at the library
              desk.
            </small>
          )}
        </div>
      ))}

      <div className="card">
        <h3>
          Payments
        </h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  Date
                </th>

                <th>
                  Receipt
                </th>

                <th>
                  Method
                </th>

                <th>
                  Amount
                </th>

                <th></th>
              </tr>
            </thead>

            <tbody>
              {payments.map(
                (p) => (
                  <tr
                    key={p._id}
                  >
                    <td>
                      {fmtDateTime(
                        p.paidAt
                      )}
                    </td>

                    <td>
                      {p.receiptNo}
                    </td>

                    <td>
                      {p.method}
                    </td>

                    <td
                      style={{
                        color:
                          p.type ===
                            'refund'
                            ? '#dc2626'
                            : undefined,
                      }}
                    >
                      {p.type ===
                        'refund'
                        ? '−'
                        : ''}

                      {rupees(
                        p.amount
                      )}
                    </td>

                    <td>
                      <button
                        className="ghost"
                        onClick={() =>
                          downloadReceipt(
                            p._id,
                            p.receiptNo
                          ).catch(
                            (e) =>
                              setError(
                                e.message
                              )
                          )
                        }
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                )
              )}

              {payments.length ===
                0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="muted"
                    >
                      No payments yet.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>
          History
        </h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  Hall / Seat
                </th>

                <th>
                  Plan
                </th>

                <th>
                  Dates
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Due
                </th>

                <th>
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {d.history.map(
                (m) => (
                  <tr
                    key={m._id}
                  >
                    <td>
                      {m.hall?.name || '-'} · Seat{' '}
                      {m.seat?.number || '-'}
                    </td>
                    <td>
                      {m.plan?.name}
                    </td>

                    <td>
                      {fmtDate(
                        m.startDate
                      )}{' '}
                      →{' '}
                      {fmtDate(
                        m.endDate
                      )}
                    </td>

                    <td>
                      {rupees(
                        m.amount
                      )}
                    </td>

                    <td>
                      {m.due > 0
                        ? rupees(
                          m.due
                        )
                        : '-'}
                    </td>

                    <td>
                      {m.status}
                    </td>
                  </tr>
                )
              )}

              {d.history.length ===
                0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="muted"
                    >
                      No memberships
                      yet.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}