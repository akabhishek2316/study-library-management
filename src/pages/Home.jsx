import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { api } from '../api'
import { useAuth } from '../AuthContext'

import './Home.css'

const periodLabel = (period) => {
  if (period === 'monthly') return 'Monthly'
  if (period === 'quarterly') return 'Quarterly'
  if (period === 'half-yearly') return 'Half Yearly'

  return 'Custom'
}

const HERO_SLIDES = [
  {
    image:
      'https://sujalfrand66-arch.github.io/shanti-library/images/hero.png',

    eyebrow: 'A PEACEFUL PLACE TO STUDY',
    title: 'FOCUS.',
    highlight: 'WITHOUT DISTRACTION.',
    text:
      'Study comfortably in a peaceful environment where every student has their own dedicated space.',
  },

  {
    image:
      'https://sujalfrand66-arch.github.io/shanti-library/images/gallery-4.png',

    eyebrow: 'YOUR OWN STUDY SPACE',
    title: 'YOUR TABLE.',
    highlight: 'YOUR FOCUS.',
    text:
      'Enjoy a comfortable and peaceful study environment designed for long hours of focused learning.',
  },

  {
    image:
      'https://images.pexels.com/photos/33745700/pexels-photo-33745700.jpeg?auto=compress&cs=tinysrgb&w=2400',

    eyebrow: 'BUILT FOR SERIOUS STUDY',
    title: 'STUDY MORE.',
    highlight: 'DISTRACT LESS.',
    text:
      'A modern reading environment where students can concentrate on their studies without distractions.',
  },

  {
    image:
      'https://images.pexels.com/photos/4903651/pexels-photo-4903651.jpeg?auto=compress&cs=tinysrgb&w=2400',

    eyebrow: 'COMFORT • FOCUS • PRODUCTIVITY',
    title: 'A BETTER PLACE',
    highlight: 'TO STUDY.',
    text:
      'Clean, comfortable and peaceful study spaces created to help you make the most of every hour.',
  },
]
export default function Home() {
  const { user, loading } = useAuth()

  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [error, setError] = useState('')

  const [activeSlide, setActiveSlide] = useState(0)

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) =>
        current === HERO_SLIDES.length - 1
          ? 0
          : current + 1
      )
    }, 4500)

    return () => {
      clearInterval(timer)
    }
  }, [])

  const loadPlans = async () => {
    try {
      setLoadingPlans(true)
      setError('')

      const data = await api('/plans/public')

      setPlans(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingPlans(false)
    }
  }

  const previousSlide = () => {
    setActiveSlide((current) =>
      current === 0
        ? HERO_SLIDES.length - 1
        : current - 1
    )
  }

  const nextSlide = () => {
    setActiveSlide((current) =>
      current === HERO_SLIDES.length - 1
        ? 0
        : current + 1
    )
  }

  if (loading) {
    return (
      <div className="home-loading">
        Loading...
      </div>
    )
  }

  if (
    user?.role === 'owner' ||
    user?.role === 'staff'
  ) {
    return <Navigate to="/admin" replace />
  }

  if (
    user?.role === 'student' &&
    user.admissionStatus === 'approved'
  ) {
    return <Navigate to="/student" replace />
  }

  const slide = HERO_SLIDES[activeSlide]

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-inner">
          <Link to="/" className="home-brand">
            <span className="home-brand-mark">
              S
            </span>

            <span>
              Study<span>Library</span>
            </span>
          </Link>

          <nav className="home-nav">
            <a href="#features">Features</a>

            <a href="#plans">Plans</a>

            <a href="#how-it-works">
              How It Works
            </a>

            {user?.admissionStatus === 'pending' && (
              <span className="home-pending">
                Admission Pending
              </span>
            )}

            {user ? (
              <>
                <span className="home-user">
                  {user.name}
                </span>

                <button
                  type="button"
                  className="home-login-link"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="home-login-link"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* HERO SLIDER */}
        <section className="home-hero-slider">
          <div className="home-slider-track">
            {HERO_SLIDES.map((item, index) => (
              <div
                key={item.image}
                className={`home-slide ${
                  index === activeSlide
                    ? 'active'
                    : ''
                }`}
                style={{
                  backgroundImage: `url("${item.image}")`,
                }}
              >
                <div className="home-slide-overlay" />

                <div className="home-container home-slide-content">
                  <div className="home-slide-copy">
                    <span className="home-slide-eyebrow">
                      <span className="home-live-dot" />
                      {item.eyebrow}
                    </span>

                    <h1>
                      {item.title}
                      <br />
                      <span>{item.highlight}</span>
                    </h1>

                    <p>
                      {item.text}
                    </p>

                    <div className="home-hero-actions">
                      <Link
                        to="/admission"
                        className="home-primary-btn"
                      >
                        Apply for Admission
                        <span>→</span>
                      </Link>

                      {user ? (
                        <button
                          type="button"
                          className="home-secondary-btn"
                          onClick={handleLogout}
                        >
                          Logout
                        </button>
                      ) : (
                        <Link
                          to="/login"
                          className="home-secondary-btn"
                        >
                          Login
                        </Link>
                      )}
                    </div>

                    <div className="home-checks">
                      <span>
                        ✓ Peaceful Environment
                      </span>

                      <span>
                        ✓ Dedicated Seating
                      </span>

                      <span>
                        ✓ Flexible Plans
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="home-slider-arrow home-slider-prev"
            onClick={previousSlide}
            aria-label="Previous slide"
          >
            ‹
          </button>

          <button
            type="button"
            className="home-slider-arrow home-slider-next"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            ›
          </button>

          <div className="home-slider-dots">
            {HERO_SLIDES.map((_, index) => (
              <button
                key={index}
                type="button"
                className={
                  index === activeSlide
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setActiveSlide(index)
                }
                aria-label={`Go to slide ${
                  index + 1
                }`}
              />
            ))}
          </div>

          <div className="home-slider-counter">
            <span>
              {String(activeSlide + 1).padStart(
                2,
                '0'
              )}
            </span>
            <i />
            <span>
              {String(HERO_SLIDES.length).padStart(
                2,
                '0'
              )}
            </span>
          </div>
        </section>

        {/* QUICK STATS */}
        <section className="home-stats">
          <div className="home-container home-stats-inner">
            <div>
              <strong>06</strong>
              <span>Core Services</span>
            </div>

            <div>
              <strong>01</strong>
              <span>Study Platform</span>
            </div>

            <div>
              <strong>∞</strong>
              <span>Ways to Focus</span>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section
          id="features"
          className="home-features-section"
        >
          <div className="home-container">
            <div className="home-section-heading">
              <span>
                LIBRARY ESSENTIALS
              </span>

              <h2>
                Everything Study,
                <em> Connected.</em>
              </h2>

              <p>
                One platform designed to make
                your daily study experience
                simpler, more organized and more
                productive.
              </p>
            </div>

            <div className="home-feature-grid">
              <FeatureCard
  icon="❄️"
  label="COMFORT • FOCUS"
  title="Fully Air-Conditioned Hall"
  text="Study comfortably for long hours in a clean, peaceful and fully air-conditioned reading hall."
/>

<FeatureCard
  icon="🪑"
  label="YOUR • SPACE"
  title="Dedicated Seating"
  text="Enjoy your own dedicated study seat with a comfortable environment designed for focused learning."
/>

<FeatureCard
  icon="📱"
  label="SMART • STUDY"
  title="Student Mobile App"
  text="Manage your library activities, check updates and maintain your daily study streak directly from your phone."
/>

<FeatureCard
  icon="⚡"
  label="ONLINE • ANYTIME"
  title="Everything Online"
  text="Manage membership, attendance, seat requests and other services online without needing to visit the owner."
/>

<FeatureCard
  icon="📶"
  label="CONNECTED • PRODUCTIVE"
  title="Wi-Fi & Charging"
  text="Stay connected with high-speed Wi-Fi and convenient charging points for your study devices."
/>

<FeatureCard
  icon="🛡️"
  label="SAFE • CLEAN • RELIABLE"
  title="Safe & Comfortable"
  text="Study in a clean and hygienic environment with CCTV security, proper lighting, drinking water and power backup."
/>
            </div>
          </div>
        </section>

        {/* PLANS */}
        <section
          id="plans"
          className="home-plans-section"
        >
          <div className="home-container">
            <div className="home-section-heading">
              <span>SIMPLE PRICING</span>

              <h2>
                Choose Your
                <em> Study Plan.</em>
              </h2>

              <p>
                Select the plan and shift that
                works best for your study routine.
              </p>
            </div>

            {loadingPlans ? (
              <div className="home-loading-card">
                Loading plans...
              </div>
            ) : plans.length === 0 ? (
              <div className="home-loading-card">
                No active plans are available
                right now.
              </div>
            ) : (
              <div className="home-plan-grid">
                {plans.map((plan) => (
                  <div
                    className="home-plan-card"
                    key={plan._id}
                  >
                    <div className="home-plan-icon">
                      ◈
                    </div>

                    <h3>{plan.name}</h3>

                    <div className="home-plan-price">
                      ₹{plan.price}
                    </div>

                    <span className="home-plan-duration">
                      {plan.durationDays} days
                    </span>

                    <div className="home-plan-details">
                      <span>
                        {periodLabel(
                          plan.period
                        )}
                      </span>

                      {plan.shift?.name && (
                        <span>
                          {plan.shift.name}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/admission?plan=${plan._id}`}
                      className="home-plan-btn"
                    >
                      Select Plan
                      <span>→</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {error && (
          <div className="home-container">
            <div className="home-form-error">
              {error}
            </div>
          </div>
        )}

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="home-how-section"
        >
          <div className="home-container">
            <div className="home-section-heading">
              <span>GET STARTED</span>

              <h2>
                From Admission
                <em> to Study.</em>
              </h2>
            </div>

            <div className="home-steps">
              <Step
                number="01"
                title="Submit Request"
                text="Fill out the admission form and select your preferred plan."
              />

              <Step
                number="02"
                title="Admin Review"
                text="Our library team reviews your admission request."
              />

              <Step
                number="03"
                title="Get Approved"
                text="Once approved, your student account becomes active."
              />

              <Step
                number="04"
                title="Start Studying"
                text="Login, manage your membership and start your study routine."
              />
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="home-final-cta">
          <div className="home-container">
            <div className="home-final-cta-inner">
              <div>
                <span>READY TO BEGIN?</span>

                <h2>
                  Make your study time
                  <em> more productive.</em>
                </h2>
              </div>

              <Link
                to="/admission"
                className="home-primary-btn"
              >
                Apply for Admission
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="home-footer">
          <div className="home-container">
            <div className="home-footer-brand">
              <Link
                to="/"
                className="home-brand"
              >
                <span className="home-brand-mark">
                  S
                </span>

                <span>
                  Study<span>Library</span>
                </span>
              </Link>

              <p>
                A smarter, simpler place for
                focused study.
              </p>
            </div>

            <div className="home-footer-links">
              <a href="#features">
                Features
              </a>

              <a href="#plans">
                Plans
              </a>

              <a href="#how-it-works">
                How It Works
              </a>

              <Link to="/admission">
                Admission
              </Link>

              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              ) : (
                <Link to="/login">
                  Login
                </Link>
              )}
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

function FeatureCard({
  icon,
  label,
  title,
  text,
}) {
  return (
    <article className="home-feature-card">
      <div className="home-feature-top">
        <div className="home-feature-icon">
          {icon}
        </div>

        <span>↗</span>
      </div>

      <small>{label}</small>

      <h3>{title}</h3>

      <p>{text}</p>

      <Link to="/admission">
        Explore
        <span>→</span>
      </Link>
    </article>
  )
}

function Step({
  number,
  title,
  text,
}) {
  return (
    <article className="home-step">
      <span className="home-step-number">
        {number}
      </span>

      <h3>{title}</h3>

      <p>{text}</p>
    </article>
  )
}