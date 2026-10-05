import { useEffect, useState } from 'react'

import { api, fmtDate } from '../api'

// import './AdmissionRequests.css'

const STATUS_FILTERS = [
  'all',
  'pending',
  'approved',
  'rejected',
]

export default function AdmissionRequests() {
  const [list, setList] = useState([])
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState({})
  const [selectedRequest, setSelectedRequest] =
    useState(null)

  const load = () =>
    api('/admissions')
      .then(setList)
      .catch((e) =>
        setError(e.message)
      )

  useEffect(() => {
    load()
  }, [])

  const review = async (
    request,
    action
  ) => {
    const key = `${request._id}-${action}`

    setError('')

    setBusy((prev) => ({
      ...prev,
      [key]: true,
    }))

    try {
      await api(
        `/admissions/${request._id}/${action}`,
        {
          method: 'PUT',
        }
      )

      setSelectedRequest(null)

      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy((prev) => ({
        ...prev,
        [key]: false,
      }))
    }
  }

  const approve = async (request) => {
    if (
      !confirm(
        `Approve admission for ${request.user?.name}?`
      )
    ) {
      return
    }

    await review(request, 'approve')
  }

  const reject = async (request) => {
    if (
      !confirm(
        `Reject admission for ${request.user?.name}?`
      )
    ) {
      return
    }

    await review(request, 'reject')
  }

const filteredList = list.filter(
  (request) => {
    if (request.status !== 'pending') {
      return false
    }

    const search =
      q.trim().toLowerCase()

    if (!search) {
      return true
    }

    const name =
      request.user?.name || ''

    const email =
      request.user?.email || ''

    const phone =
      request.user?.phone || ''

    return (
      name.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search) ||
      phone.toLowerCase().includes(search)
    )
  }
)

  return (
    <>
      <h1>Admission Requests</h1>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <div className="card">
        <div className="tabs">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item}
              className={
                status === item ? 'on' : ''
              }
              onClick={() =>
                setStatus(item)
              }
            >
              {item}
            </button>
          ))}
        </div>

        <input
          className="search"
          placeholder="Search name, email or phone..."
          value={q}
          onChange={(e) =>
            setQ(e.target.value)
          }
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Phone</th>
                <th>Plan</th>
                <th>Requested</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredList.map(
                (request) => (
                  <tr key={request._id}>
                    <td>
                      {request.user?.name ||
                        '-'}

                      <small>
                        {request.user?.email ||
                          '-'}
                      </small>

                      {request.message && (
                        <small>
                          {request.message}
                        </small>
                      )}
                    </td>

                    <td>
                      {request.user?.phone ||
                        '-'}
                    </td>

                    <td>
                      {request.plan?.name ||
                        '-'}

                      {request.plan && (
                        <small>
                          ₹
                          {
                            request.plan
                              .price
                          }{' '}
                          ·{' '}
                          {
                            request.plan
                              .durationDays
                          }{' '}
                          days
                        </small>
                      )}
                    </td>

                    <td>
                      {fmtDate(
                        request.createdAt
                      )}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          request.status ===
                          'approved'
                            ? 'ok'
                            : request.status ===
                              'rejected'
                            ? 'danger'
                            : 'gray'
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>

                    <td>
                      <div className="admission-actions">
                        <button
                          className="admission-view-button"
                          onClick={() =>
                            setSelectedRequest(
                              request
                            )
                          }
                        >
                          View & Verify
                        </button>

                        {request.status ===
                          'pending' && (
                          <>
                            <button
                              disabled={
                                busy[
                                  `${request._id}-approve`
                                ]
                              }
                              onClick={() =>
                                approve(
                                  request
                                )
                              }
                            >
                              {busy[
                                `${request._id}-approve`
                              ]
                                ? 'Approving...'
                                : 'Approve'}
                            </button>

                            <button
                              className="ghost danger"
                              disabled={
                                busy[
                                  `${request._id}-reject`
                                ]
                              }
                              onClick={() =>
                                reject(
                                  request
                                )
                              }
                            >
                              {busy[
                                `${request._id}-reject`
                              ]
                                ? 'Rejecting...'
                                : 'Reject'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}

              {filteredList.length ===
                0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="muted"
                  >
                    No admission requests
                    found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRequest && (
        <AdmissionProfile
          request={selectedRequest}
          busy={busy}
          onClose={() =>
            setSelectedRequest(null)
          }
          onApprove={approve}
          onReject={reject}
        />
      )}
    </>
  )
}

function AdmissionProfile({
  request,
  busy,
  onClose,
  onApprove,
  onReject,
}) {
  const user = request.user || {}
  const plan = request.plan || {}
  const seat = request.seat || {}

  const approveBusy =
    busy[`${request._id}-approve`]

  const rejectBusy =
    busy[`${request._id}-reject`]

  return (
    <div
      className="admission-modal-backdrop"
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <div className="admission-modal">
        <div className="admission-modal-header">
          <div>
            <span>
              ADMISSION VERIFICATION
            </span>

            <h2>
              Applicant Profile
            </h2>
          </div>

          <button
            className="admission-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="admission-profile">
          <div className="admission-profile-top">
            <div className="admission-profile-photo">
              {user.photo?.url ? (
                <img
                  src={user.photo.url}
                  alt={user.name || 'Applicant'}
                />
              ) : (
                <span>
                  {(
                    user.name || 'A'
                  )
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <h3>
                {user.name || '-'}
              </h3>

              <p>
                {user.email || '-'}
              </p>

              <p>
                {user.phone || '-'}
              </p>

              <span
                className={`badge ${
                  request.status ===
                  'approved'
                    ? 'ok'
                    : request.status ===
                      'rejected'
                    ? 'danger'
                    : 'gray'
                }`}
              >
                {request.status}
              </span>
            </div>
          </div>

          <ProfileSection
            title="Personal Details"
          >
            <Info
              label="Full Name"
              value={user.name}
            />

            <Info
              label="Email"
              value={user.email}
            />

            <Info
              label="Phone"
              value={user.phone}
            />

            <Info
              label="Date of Birth"
              value={
                user.dob
                  ? fmtDate(user.dob)
                  : '-'
              }
            />

            <Info
              label="Gender"
              value={user.gender}
            />
          </ProfileSection>

          <ProfileSection
            title="Identity Verification"
          >
            <Info
              label="ID Proof Type"
              value={user.idProofType}
            />

            <Info
              label="ID Proof Number"
              value={
                user.idProofNumber || '-'
              }
            />

            <div className="admission-document">
              <span>ID Proof Document</span>

              {user.idProof?.url ? (
                <a
                  href={user.idProof.url}
                  target="_blank"
                  rel="noreferrer"
                  className="admission-document-link"
                >
                  View ID Proof
                </a>
              ) : (
                <strong>
                  Document not available
                </strong>
              )}
            </div>
          </ProfileSection>

          <ProfileSection
            title="Address Details"
          >
            <Info
              label="Address"
              value={user.address}
              full
            />

            <Info
              label="City"
              value={user.city}
            />

            <Info
              label="State"
              value={user.state}
            />

            <Info
              label="PIN Code"
              value={user.pincode}
            />
          </ProfileSection>

          <ProfileSection
            title="Emergency Contact"
          >
            <Info
              label="Name"
              value={
                user.emergencyContact
                  ?.name
              }
            />

            <Info
              label="Relationship"
              value={
                user.emergencyContact
                  ?.relationship
              }
            />

            <Info
              label="Phone"
              value={
                user.emergencyContact
                  ?.phone
              }
            />
          </ProfileSection>

          <ProfileSection
            title="Student Information"
          >
            <Info
              label="Student Type"
              value={user.studentType}
            />

            <Info
              label="Institution / Company"
              value={user.institution}
            />

            <Info
              label="Course / Class"
              value={user.course}
            />

            <Info
              label="Year / Semester"
              value={user.yearSemester}
            />
          </ProfileSection>

          <ProfileSection
            title="Membership Request"
          >
            <Info
              label="Plan"
              value={plan.name}
            />

            <Info
              label="Plan Price"
              value={
                plan.price != null
                  ? `₹${plan.price}`
                  : '-'
              }
            />

            <Info
              label="Duration"
              value={
                plan.durationDays
                  ? `${plan.durationDays} days`
                  : '-'
              }
            />

            <Info
              label="Seat"
              value={
                seat.number
                  ? `Seat ${seat.number}`
                  : '-'
              }
            />

            <Info
              label="Section"
              value={seat.section}
            />

            <Info
              label="Seat Type"
              value={seat.type}
            />

            <Info
              label="Requested On"
              value={fmtDate(
                request.createdAt
              )}
            />

            <Info
              label="Message"
              value={
                request.message || '-'
              }
              full
            />
          </ProfileSection>
        </div>

        {request.status ===
          'pending' && (
          <div className="admission-modal-footer">
            <button
              className="ghost danger"
              disabled={rejectBusy}
              onClick={() =>
                onReject(request)
              }
            >
              {rejectBusy
                ? 'Rejecting...'
                : 'Reject Admission'}
            </button>

            <button
              disabled={approveBusy}
              onClick={() =>
                onApprove(request)
              }
            >
              {approveBusy
                ? 'Approving...'
                : 'Approve Admission'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileSection({
  title,
  children,
}) {
  return (
    <section className="admission-profile-section">
      <h4>{title}</h4>

      <div className="admission-profile-grid">
        {children}
      </div>
    </section>
  )
}

function Info({
  label,
  value,
  full = false,
}) {
  return (
    <div
      className={`admission-info-item ${
        full
          ? 'admission-info-item-full'
          : ''
      }`}
    >
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}