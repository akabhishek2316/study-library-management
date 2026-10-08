import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import Icon from '../components/Icon'

const FEATURES = [
  [
    'grid',
    'Your seat and plan',
    'See your seat, shift and when your plan ends',
  ],
  [
    'check',
    'QR attendance',
    'Check in and out by scanning a code at the library',
  ],
  [
    'rupee',
    'Payments',
    'Pay fees online and download your receipts',
  ],
  [
    'megaphone',
    'Notices',
    'Get library updates and reminders',
  ],
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (user) {
  if (user.role === 'student') {
    return (
      <Navigate
        to="/student"
        replace
      />
    )
  }

  return (
    <Navigate
      to="/"
      replace
    />
  )
}

  const submit = async (e) => {
  e.preventDefault()
  setBusy(true)
  setError('')

  try {
    const loggedInUser = await login(
      email,
      password
    )

    if (loggedInUser.role === 'student') {
      navigate('/student')
    } else {
      navigate('/')
    }
  } catch (err) {
    setError(err.message)
  } finally {
    setBusy(false)
  }
}

  return (
    <div className="auth">
      {/* laptop / desktop: big panel on the left */}
      <aside className="auth-brand">
        <div className="brand">
          <span className="logo">
            <Icon name="book" size={22} />
          </span>

          <div>
            <h2>Study Library</h2>
            <small>Reading room management</small>
          </div>
        </div>

        <div>
          <h1>
            Your study space,
            <br />
            well organised.
          </h1>

          <p>
            One app for your seat, attendance and fees.
          </p>

          <ul className="auth-features">
            {FEATURES.map(([icon, title, text]) => (
              <li key={title}>
                <span className="ico">
                  <Icon name={icon} size={18} />
                </span>

                <div>
                  <b>{title}</b>
                  <small>{text}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <small>Secure sign in</small>
      </aside>

      <main className="auth-main">
        {/* phone: short introduction on top so it is clear what this app is */}
        <section className="auth-hero">
          <div className="brand">
            <span className="logo">
              <Icon name="book" size={22} />
            </span>

            <div>
              <h2>Study Library</h2>
              <small>Reading room management</small>
            </div>
          </div>

          <h1>
            Your reading room,
            <br />
            well organised.
          </h1>

          <p>
            Seat, attendance and fees, all in one app.
          </p>

          <div className="chips">
            <span>
              <Icon name="grid" size={15} />
              Your seat
            </span>

            <span>
              <Icon name="check" size={15} />
              QR attendance
            </span>

            <span>
              <Icon name="rupee" size={15} />
              Payments
            </span>

            <span>
              <Icon name="megaphone" size={15} />
              Notices
            </span>
          </div>
        </section>

        <form
          className="auth-card"
          onSubmit={submit}
        >
          <h1>Welcome back</h1>

          <p className="muted">
            Sign in to continue
          </p>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          <label>
            Email

            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </label>

          <button disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>

          <small className="auth-note">
            New student? Your account is created by the library desk.
          </small>
        </form>
      </main>
    </div>
  )
}