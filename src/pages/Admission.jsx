import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { api } from '../api'
import PasswordInput from '../components/PasswordInput'


const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',

  gender: '',
  studentType: '',

  dob: '',

  idProofType: '',
  idProofNumber: '',

  address: '',
  city: '',
  state: '',
  pincode: '',

  emergencyName: '',
  emergencyRelation: '',
  emergencyPhone: '',

  institution: '',
  course: '',
  year: '',

  plan: '',
  preferredHall: '',
  message: ''
}

const STEPS = [
  {
    number: '01',
    title: 'Basic Details',
    text: 'Create your library account with your basic information.'
  },
  {
    number: '02',
    title: 'Membership',
    text: 'Choose your preferred plan and hall / room.'
  },
  {
    number: '03',
    title: 'Verification',
    text: 'Upload your ID proof for admission verification.'
  },
  {
    number: '04',
    title: 'Additional Details',
    text: 'Add any additional information if you want.'
  }
]

export default function Admission() {
  const [searchParams] = useSearchParams()

  const [plans, setPlans] = useState([])
  const [halls, setHalls] = useState([])

  const [form, setForm] = useState(emptyForm)

  const [photo, setPhoto] = useState(null)
  const [idProof, setIdProof] = useState(null)

  const [currentStep, setCurrentStep] = useState(0)

  const [loadingPlans, setLoadingPlans] =
    useState(true)

  const [loadingHalls, setLoadingHalls] =
    useState(false)

  const [submitting, setSubmitting] =
    useState(false)

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

      const queryPlan =
        searchParams.get('plan')

      const selectedPlan =
        data.find(
          (plan) =>
            plan._id === queryPlan
        )?._id ||
        data[0]?._id ||
        ''

      setForm((prev) => ({
        ...prev,
        plan: selectedPlan
      }))

      if (selectedPlan) {
        await loadHalls(selectedPlan)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingPlans(false)
    }
  }

  const loadHalls = async (planId) => {
    if (!planId) {
      setHalls([])
      return
    }

    try {
      setLoadingHalls(true)
      setError('')
      setHalls([])

      const data = await api(
        `/admissions/available-halls?plan=${planId}`
      )

      setHalls(data)

      setForm((prev) => ({
        ...prev,
        preferredHall:
          data[0]?._id || ''
      }))
    } catch (err) {
      setHalls([])

      setForm((prev) => ({
        ...prev,
        preferredHall: ''
      }))

      setError(err.message)
    } finally {
      setLoadingHalls(false)
    }
  }

  const set = (key) => async (e) => {
    const value = e.target.value

    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'plan'
        ? {
            preferredHall: ''
          }
        : {})
    }))

    if (key === 'plan') {
      await loadHalls(value)
    }
  }

  const handlePhoto = (e) => {
    setPhoto(
      e.target.files?.[0] || null
    )
  }

  const handleIdProof = (e) => {
    setIdProof(
      e.target.files?.[0] || null
    )
  }

  const validateStep = () => {
    setError('')

    if (currentStep === 0) {
      if (!form.name.trim()) {
        setError(
          'Please enter your full name.'
        )
        return false
      }

      if (!form.phone.trim()) {
        setError(
          'Please enter your phone number.'
        )
        return false
      }

      if (!form.email.trim()) {
        setError(
          'Please enter your email.'
        )
        return false
      }

      if (!form.password) {
        setError(
          'Please create a password.'
        )
        return false
      }

      if (form.password.length < 8) {
        setError(
          'Password must be at least 8 characters.'
        )
        return false
      }

      if (!form.gender) {
        setError(
          'Please select your gender.'
        )
        return false
      }

      if (!form.studentType) {
        setError(
          'Please select your student type.'
        )
        return false
      }

      return true
    }

    if (currentStep === 1) {
      if (!form.plan) {
        setError(
          'Please select a plan.'
        )
        return false
      }

      if (!form.preferredHall) {
        setError(
          'Please select your preferred hall or room.'
        )
        return false
      }

      return true
    }

    if (currentStep === 2) {
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

      return true
    }

    return true
  }

  const validateBeforeSubmit = () => {
    setError('')

    if (!form.name.trim()) {
      setError(
        'Please enter your full name.'
      )
      setCurrentStep(0)
      return false
    }

    if (!form.phone.trim()) {
      setError(
        'Please enter your phone number.'
      )
      setCurrentStep(0)
      return false
    }

    if (!form.email.trim()) {
      setError(
        'Please enter your email.'
      )
      setCurrentStep(0)
      return false
    }

    if (!form.password) {
      setError(
        'Please create a password.'
      )
      setCurrentStep(0)
      return false
    }

    if (form.password.length < 8) {
      setError(
        'Password must be at least 8 characters.'
      )
      setCurrentStep(0)
      return false
    }

    if (!form.gender) {
      setError(
        'Please select your gender.'
      )
      setCurrentStep(0)
      return false
    }

    if (!form.studentType) {
      setError(
        'Please select your student type.'
      )
      setCurrentStep(0)
      return false
    }

    if (!form.plan) {
      setError(
        'Please select a plan.'
      )
      setCurrentStep(1)
      return false
    }

    if (!form.preferredHall) {
      setError(
        'Please select your preferred hall or room.'
      )
      setCurrentStep(1)
      return false
    }

    if (!form.idProofType) {
      setError(
        'Please select an ID proof type.'
      )
      setCurrentStep(2)
      return false
    }

    if (!idProof) {
      setError(
        'Please upload your ID proof document.'
      )
      setCurrentStep(2)
      return false
    }

    return true
  }

  const nextStep = () => {
    if (!validateStep()) {
      return
    }

    if (
      currentStep <
      STEPS.length - 1
    ) {
      setCurrentStep(
        (prev) => prev + 1
      )

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  const previousStep = () => {
    setError('')

    if (currentStep > 0) {
      setCurrentStep(
        (prev) => prev - 1
      )

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

    /*
     * Final validation happens only after
     * the user clicks Submit.
     *
     * Additional Details are completely
     * optional and are not validated.
     */
    if (!validateBeforeSubmit()) {
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
        body.append(
          'photo',
          photo
        )
      }

      body.append(
        'idProof',
        idProof
      )

      const data = await api(
        '/admissions',
        {
          method: 'POST',
          body
        }
      )

      setSuccess(
        data.message ||
          'Admission request submitted successfully.'
      )

      setForm(emptyForm)
      setPhoto(null)
      setIdProof(null)
      setHalls([])
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

  const step =
    STEPS[currentStep]

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
            <span>
              STUDY LIBRARY
            </span>

            <h1>
              Admission
              <em> Request</em>
            </h1>

            <p>
              Complete the short form
              step by step to request
              admission to the library.
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
                  Just a few simple steps.
                  Your admission request
                  will be reviewed by the
                  library administration.
                </p>

                <div className="admission-step-list">
                  {STEPS.map(
                    (item, index) => (
                      <button
                        key={
                          item.number
                        }
                        type="button"
                        className={
                          index ===
                          currentStep
                            ? 'active'
                            : index <
                                currentStep
                              ? 'completed'
                              : ''
                        }
                        onClick={() =>
                          goToStep(index)
                        }
                        disabled={
                          index >=
                          currentStep
                        }
                      >
                        <span>
                          {index <
                          currentStep
                            ? '✓'
                            : item.number}
                        </span>

                        <p>
                          {item.title}
                        </p>
                      </button>
                    )
                  )}
                </div>
              </div>
            </aside>

            <section className="admission-form-card">
              <div className="admission-form-top">
                <div>
                  <div className="admission-current-step">
                    STEP{' '}
                    {step.number}{' '}
                    OF 04
                  </div>

                  <h2>
                    {step.title}
                  </h2>

                  <p>
                    {step.text}
                  </p>
                </div>

                <span>
                  Required fields *
                </span>
              </div>

              <div className="admission-progress">
                {STEPS.map(
                  (item, index) => (
                    <div
                      key={
                        item.number
                      }
                      className={
                        index <=
                        currentStep
                          ? 'active'
                          : ''
                      }
                    />
                  )
                )}
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

                  <p>
                    {success}
                  </p>

                  <Link to="/">
                    Return to Home
                  </Link>
                </div>
              )}

              {!success && (
                <form
                  className="admission-form"
                  
                  encType="multipart/form-data"
                >
                  {currentStep === 0 && (
                    <div className="admission-grid">
                      <Field
                        label="Full name *"
                        value={
                          form.name
                        }
                        onChange={set(
                          'name'
                        )}
                        placeholder="Enter your full name"
                        required
                      />

                      <Field
                        label="Phone number *"
                        type="tel"
                        value={
                          form.phone
                        }
                        onChange={set(
                          'phone'
                        )}
                        placeholder="Enter phone number"
                        required
                      />

                      <Field
                        label="Email *"
                        type="email"
                        value={
                          form.email
                        }
                        onChange={set(
                          'email'
                        )}
                        placeholder="Enter your email"
                        required
                      />

                      <Field
                        label="Create password *"
                        type="password"
                        value={
                          form.password
                        }
                        onChange={set(
                          'password'
                        )}
                        placeholder="Minimum 8 characters"
                        minLength="8"
                        required
                      />

                      <SelectField
                        label="Gender *"
                        value={
                          form.gender
                        }
                        onChange={set(
                          'gender'
                        )}
                        required
                        options={[
                          [
                            'Male',
                            'Male'
                          ],
                          [
                            'Female',
                            'Female'
                          ],
                          [
                            'Other',
                            'Other'
                          ],
                          [
                            'Prefer not to say',
                            'Prefer not to say'
                          ]
                        ]}
                      />

                      <SelectField
                        label="Student type *"
                        value={
                          form.studentType
                        }
                        onChange={set(
                          'studentType'
                        )}
                        required
                        options={[
                          [
                            'Student',
                            'Student'
                          ],
                          [
                            'Working Professional',
                            'Working Professional'
                          ],
                          [
                            'Other',
                            'Other'
                          ]
                        ]}
                      />

                      <div className="admission-field-full">
                        <div className="admission-notice">
                          <span>ⓘ</span>

                          <p>
                            Your phone and
                            email will be
                            used for your
                            library account
                            and admission
                            updates.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="admission-grid">
                      <SelectField
                        label="Select Plan *"
                        value={
                          form.plan
                        }
                        onChange={set(
                          'plan'
                        )}
                        disabled={
                          loadingPlans
                        }
                        required
                        options={plans.map(
                          (plan) => [
                            plan._id,
                            `${plan.name} — ₹${plan.price}`
                          ]
                        )}
                      />

                      <SelectField
                        label="Preferred Hall / Room *"
                        value={
                          form.preferredHall
                        }
                        onChange={set(
                          'preferredHall'
                        )}
                        disabled={
                          loadingHalls ||
                          !form.plan ||
                          halls.length ===
                            0
                        }
                        required
                        placeholder={
                          loadingHalls
                            ? 'Loading halls...'
                            : halls.length ===
                                0
                              ? 'No halls available'
                              : 'Select a hall / room'
                        }
                        options={halls.map(
                          (hall) => [
                            hall._id,
                            `${hall.name} — ${hall.availableSeats} seats available`
                          ]
                        )}
                      />

                      <div className="admission-field-full">
                        <div className="admission-notice">
                          <span>ⓘ</span>

                          <p>
                            Your selected
                            hall is only a
                            preference.
                            The exact seat
                            will be
                            assigned by the
                            library
                            administration
                            after
                            approval.
                          </p>
                        </div>
                      </div>

                      <div className="admission-field-full">
                        <div className="admission-notice">
                          <span>ⓘ</span>

                          <p>
                            Membership becomes
                            active only after
                            your admission is
                            approved by the
                            library
                            administration.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="admission-grid">
                      <SelectField
                        label="ID proof type *"
                        value={
                          form.idProofType
                        }
                        onChange={set(
                          'idProofType'
                        )}
                        required
                        options={[
                          [
                            'Aadhaar',
                            'Aadhaar Card'
                          ],
                          [
                            'PAN',
                            'PAN Card'
                          ],
                          [
                            'Driving Licence',
                            'Driving Licence'
                          ],
                          [
                            'Voter ID',
                            'Voter ID'
                          ],
                          [
                            'Other',
                            'Other'
                          ]
                        ]}
                      />

                      <Field
                        label="ID proof number"
                        value={
                          form.idProofNumber
                        }
                        onChange={set(
                          'idProofNumber'
                        )}
                        placeholder="Enter ID number"
                      />

                      <FileField
                        id="admission-id-proof"
                        label="ID proof document *"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={
                          handleIdProof
                        }
                        file={
                          idProof
                        }
                        hint="Required — JPG, PNG, WebP or PDF, max 5 MB"
                        full
                      />

                      <FileField
                        id="admission-photo"
                        label="Profile photo"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={
                          handlePhoto
                        }
                        file={
                          photo
                        }
                        hint="Optional — JPG, PNG or WebP"
                        full
                      />
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="admission-grid">
                      <TextAreaField
                        label="Address"
                        value={
                          form.address
                        }
                        onChange={set(
                          'address'
                        )}
                        placeholder="Enter your complete address"
                        full
                      />

                      <Field
                        label="Date of birth"
                        type="date"
                        value={
                          form.dob
                        }
                        onChange={set(
                          'dob'
                        )}
                      />

                      <Field
                        label="City"
                        value={
                          form.city
                        }
                        onChange={set(
                          'city'
                        )}
                        placeholder="Enter city"
                      />

                      <Field
                        label="State"
                        value={
                          form.state
                        }
                        onChange={set(
                          'state'
                        )}
                        placeholder="Enter state"
                      />

                      <Field
                        label="PIN code"
                        value={
                          form.pincode
                        }
                        onChange={set(
                          'pincode'
                        )}
                        placeholder="Enter PIN code"
                      />

                      <Field
                        label="Emergency contact name"
                        value={
                          form.emergencyName
                        }
                        onChange={set(
                          'emergencyName'
                        )}
                        placeholder="Name"
                      />

                      <Field
                        label="Relationship"
                        value={
                          form.emergencyRelation
                        }
                        onChange={set(
                          'emergencyRelation'
                        )}
                        placeholder="Father, Mother, Brother..."
                      />

                      <Field
                        label="Emergency contact phone"
                        type="tel"
                        value={
                          form.emergencyPhone
                        }
                        onChange={set(
                          'emergencyPhone'
                        )}
                        placeholder="Phone number"
                      />

                      <Field
                        label="College / School / Company"
                        value={
                          form.institution
                        }
                        onChange={set(
                          'institution'
                        )}
                        placeholder="Institution or company"
                      />

                      <Field
                        label="Course / Class"
                        value={
                          form.course
                        }
                        onChange={set(
                          'course'
                        )}
                        placeholder="Course or class"
                      />

                      <Field
                        label="Year / Semester"
                        value={
                          form.year
                        }
                        onChange={set(
                          'year'
                        )}
                        placeholder="Example: 2nd Year"
                      />

                      <TextAreaField
                        label="Message"
                        value={
                          form.message
                        }
                        onChange={set(
                          'message'
                        )}
                        placeholder="Any additional information (optional)"
                        full
                      />

                      <div className="admission-notice admission-field-full">
                        <span>ⓘ</span>

                        <p>
                          All additional
                          details on this
                          step are
                          optional. You
                          can submit your
                          admission
                          request without
                          filling them.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="admission-navigation">
                    {currentStep > 0 ? (
                      <button
                        type="button"
                        className="admission-back-button"
                        onClick={
                          previousStep
                        }
                        disabled={
                          submitting
                        }
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
                        onClick={
                          nextStep
                        }
                        disabled={
                          submitting
                        }
                      >
                        Next
                        <span>
                          →
                        </span>
                      </button>
                    ) : (
                      <button
  type="button"
  className="admission-submit"
  onClick={submit}
  disabled={
    submitting ||
    loadingPlans ||
    loadingHalls ||
    plans.length === 0 ||
    halls.length === 0
  }
>
  {submitting
    ? 'Submitting...'
    : 'Submit Admission Request'}

  <span>
    →
  </span>
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

      {type === 'password' ? (
        <PasswordInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete="new-password"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
        />
      )}
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
        full
          ? 'admission-field-full'
          : ''
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

          <small>
            {hint}
          </small>
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

        {options.map(
          ([value, label]) => (
            <option
              key={value}
              value={value}
            >
              {label}
            </option>
          )
        )}
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
        full
          ? 'admission-field-full'
          : ''
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