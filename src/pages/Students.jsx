import { useEffect, useState } from 'react'

import {
  api,
  fmtDate,
} from '../api'

// import './Students.css'

const empty = {
  name: '',
  email: '',
  phone: '',
  dob: '',
  gender: '',
  idProofType: '',
  idProofNumber: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  emergencyName: '',
  emergencyRelation: '',
  emergencyPhone: '',
  studentType: '',
  institution: '',
  course: '',
  yearSemester: '',
}

const BASE =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'

export default function Students() {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('active')

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    emergencyContact: '',
  })

  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  const [selectedStudent, setSelectedStudent] =
    useState(null)

  const [editing, setEditing] = useState(false)

  const [profileForm, setProfileForm] =
    useState(empty)

  const [profilePhoto, setProfilePhoto] =
    useState(null)

  const [idProofFile, setIdProofFile] =
    useState(null)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] =
    useState(false)

  const load = () =>
    api(
      `/students?status=${status}&q=${encodeURIComponent(q)}`
    )
      .then(setList)
      .catch((e) =>
        setError(e.message)
      )

  useEffect(() => {
    const t = setTimeout(
      load,
      250
    )

    return () =>
      clearTimeout(t)
  }, [q, status])

  const add = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const d = await api('/students', {
        method: 'POST',
        body: form,
      })

      setCreated({
        name: d.student.name,
        email: d.student.email,
        password: d.tempPassword,
      })

      setForm({
        name: '',
        email: '',
        phone: '',
        emergencyContact: '',
      })

      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const deactivate = async (s) => {
    if (
      !confirm(
        `Deactivate ${s.name}? Their seat will be released.`
      )
    ) {
      return
    }

    try {
      await api(
        `/students/${s._id}`,
        {
          method: 'DELETE',
        }
      )

      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const activate = async (s) => {
    if (
      !confirm(
        `Activate ${s.name} again?`
      )
    ) {
      return
    }

    try {
      await api(
        `/students/${s._id}/activate`,
        {
          method: 'PATCH',
        }
      )

      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const openProfile = async (student) => {
    setError('')

    try {
      const data = await api(
        `/students/${student._id}`
      )

      setSelectedStudent(data)
      setEditing(false)

      setProfileForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        dob: data.dob
          ? String(data.dob).slice(0, 10)
          : '',
        gender: data.gender || '',
        idProofType:
          data.idProofType || '',
        idProofNumber:
          data.idProofNumber || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        emergencyName:
          data.emergencyContact?.name || '',
        emergencyRelation:
          data.emergencyContact?.relationship ||
          '',
        emergencyPhone:
          data.emergencyContact?.phone || '',
        studentType:
          data.studentType || '',
        institution:
          data.institution || '',
        course: data.course || '',
        yearSemester:
          data.yearSemester || '',
      })

      setProfilePhoto(null)
      setIdProofFile(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const closeProfile = () => {
    setSelectedStudent(null)
    setEditing(false)
    setProfilePhoto(null)
    setIdProofFile(null)
  }

  const setProfile = (key) => (e) => {
    setProfileForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }))
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const updated =
        await api(
          `/students/${selectedStudent._id}`,
          {
            method: 'PUT',
            body: {
              name: profileForm.name,
              email: profileForm.email,
              phone: profileForm.phone,
              dob: profileForm.dob || undefined,
              gender:
                profileForm.gender ||
                undefined,
              idProofType:
                profileForm.idProofType ||
                undefined,
              idProofNumber:
                profileForm.idProofNumber,
              address: profileForm.address,
              city: profileForm.city,
              state: profileForm.state,
              pincode: profileForm.pincode,
              emergencyContact: {
                name:
                  profileForm.emergencyName,
                relationship:
                  profileForm.emergencyRelation,
                phone:
                  profileForm.emergencyPhone,
              },
              studentType:
                profileForm.studentType ||
                undefined,
              institution:
                profileForm.institution,
              course:
                profileForm.course,
              yearSemester:
                profileForm.yearSemester,
            },
          }
        )

      setSelectedStudent({
        ...selectedStudent,
        ...updated,
      })

      if (
        profilePhoto ||
        idProofFile
      ) {
        await uploadDocuments(
          selectedStudent._id,
          profilePhoto,
          idProofFile
        )
      }

      setEditing(false)
      setProfilePhoto(null)
      setIdProofFile(null)

      await load()

      const fresh =
        await api(
          `/students/${selectedStudent._id}`
        )

      setSelectedStudent(fresh)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const uploadDocuments = async (
    studentId,
    photo,
    idProof
  ) => {
    if (!photo && !idProof) {
      return
    }

    setUploading(true)

    try {
      const formData =
        new FormData()

      if (photo) {
        formData.append(
          'photo',
          photo
        )
      }

      if (idProof) {
        formData.append(
          'aadhar',
          idProof
        )
      }

      const res = await fetch(
        `${BASE}/students/${studentId}/documents`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              'token'
            )}`,
          },
          body: formData,
        }
      )

      const data = await res
        .json()
        .catch(() => ({}))

      if (!res.ok) {
        throw new Error(
          data.message ||
            'Document upload failed'
        )
      }
    } finally {
      setUploading(false)
    }
  }

  const set = (k) => (e) =>
    setForm({
      ...form,
      [k]: e.target.value,
    })

  return (
    <>
      <h1>Students</h1>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {created && (
        <div className="alert ok">
          <b>{created.name}</b> added.
          Login: {created.email} /
          password:{' '}
          <b>{created.password}</b>{' '}
          (shown only once, share it with
          the student)

          <button
            className="ghost"
            onClick={() =>
              setCreated(null)
            }
          >
            Close
          </button>
        </div>
      )}

      <form
        className="card row-form"
        onSubmit={add}
      >
        <input
          placeholder="Full name *"
          value={form.name}
          onChange={set('name')}
          required
        />

        <input
          placeholder="Email *"
          type="email"
          value={form.email}
          onChange={set('email')}
          required
        />

        <input
          placeholder="Phone"
          value={form.phone}
          onChange={set('phone')}
        />

        <input
          placeholder="Emergency contact"
          value={form.emergencyContact}
          onChange={set(
            'emergencyContact'
          )}
        />

        <button>
          Add student
        </button>
      </form>

      <div className="card">
        <div className="tabs">
          <button
            className={
              status === 'active'
                ? 'on'
                : ''
            }
            onClick={() =>
              setStatus('active')
            }
          >
            Active Students
          </button>

          <button
            className={
              status === 'inactive'
                ? 'on'
                : ''
            }
            onClick={() =>
              setStatus('inactive')
            }
          >
            Inactive Students
          </button>
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
                <th>Name</th>
                <th>Phone</th>
                <th>Seat / Plan</th>
                <th>Valid till</th>
                <th>Profile</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {list.map((s) => (
                <tr key={s._id}>
                  <td>
                    {s.name}

                    <small>
                      {s.email}
                    </small>
                  </td>

                  <td>
                    {s.phone || '-'}
                  </td>

                  <td>
                    {s.current ? (
                      <>
                        Seat{' '}
                        {s.current.seat?.number}

                        <small>
                          {s.current.plan?.name}{' '}
                          ·{' '}
                          {s.current.shift?.name}
                        </small>
                      </>
                    ) : (
                      <span className="badge gray">
                        No seat
                      </span>
                    )}
                  </td>

                  <td>
                    {s.current
                      ? fmtDate(
                          s.current.endDate
                        )
                      : '-'}
                  </td>

                  <td>
                    <button
                      className="ghost"
                      onClick={() =>
                        openProfile(s)
                      }
                    >
                      View Profile
                    </button>
                  </td>

                  <td>
                    {status === 'active' ? (
                      <button
                        className="ghost danger"
                        onClick={() =>
                          deactivate(s)
                        }
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="ghost"
                        onClick={() =>
                          activate(s)
                        }
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {list.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="muted"
                  >
                    No students yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <div
          className="student-modal-backdrop"
          onClick={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeProfile()
            }
          }}
        >
          <div className="student-modal">
            <div className="student-modal-header">
              <div>
                <h2>
                  {editing
                    ? 'Update Profile'
                    : 'Student Profile'}
                </h2>

                <small>
                  {selectedStudent.email}
                </small>
              </div>

              <button
                className="ghost"
                onClick={closeProfile}
              >
                Close
              </button>
            </div>

            {!editing ? (
              <>
                <div className="student-profile-top">
                  <div className="student-profile-photo">
                    {selectedStudent.photo?.url ? (
                      <img
                        src={
                          selectedStudent
                            .photo.url
                        }
                        alt={
                          selectedStudent.name
                        }
                      />
                    ) : (
                      <span>
                        {selectedStudent.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          'S'}
                      </span>
                    )}
                  </div>

                  <div>
                    <h2>
                      {selectedStudent.name}
                    </h2>

                    <p>
                      {selectedStudent.email}
                    </p>

                    <p>
                      {selectedStudent.phone ||
                        '-'}
                    </p>
                  </div>
                </div>

                <ProfileSection title="Personal Information">
                  <Info
                    label="Full Name"
                    value={
                      selectedStudent.name
                    }
                  />

                  <Info
                    label="Email"
                    value={
                      selectedStudent.email
                    }
                  />

                  <Info
                    label="Phone"
                    value={
                      selectedStudent.phone
                    }
                  />

                  <Info
                    label="Date of Birth"
                    value={
                      selectedStudent.dob
                        ? fmtDate(
                            selectedStudent.dob
                          )
                        : '-'
                    }
                  />

                  <Info
                    label="Gender"
                    value={
                      selectedStudent.gender
                    }
                  />
                </ProfileSection>

                <ProfileSection title="Identity">
                  <Info
                    label="ID Proof Type"
                    value={
                      selectedStudent.idProofType
                    }
                  />

                  <Info
                    label="ID Proof Number"
                    value={
                      selectedStudent.idProofNumber
                    }
                  />

                  <div className="profile-info-item">
                    <span>
                      ID Proof Document
                    </span>

                    {selectedStudent
                      .idProof?.url ? (
                      <a
                        href={
                          selectedStudent
                            .idProof.url
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Document
                      </a>
                    ) : (
                      <strong>-</strong>
                    )}
                  </div>
                </ProfileSection>

                <ProfileSection title="Address">
                  <Info
                    label="Address"
                    value={
                      selectedStudent.address
                    }
                  />

                  <Info
                    label="City"
                    value={
                      selectedStudent.city
                    }
                  />

                  <Info
                    label="State"
                    value={
                      selectedStudent.state
                    }
                  />

                  <Info
                    label="PIN"
                    value={
                      selectedStudent.pincode
                    }
                  />
                </ProfileSection>

                <ProfileSection title="Emergency Contact">
                  <Info
                    label="Name"
                    value={
                      selectedStudent
                        .emergencyContact
                        ?.name
                    }
                  />

                  <Info
                    label="Relationship"
                    value={
                      selectedStudent
                        .emergencyContact
                        ?.relationship
                    }
                  />

                  <Info
                    label="Phone"
                    value={
                      selectedStudent
                        .emergencyContact
                        ?.phone
                    }
                  />
                </ProfileSection>

                <ProfileSection title="Student Information">
                  <Info
                    label="Type"
                    value={
                      selectedStudent.studentType
                    }
                  />

                  <Info
                    label="Institution"
                    value={
                      selectedStudent.institution
                    }
                  />

                  <Info
                    label="Course / Class"
                    value={
                      selectedStudent.course
                    }
                  />

                  <Info
                    label="Year / Semester"
                    value={
                      selectedStudent.yearSemester
                    }
                  />
                </ProfileSection>

                <ProfileSection title="Current Membership">
                  <Info
                    label="Plan"
                    value={
                      selectedStudent.current
                        ?.plan?.name
                    }
                  />

                  <Info
                    label="Seat"
                    value={
                      selectedStudent.current
                        ?.seat?.number
                    }
                  />

                  <Info
                    label="Shift"
                    value={
                      selectedStudent.current
                        ?.shift?.name
                    }
                  />

                  <Info
                    label="Valid Till"
                    value={
                      selectedStudent.current
                        ?.endDate
                        ? fmtDate(
                            selectedStudent
                              .current
                              .endDate
                          )
                        : '-'
                    }
                  />
                </ProfileSection>

                <div className="student-modal-footer">
                  <button
                    onClick={() =>
                      setEditing(true)
                    }
                  >
                    Update Profile
                  </button>

                  <button
                    className="ghost"
                    onClick={closeProfile}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <form
                className="student-edit-form"
                onSubmit={saveProfile}
              >
                <ProfileSection title="Personal Information">
                  <Field
                    label="Full Name"
                    value={
                      profileForm.name
                    }
                    onChange={setProfile(
                      'name'
                    )}
                    required
                  />

                  <Field
                    label="Email"
                    type="email"
                    value={
                      profileForm.email
                    }
                    onChange={setProfile(
                      'email'
                    )}
                    required
                  />

                  <Field
                    label="Phone"
                    value={
                      profileForm.phone
                    }
                    onChange={setProfile(
                      'phone'
                    )}
                  />

                  <Field
                    label="Date of Birth"
                    type="date"
                    value={
                      profileForm.dob
                    }
                    onChange={setProfile(
                      'dob'
                    )}
                  />

                  <Field
                    label="Gender"
                    type="select"
                    value={
                      profileForm.gender
                    }
                    onChange={setProfile(
                      'gender'
                    )}
                    options={[
                      '',
                      'Male',
                      'Female',
                      'Other',
                      'Prefer not to say',
                    ]}
                  />
                </ProfileSection>

                <ProfileSection title="Identity">
                  <Field
                    label="ID Proof Type"
                    type="select"
                    value={
                      profileForm.idProofType
                    }
                    onChange={setProfile(
                      'idProofType'
                    )}
                    options={[
                      '',
                      'Aadhaar',
                      'PAN',
                      'Driving Licence',
                      'Voter ID',
                      'Other',
                    ]}
                  />

                  <Field
                    label="ID Proof Number"
                    value={
                      profileForm.idProofNumber
                    }
                    onChange={setProfile(
                      'idProofNumber'
                    )}
                  />
                </ProfileSection>

                <ProfileSection title="Address">
                  <Field
                    label="Address"
                    value={
                      profileForm.address
                    }
                    onChange={setProfile(
                      'address'
                    )}
                  />

                  <Field
                    label="City"
                    value={
                      profileForm.city
                    }
                    onChange={setProfile(
                      'city'
                    )}
                  />

                  <Field
                    label="State"
                    value={
                      profileForm.state
                    }
                    onChange={setProfile(
                      'state'
                    )}
                  />

                  <Field
                    label="PIN"
                    value={
                      profileForm.pincode
                    }
                    onChange={setProfile(
                      'pincode'
                    )}
                  />
                </ProfileSection>

                <ProfileSection title="Emergency Contact">
                  <Field
                    label="Name"
                    value={
                      profileForm.emergencyName
                    }
                    onChange={setProfile(
                      'emergencyName'
                    )}
                  />

                  <Field
                    label="Relationship"
                    value={
                      profileForm.emergencyRelation
                    }
                    onChange={setProfile(
                      'emergencyRelation'
                    )}
                  />

                  <Field
                    label="Phone"
                    value={
                      profileForm.emergencyPhone
                    }
                    onChange={setProfile(
                      'emergencyPhone'
                    )}
                  />
                </ProfileSection>

                <ProfileSection title="Student Information">
                  <Field
                    label="Student Type"
                    type="select"
                    value={
                      profileForm.studentType
                    }
                    onChange={setProfile(
                      'studentType'
                    )}
                    options={[
                      '',
                      'Student',
                      'Working Professional',
                      'Other',
                    ]}
                  />

                  <Field
                    label="Institution"
                    value={
                      profileForm.institution
                    }
                    onChange={setProfile(
                      'institution'
                    )}
                  />

                  <Field
                    label="Course / Class"
                    value={
                      profileForm.course
                    }
                    onChange={setProfile(
                      'course'
                    )}
                  />

                  <Field
                    label="Year / Semester"
                    value={
                      profileForm.yearSemester
                    }
                    onChange={setProfile(
                      'yearSemester'
                    )}
                  />
                </ProfileSection>

                <ProfileSection title="Documents">
                  <div className="profile-upload">
                    <label>
                      <span>
                        Profile Photo
                      </span>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) =>
                          setProfilePhoto(
                            e.target
                              .files?.[0] ||
                              null
                          )
                        }
                      />
                    </label>

                    {selectedStudent
                      .photo?.url && (
                      <small>
                        Existing photo available
                      </small>
                    )}
                  </div>

                  <div className="profile-upload">
                    <label>
                      <span>
                        ID Proof Document
                      </span>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(e) =>
                          setIdProofFile(
                            e.target
                              .files?.[0] ||
                              null
                          )
                        }
                      />
                    </label>

                    {selectedStudent
                      .idProof?.url && (
                      <small>
                        Existing document available
                      </small>
                    )}
                  </div>
                </ProfileSection>

                <div className="student-modal-footer">
                  <button
                    type="submit"
                    disabled={
                      saving ||
                      uploading
                    }
                  >
                    {saving ||
                    uploading
                      ? 'Saving...'
                      : 'Save Changes'}
                  </button>

                  <button
                    type="button"
                    className="ghost"
                    onClick={() =>
                      setEditing(false)
                    }
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function ProfileSection({
  title,
  children,
}) {
  return (
    <section className="student-profile-section">
      <h3>{title}</h3>

      <div className="student-profile-grid">
        {children}
      </div>
    </section>
  )
}

function Info({
  label,
  value,
}) {
  return (
    <div className="profile-info-item">
      <span>{label}</span>
      <strong>
        {value || '-'}
      </strong>
    </div>
  )
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  options = [],
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>

      {type === 'select' ? (
        <select
          value={value}
          onChange={onChange}
        >
          {options.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option || 'Select'}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          required={required}
        />
      )}
    </label>
  )
}