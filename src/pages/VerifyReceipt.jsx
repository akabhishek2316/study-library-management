import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import './VerifyReceipt.css'

const API_URL = import.meta.env.VITE_API_URL

const formatDate = (value) => {
    if (!value) return 'Not available'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return 'Not available'

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

const formatAmount = (value) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(value ?? 0)

const methodLabel = (method) => {
    const labels = {
        cash: 'Cash',
        upi: 'UPI',
        bank: 'Bank Transfer',
        card: 'Card',
        online: 'Online',
    }

    return labels[method] || method || 'Not available'
}

function VerifyReceipt() {
    const { token } = useParams()
    const [receipt, setReceipt] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const controller = new AbortController()


        const verifyReceipt = async () => {
            setLoading(true)
            setError('')
            setReceipt(null)

            try {
                const response = await fetch(
                    `${API_URL}/payments/verify/${encodeURIComponent(token || '')}`,
                    { signal: controller.signal }
                )

                const data = await response.json()

                if (!response.ok || !data.valid) {
                    throw new Error(
                        data.message || 'This receipt could not be verified.'
                    )
                }

                setReceipt(data)
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(err.message || 'Unable to verify this receipt.')
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        verifyReceipt()

        return () => controller.abort()


    }, [token])

    const isRefund = receipt?.type === 'refund'
    const membership = receipt?.membership

    return (
        <main className="verify-page">

            <div className="verify-container">


                <header className="verify-brand">
                    <div className="verify-brand-icon">R</div>
                    <div> <h1>Reading Room</h1> <p>The Library · Receipt Verification</p> </div>
                </header>
                {loading ? (
                    <section className="verify-card verify-centered">
                        <div className="verify-spinner" />
                        <h2>Verifying receipt</h2>
                        <p>Please wait while we check the library records.</p>
                    </section>
                ) : error ? (
                    <section className="verify-card verify-centered">
                        <div className="verify-status-icon verify-error-icon">!</div>
                        <h2>Receipt not verified</h2>
                        <p>{error}</p>
                        <button
                            className="verify-retry"
                            onClick={() => window.location.reload()}
                        >
                            Try again
                        </button>
                    </section>
                ) : (
                    <section className="verify-card">
                        <div className="verify-status-banner">
                            <div className="verify-status-icon">
                                {isRefund ? '↩' : '✓'}
                            </div>
                            <div>
                                <span className="verify-status-label">
                                    {isRefund ? 'REFUND VERIFIED' : 'PAYMENT VERIFIED'}
                                </span>
                                <p>{receipt.message}</p>
                            </div>
                        </div>

                        <div className="verify-amount-section">
                            <span>{isRefund ? 'Refund amount' : 'Amount received'}</span>
                            <h2>{formatAmount(receipt.amount)}</h2>
                            <div className="verify-receipt-number">
                                <span>Receipt No.</span>
                                <strong>{receipt.receiptNo || 'Not available'}</strong>
                            </div>
                        </div>

                        <div className="verify-section">
                            <h3>Payment details</h3>
                            <div className="verify-details-grid">
                                <Detail
                                    label="Payment date"
                                    value={formatDate(receipt.paidAt)}
                                />
                                <Detail
                                    label="Payment method"
                                    value={methodLabel(receipt.method)}
                                />
                                <Detail
                                    label="Receipt type"
                                    value={isRefund ? 'Refund' : 'Membership payment'}
                                />
                                <Detail label="Payment status" value="Verified" />
                            </div>
                        </div>

                        <div className="verify-section">
                            <h3>Student details</h3>
                            <div className="verify-detail-row">
                                <span>Student name</span>
                                <strong>{receipt.student?.name || 'Not available'}</strong>
                            </div>
                        </div>

                       {membership && (
    <div className="verify-section">
        <h3>Membership details</h3>

        <div className="verify-details-grid">
            <Detail
                label="Membership plan"
                value={membership.plan}
            />

            <Detail
                label="Hall"
                value={membership.hall}
            />

            <Detail
                label="Seat number"
                value={membership.seat}
            />

            <Detail
                label="Shift"
                value={membership.shift}
            />

            <Detail
                label="Membership status"
                value={membership.status}
            />

            <Detail
                label="Valid from"
                value={formatDate(
                    membership.startDate
                )}
            />

            <Detail
                label="Valid until"
                value={formatDate(
                    membership.endDate
                )}
            />
        </div>
    </div>
)}

                        <footer className="verify-footer">
                            <span className="verify-footer-check">✓</span>
                            <p>
                                This information was retrieved from the library payment
                                records. This page verifies the recorded transaction; it is
                                not a guarantee of current membership eligibility.
                            </p>
                        </footer>
                    </section>
                )}

                <p className="verify-bottom-note">
                    Reading Room — The Library
                </p>
            </div>
        </main>


    )
}

function Detail({ label, value }) {
    return (<div className="verify-detail-item"> <span>{label}</span> <strong>{value ?? 'Not available'}</strong> </div>
    )
}

export default VerifyReceipt
