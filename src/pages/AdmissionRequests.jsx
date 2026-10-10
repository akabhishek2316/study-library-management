import { useEffect, useState } from 'react'

import {
  Pager,
  usePaged,
} from '../components/ListTools'

import { useAuth } from '../AuthContext'

import { api, fmtDate } from '../api'


const STATUS_FILTERS = [
  'all',
  'pending',
  'rejected',
]

export default function AdmissionRequests() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState({})
  const [selectedRequest, setSelectedRequest] =
    useState(null)

  const load = () =>
  api('/admissions')
    .then((data) =>
      setList(
        data.filter(
          (request) =>
            request.status !== 'approved'
        )
      )
    )
    .catch((e) =>
      setError(e.message)
    )

  useEffect(() => {
    load()
  }, [])

  const review = async (
    request,
    action,
    hall,
    seat
  ) => {
    const key = `${request._id}-${action}`

    setError('')

    setBusy((prev) => ({
      ...prev,
      [key]: true,
    }))

    try {
      const body =
        action === 'approve'
          ? {
              hall,
              seat,
            }
          : undefined

      await api(
        `/admissions/${request._id}/${action}`,
        {
          method: 'PUT',
          ...(body && {
            body,
          }),
        }
      )

      setSelectedRequest(null)

      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy((prev) => ({
        ...prev,
        [key]: false,
      }))
    }
  }

  const approve = async (
    request,
    hall,
    seat
  ) => {
    if (!hall || !seat) {
      setError(
        'Please assign a hall and seat before approving this admission.'
      )

      return
    }

    if (
      !confirm(
        `Approve admission for ${request.user?.name} with ${hall.name}, Seat ${seat.number}?`
      )
    ) {
      return
    }

    await review(
      request,
      'approve',
      hall._id,
      seat._id
    )
  }

  const reject = async (request) => {
    if (
      !confirm(
        `Reject admission for ${request.user?.name}?`
      )
    ) {
      return
    }

    await review(
      request,
      'reject'
    )
  }

  const removeRequest = async (request) => {
    if (
      !confirm(
        `Delete the rejected request of ${request.user?.name}? This cannot be undone.`
      )
    ) {
      return
    }

    try {
      await api(`/admissions/${request._id}`, {
        method: 'DELETE',
      })

      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const filteredList = list.filter(
    (request) => {
      if (
        status !== 'all' &&
        request.status !== status
      ) {
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
        name
          .toLowerCase()
          .includes(search) ||
        email
          .toLowerCase()
          .includes(search) ||
        phone
          .toLowerCase()
          .includes(search)
      )
    }
  )

  const paged = usePaged(filteredList, {
    pageSize: 15,
  })

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
                status === item
                  ? 'on'
                  : ''
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
                <th>Requested Hall</th>
                <th>Requested</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {paged.items.map(
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
                      {request
                        .preferredHall
                        ?.name || '-'}
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
        setSelectedRequest(request)
      }
    >
      View & Assign
    </button>

    {request.status ===
      'pending' && (
      <button
        className="ghost danger"
        disabled={
          busy[
            `${request._id}-reject`
          ]
        }
        onClick={() =>
          reject(request)
        }
      >
        {busy[
          `${request._id}-reject`
        ]
          ? 'Rejecting...'
          : 'Reject'}
      </button>
    )}

    {request.status === 'rejected' &&
      user?.role === 'owner' && (
        <button
          className="ghost danger"
          onClick={() =>
            removeRequest(request)
          }
        >
          Delete
        </button>
      )}
  </div>
</td>
                  </tr>
                )
              )}

            </tbody>
          </table>
        </div>

        <Pager list={paged} />
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
  const preferredHall =
    request.preferredHall || {}

  const [halls, setHalls] = useState([])

  const [selectedHall, setSelectedHall] =
    useState(
      preferredHall._id || ''
    )

  const [seats, setSeats] = useState([])

  const [selectedSeat, setSelectedSeat] =
    useState('')

  const [hallLoading, setHallLoading] =
    useState(false)

  const [seatLoading, setSeatLoading] =
    useState(false)

  const [assignmentError, setAssignmentError] =
    useState('')

  const approveBusy =
    busy[`${request._id}-approve`]

  const rejectBusy =
    busy[`${request._id}-reject`]

  // Load all active halls
  useEffect(() => {
    if (
      request.status !==
      'pending'
    ) {
      setHalls([])
      return
    }

    if (!plan._id) {
      setAssignmentError(
        'Plan information is not available.'
      )

      return
    }

    setHallLoading(true)
    setAssignmentError('')

    api(
      `/admissions/available-halls?plan=${encodeURIComponent(
        plan._id
      )}`
    )
      .then((data) => {
        const availableHalls =
          Array.isArray(data)
            ? data
            : []

        setHalls(
          availableHalls
        )

        const preferred =
          availableHalls.find(
            (hall) =>
              hall._id ===
              preferredHall._id
          )

        if (preferred) {
          setSelectedHall(
            preferred._id
          )
        } else if (
          availableHalls.length > 0
        ) {
          setSelectedHall(
            availableHalls[0]._id
          )
        }
      })
      .catch((err) => {
        setAssignmentError(
          err.message
        )
      })
      .finally(() => {
        setHallLoading(false)
      })
  }, [
    request._id,
    request.status,
    plan._id,
    preferredHall._id,
  ])

  // Load seats whenever selected hall changes
  useEffect(() => {
    if (
      request.status !==
      'pending'
    ) {
      setSeats([])
      setSelectedSeat('')
      return
    }

    if (!selectedHall) {
      setSeats([])
      setSelectedSeat('')
      return
    }

    setSeatLoading(true)
    setAssignmentError('')
    setSelectedSeat('')
    setSeats([])

    api(
      `/admissions/${request._id}/available-seats?hall=${encodeURIComponent(
        selectedHall
      )}`
    )
      .then((data) => {
        const availableSeats =
          Array.isArray(data)
            ? data
            : data.seats || []

        setSeats(
          availableSeats
        )
      })
      .catch((err) => {
        setAssignmentError(
          err.message
        )
      })
      .finally(() => {
        setSeatLoading(false)
      })
  }, [
    request._id,
    request.status,
    selectedHall,
  ])

  const selectedHallData =
    halls.find(
      (hall) =>
        hall._id ===
        selectedHall
    ) || null

  const selectedSeatData =
    seats.find(
      (seat) =>
        seat._id ===
        selectedSeat
    ) || null

  const handleHallChange = (
    event
  ) => {
    setSelectedHall(
      event.target.value
    )

    setSelectedSeat('')
    setSeats([])
    setAssignmentError('')
  }

  return (
    <div
      className="admission-modal-backdrop"
      onMouseDown={(e) => {
        if (
          e.target ===
          e.currentTarget
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
                  alt={
                    user.name ||
                    'Applicant'
                  }
                />
              ) : (
                <span>
                  {(
                    user.name ||
                    'A'
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
                user.idProofNumber ||
                '-'
              }
            />

            <div className="admission-document">
              <span>
                ID Proof Document
              </span>

              {user.idProof?.url ? (
                <a
                  href={
                    user.idProof.url
                  }
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
              value={
                user.yearSemester
              }
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
              label="Preferred Hall"
              value={
                preferredHall.name ||
                '-'
              }
            />

            <Info
              label="Hall Type"
              value={
                preferredHall.type ||
                '-'
              }
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
                request.message ||
                '-'
              }
              full
            />
          </ProfileSection>

          {request.status ===
            'pending' && (
            <ProfileSection
              title="Hall & Seat Assignment"
            >
              <div className="admission-seat-assignment">
                <div>
                  <span className="admission-seat-label">
                    Student Preferred Hall
                  </span>

                  <strong>
                    {preferredHall.name ||
                      '-'}
                  </strong>
                </div>

                <div>
                  <label
                    htmlFor="admission-hall"
                    className="admission-seat-label"
                  >
                    Assign Hall
                  </label>

                  {hallLoading ? (
                    <p>
                      Loading available
                      halls...
                    </p>
                  ) : (
                    <select
                      id="admission-hall"
                      value={
                        selectedHall
                      }
                      onChange={
                        handleHallChange
                      }
                    >
                      <option value="">
                        Select hall
                      </option>

                      {halls.map(
                        (hall) => (
                          <option
                            key={
                              hall._id
                            }
                            value={
                              hall._id
                            }
                          >
                            {hall.name}
                            {hall.type
                              ? ` · ${hall.type}`
                              : ''}
                            {hall.availableSeats !=
                            null
                              ? ` · ${hall.availableSeats} available`
                              : ''}
                          </option>
                        )
                      )}
                    </select>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="admission-seat"
                    className="admission-seat-label"
                  >
                    Assign Seat
                  </label>

                  {seatLoading ? (
                    <p>
                      Loading available
                      seats...
                    </p>
                  ) : (
                    <select
                      id="admission-seat"
                      value={
                        selectedSeat
                      }
                      onChange={(e) =>
                        setSelectedSeat(
                          e.target.value
                        )
                      }
                      disabled={
                        !selectedHall ||
                        halls.length ===
                          0
                      }
                    >
                      <option value="">
                        Select seat
                      </option>

                      {seats.map(
                        (seat) => (
                          <option
                            key={
                              seat._id
                            }
                            value={
                              seat._id
                            }
                          >
                            Seat{' '}
                            {
                              seat.number
                            }

                            {seat.section
                              ? ` · ${seat.section}`
                              : ''}

                            {seat.type
                              ? ` · ${seat.type}`
                              : ''}
                          </option>
                        )
                      )}
                    </select>
                  )}
                </div>

                {selectedHallData && (
                  <div className="admission-assignment-summary">
                    <span>
                      Final Assignment
                    </span>

                    <strong>
                      {
                        selectedHallData.name
                      }{' '}
                      · Seat{' '}
                      {selectedSeatData
                        ?.number ||
                        'Not selected'}
                    </strong>
                  </div>
                )}

                {assignmentError && (
                  <div className="alert error">
                    {
                      assignmentError
                    }
                  </div>
                )}

                {!hallLoading &&
                  !seatLoading &&
                  !assignmentError &&
                  halls.length ===
                    0 && (
                    <p className="muted">
                      No active halls are
                      available.
                    </p>
                  )}

                {!seatLoading &&
                  !assignmentError &&
                  selectedHall &&
                  seats.length ===
                    0 && (
                    <p className="muted">
                      No available seats
                      found in this hall for
                      the selected plan and
                      shift.
                    </p>
                  )}
              </div>
            </ProfileSection>
          )}
        </div>

        {request.status ===
          'pending' && (
          <div className="admission-modal-footer">
            <button
              className="ghost danger"
              disabled={
                rejectBusy
              }
              onClick={() =>
                onReject(request)
              }
            >
              {rejectBusy
                ? 'Rejecting...'
                : 'Reject Admission'}
            </button>

            <button
              disabled={
                approveBusy ||
                !selectedHall ||
                !selectedSeat ||
                hallLoading ||
                seatLoading
              }
              onClick={() =>
                onApprove(
                  request,
                  selectedHallData,
                  selectedSeatData
                )
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

      <strong>
        {value || '-'}
      </strong>
    </div>
  )
}