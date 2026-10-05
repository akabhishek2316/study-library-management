import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { api } from '../api'

import './Admission.css'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',

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
  year: '',

  plan: '',
  seat: '',
  message: ''
}

const STEPS = [
  {
    number: '01',
    title: 'Personal Details',
    text: 'Basic information for your library account.'
  },
  {
    number: '02',
    title: 'Identity Verification',
    text: 'Information used by administration for verification.'
  },
  {
    number: '03',
    title: 'Address Details',
    text: 'Your current residential address.'
  },
  {
    number: '04',
    title: 'Emergency Contact',
    text: 'Someone the library can contact when necessary.'
  },
  {
    number: '05',
    title: 'Student Information',
    text: 'Helps us understand your study requirements.'
  },
  {
    number: '06',
    title: 'Membership',
    text: 'Select your preferred plan and available seat.'
  }
]

export default function Admission() {
  const [searchParams] = useSearchParams()

  const [plans, setPlans] = useState([])
  const [seats, setSeats] = useState([])

  const [form, setForm] = useState(emptyForm)

  const [photo, setPhoto] = useState(null)
  const [idProof, setIdProof] = useState(null)

  const [currentStep, setCurrentStep] = useState(0)

  const [loadingPlans, setLoadingPlans] = useState(true)
  const [loadingSeats, setLoadingSeats] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoadingPlans(true)
      setError('')

      const data = await api('/plans/public')

      setPlans(data)

      const queryPlan = searchParams.get('plan')

      const selectedPlan =
        data.find(
          (plan) => plan._id === queryPlan
        )?._id || data[0]?._id || ''

      setForm((prev) => ({
        ...prev,
        plan: selectedPlan
      }))

      if (selectedPlan) {
        await loadSeats(selectedPlan)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingPlans(false)
    }
  }

  const loadSeats = async (planId) => {
    if (!planId) {
      setSeats([])
      return
    }

    try {
      setLoadingSeats(true)
      setError('')
      setSeats([])

      const data = await api(
        `/admissions/available-seats?plan=${planId}`
      )

      setSeats(data)

      setForm((prev) => ({
        ...prev,
        seat: data[0]?._id || ''
      }))
    } catch (err) {
      setSeats([])

      setForm((prev) => ({
        ...prev,
        seat: ''
      }))

      setError(err.message)
    } finally {
      setLoadingSeats(false)
    }
  }

  const set = (key) => async (e) => {
    const value = e.target.value

    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'plan'
        ? { seat: '' }
        : {})
    }))

    if (key === 'plan') {
      await loadSeats(value)
    }
  }

  const handlePhoto = (e) => {
    setPhoto(e.target.files?.[0] || null)
  }

  const handleIdProof = (e) => {
    setIdProof(e.target.files?.[0] || null)
  }

  const validateStep = () => {
    setError('')

    if (currentStep === 0) {
      if (!form.name.trim()) {
        setError('Please enter your full name.')
        return false
      }

      if (!form.email.trim()) {
        setError('Please enter your email.')
        return false
      }

      if (!form.phone.trim()) {
        setError('Please enter your phone number.')
        return false
      }

      if (!form.password) {
        setError('Please create a password.')
        return false
      }

      if (form.password.length < 6) {
        setError(
          'Password must be at least 6 characters.'
        )
        return false
      }
    }

    if (currentStep === 1) {
      if (!form.idProofType) {
        setError(
          'Please select an ID proof type.'
        )
        return false
      }

      if (!idProof) {
        setError(
          'Please upload your ID proof document.'
        )
        return false
      }
    }

    if (currentStep === 5) {
      if (!form.plan) {
        setError('Please select a plan.')
        return false
      }

      if (!form.seat) {
        setError('Please select a seat.')
        return false
      }
    }

    return true
  }

  const nextStep = () => {
    if (!validateStep()) {
      return
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  const previousStep = () => {
    setError('')

    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  const goToStep = (index) => {
    if (index >= currentStep) {
      return
    }

    setError('')
    setCurrentStep(index)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const submit = async (e) => {
    e.preventDefault()

    if (!validateStep()) {
      return
    }

    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const body = new FormData()

      Object.entries(form).forEach(
        ([key, value]) => {
          body.append(key, value)
        }
      )

      if (photo) {
        body.append('photo', photo)
      }

      body.append('idProof', idProof)

      const data = await api('/admissions', {
        method: 'POST',
        body
      })

      setSuccess(
        data.message ||
          'Admission request submitted successfully.'
      )

      setForm(emptyForm)
      setPhoto(null)
      setIdProof(null)
      setSeats([])
      setCurrentStep(0)

      const photoInput =
        document.getElementById(
          'admission-photo'
        )

      const idProofInput =
        document.getElementById(
          'admission-id-proof'
        )

      if (photoInput) {
        photoInput.value = ''
      }

      if (idProofInput) {
        idProofInput.value = ''
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const step = STEPS[currentStep]

  return (
    <div className="admission-page">
      <header className="admission-header">
        <div className="admission-header-inner">
          <Link
            to="/"
            className="admission-brand"
          >
            <span className="admission-brand-mark">
              S
            </span>

            <span>
              Study<span>Library</span>
            </span>
          </Link>

          <Link
            to="/"
            className="admission-back"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="admission-main">
        <div className="admission-container">
          <div className="admission-intro">
            <span>STUDY LIBRARY</span>

            <h1>
              Admission
              <em> Request</em>
            </h1>

            <p>
              Complete the form step by step to
              request admission to the library.
            </p>
          </div>

          <div className="admission-layout">
            <aside className="admission-info">
              <div className="admission-info-card">
                <div className="admission-info-icon">
                  📝
                </div>

                <h2>
                  Start Your
                  <br />
                  Study Journey
                </h2>

                <p>
                  Complete each section one by one.
                  Your admission request will be
                  reviewed by the library administration.
                </p>

                <div className="admission-step-list">
                  {STEPS.map((item, index) => (
                    <button
                      key={item.number}
                      type="button"
                      className={
                        index === currentStep
                          ? 'active'
                          : index < currentStep
                            ? 'completed'
                            : ''
                      }
                      onClick={() =>
                        goToStep(index)
                      }
                      disabled={
                        index >= currentStep
                      }
                    >
                      <span>
                        {index < currentStep
                          ? '✓'
                          : item.number}
                      </span>

                      <p>{item.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section className="admission-form-card">
              <div className="admission-form-top">
                <div>
                  <div className="admission-current-step">
                    STEP {step.number} OF 06
                  </div>

                  <h2>{step.title}</h2>

                  <p>{step.text}</p>
                </div>

                <span>Required fields *</span>
              </div>

              <div className="admission-progress">
                {STEPS.map((item, index) => (
                  <div
                    key={item.number}
                    className={
                      index <= currentStep
                        ? 'active'
                        : ''
                    }
                  />
                ))}
              </div>

              {error && (
                <div className="admission-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="admission-success">
                  <strong>
                    Admission request submitted
                  </strong>

                  <p>{success}</p>

                  <Link to="/">
                    Return to Home
                  </Link>
                </div>
              )}

              {!success && (
                <form
                  className="admission-form"
                  onSubmit={submit}
                  encType="multipart/form-data"
                >
                  {currentStep === 0 && (
                    <>
                      <div className="admission-grid">
                        <Field
                          label="Full name *"
                          value={form.name}
                          onChange={set('name')}
                          placeholder="Enter your full name"
                          required
                        />

                        <Field
                          label="Email *"
                          type="email"
                          value={form.email}
                          onChange={set('email')}
                          placeholder="Enter your email"
                          required
                        />

                        <Field
                          label="Phone number *"
                          type="tel"
                          value={form.phone}
                          onChange={set('phone')}
                          placeholder="Enter phone number"
                          required
                        />

                        <Field
                          label="Date of birth"
                          type="date"
                          value={form.dob}
                          onChange={set('dob')}
                        />

                        <SelectField
                          label="Gender"
                          value={form.gender}
                          onChange={set('gender')}
                          options={[
                            ['Male', 'Male'],
                            ['Female', 'Female'],
                            ['Other', 'Other'],
                            [
                              'Prefer not to say',
                              'Prefer not to say'
                            ]
                          ]}
                        />

                        <Field
                          label="Create password *"
                          type="password"
                          value={form.password}
                          onChange={set('password')}
                          placeholder="Minimum 6 characters"
                          minLength="6"
                          required
                        />

                        <FileField
                          id="admission-photo"
                          label="Profile photo"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handlePhoto}
                          file={photo}
                          hint="Optional — JPG, PNG or WebP"
                          full
                        />
                      </div>
                    </>
                  )}

                  {currentStep === 1 && (
                    <div className="admission-grid">
                      <SelectField
                        label="ID proof type *"
                        value={form.idProofType}
                        onChange={set('idProofType')}
                        required
                        options={[
                          [
                            'Aadhaar',
                            'Aadhaar Card'
                          ],
                          ['PAN', 'PAN Card'],
                          [
                            'Driving Licence',
                            'Driving Licence'
                          ],
                          [
                            'Voter ID',
                            'Voter ID'
                          ],
                          ['Other', 'Other']
                        ]}
                      />

                      <Field
                        label="ID proof number"
                        value={form.idProofNumber}
                        onChange={set(
                          'idProofNumber'
                        )}
                        placeholder="Enter ID number"
                      />

                      <FileField
                        id="admission-id-proof"
                        label="ID proof document *"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleIdProof}
                        file={idProof}
                        hint="Required — JPG, PNG, WebP or PDF, max 5 MB"
                        full
                      />
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="admission-grid">
                      <TextAreaField
                        label="Address"
                        value={form.address}
                        onChange={set('address')}
                        placeholder="Enter your complete address"
                        full
                      />

                      <Field
                        label="City"
                        value={form.city}
                        onChange={set('city')}
                        placeholder="Enter city"
                      />

                      <Field
                        label="State"
                        value={form.state}
                        onChange={set('state')}
                        placeholder="Enter state"
                      />

                      <Field
                        label="PIN code"
                        value={form.pincode}
                        onChange={set('pincode')}
                        placeholder="Enter PIN code"
                      />
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="admission-grid">
                      <Field
                        label="Contact name"
                        value={form.emergencyName}
                        onChange={set(
                          'emergencyName'
                        )}
                        placeholder="Emergency contact name"
                      />

                      <Field
                        label="Relationship"
                        value={form.emergencyRelation}
                        onChange={set(
                          'emergencyRelation'
                        )}
                        placeholder="Father, Mother, Brother..."
                      />

                      <Field
                        label="Contact phone"
                        type="tel"
                        value={form.emergencyPhone}
                        onChange={set(
                          'emergencyPhone'
                        )}
                        placeholder="Emergency contact number"
                      />
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="admission-grid">
                      <SelectField
                        label="Student type"
                        value={form.studentType}
                        onChange={set(
                          'studentType'
                        )}
                        options={[
                          [
                            'Student',
                            'Student'
                          ],
                          [
                            'Working Professional',
                            'Working Professional'
                          ],
                          ['Other', 'Other']
                        ]}
                      />

                      <Field
                        label="College / School / Company"
                        value={form.institution}
                        onChange={set(
                          'institution'
                        )}
                        placeholder="Enter institution or company"
                      />

                      <Field
                        label="Course / Class"
                        value={form.course}
                        onChange={set('course')}
                        placeholder="Enter course or class"
                      />

                      <Field
                        label="Year / Semester"
                        value={form.year}
                        onChange={set('year')}
                        placeholder="Example: 2nd Year"
                      />
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="admission-grid">
                      <SelectField
                        label="Select Plan *"
                        value={form.plan}
                        onChange={set('plan')}
                        disabled={loadingPlans}
                        required
                        options={plans.map(
                          (plan) => [
                            plan._id,
                            `${plan.name} — ₹${plan.price}`
                          ]
                        )}
                      />

                      <SelectField
                        label="Select Seat *"
                        value={form.seat}
                        onChange={set('seat')}
                        disabled={
                          loadingSeats ||
                          !form.plan ||
                          seats.length === 0
                        }
                        required
                        placeholder={
                          loadingSeats
                            ? 'Loading seats...'
                            : seats.length === 0
                              ? 'No seats available'
                              : 'Select a seat'
                        }
                        options={seats.map(
                          (seat) => [
                            seat._id,
                            `Seat ${seat.number} — ${seat.section} — ${seat.type}`
                          ]
                        )}
                      />

                      <TextAreaField
                        label="Message"
                        value={form.message}
                        onChange={set('message')}
                        placeholder="Message or any additional information (optional)"
                        full
                      />

                      <div className="admission-notice admission-field-full">
                        <span>ⓘ</span>

                        <p>
                          Your admission request will be
                          reviewed by the library administration.
                          Membership becomes active only after
                          approval.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="admission-navigation">
                    {currentStep > 0 ? (
                      <button
                        type="button"
                        className="admission-back-button"
                        onClick={previousStep}
                        disabled={submitting}
                      >
                        ← Back
                      </button>
                    ) : (
                      <span />
                    )}

                    {currentStep <
                    STEPS.length - 1 ? (
                      <button
                        type="button"
                        className="admission-next-button"
                        onClick={nextStep}
                      >
                        Next
                        <span>→</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="admission-submit"
                        disabled={
                          submitting ||
                          loadingPlans ||
                          loadingSeats ||
                          plans.length === 0 ||
                          seats.length === 0
                        }
                      >
                        {submitting
                          ? 'Submitting...'
                          : 'Submit Admission Request'}

                        <span>→</span>
                      </button>
                    )}
                  </div>
                </form>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  minLength
}) {
  return (
    <label className="admission-field">
      <span>{label}</span>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
      />
    </label>
  )
}

function FileField({
  id,
  label,
  accept,
  onChange,
  file,
  hint,
  full = false
}) {
  return (
    <label
      className={`admission-field admission-file-field ${
        full ? 'admission-field-full' : ''
      }`}
      htmlFor={id}
    >
      <span>{label}</span>

      <div className="admission-file-box">
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={onChange}
        />

        <div className="admission-file-content">
          <strong>
            {file
              ? file.name
              : 'Choose document'}
          </strong>

          <small>{hint}</small>
        </div>

        <span className="admission-file-button">
          Browse
        </span>
      </div>
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  placeholder = 'Select an option'
}) {
  return (
    <label className="admission-field">
      <span>{label}</span>

      <select
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
      >
        <option value="">
          {placeholder}
        </option>

        {options.map(([value, label]) => (
          <option
            key={value}
            value={value}
          >
            {label}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  full = false
}) {
  return (
    <label
      className={`admission-field ${
        full ? 'admission-field-full' : ''
      }`}
    >
      <span>{label}</span>

      <textarea
        rows="4"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </label>
  )
}