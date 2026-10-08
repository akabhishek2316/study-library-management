
import { useNavigate } from 'react-router-dom'

export default function About() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: '0 auto',
      }}
    >
      <div className="card">
        {/* Back Button */}
        <button
          type="button"
          className="ghost"
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 24,
          }}
        >
          ← Back
        </button>

        {/* Hero */}
        <div
          style={{
            textAlign: 'center',
            padding: '20px 20px 36px',
            borderBottom:
              '1px solid var(--border, #ddd)',
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              margin: '0 auto 18px',
              borderRadius: 17,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'var(--primary, #2563eb)',
              color: '#fff',
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            S
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 32,
            }}
          >
            StudyLibrary
          </h1>

          <p
            className="muted"
            style={{
              maxWidth: 650,
              margin: '12px auto 0',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            A smarter and simpler way to manage
            modern library operations.
          </p>
        </div>

        {/* About */}
        <section
          style={{
            padding: '30px 0',
            borderBottom:
              '1px solid var(--border, #ddd)',
          }}
        >
          <h2>About StudyLibrary</h2>

          <p
            style={{
              lineHeight: 1.8,
            }}
          >
            StudyLibrary is a modern library
            management platform built to simplify
            everyday library operations and provide
            students with a smooth digital experience.
          </p>

          <p
            style={{
              lineHeight: 1.8,
              marginBottom: 0,
            }}
          >
            From student admissions and attendance to
            seat management and payments, StudyLibrary
            brings essential library operations together
            in one organized platform.
          </p>
        </section>

        {/* Features */}
        <section
          style={{
            padding: '30px 0',
            borderBottom:
              '1px solid var(--border, #ddd)',
          }}
        >
          <h2>What StudyLibrary Offers</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
              marginTop: 18,
            }}
          >
            <Feature
              title="Student Management"
              text="Manage student profiles, admissions, and account information efficiently."
            />

            <Feature
              title="Attendance"
              text="Track student attendance with a simple and reliable attendance system."
            />

            <Feature
              title="Seat Management"
              text="Manage library seats and floor plans with an organized interface."
            />

            <Feature
              title="Payments"
              text="Keep payment information organized and easily accessible."
            />

            <Feature
              title="Secure Accounts"
              text="Provide users with secure authentication and account management."
            />

            <Feature
              title="Admin Dashboard"
              text="Give library staff a centralized place to manage daily operations."
            />
          </div>
        </section>

        {/* Goal */}
        <section
          style={{
            padding: '30px 0',
            borderBottom:
              '1px solid var(--border, #ddd)',
          }}
        >
          <h2>Our Goal</h2>

          <p
            style={{
              lineHeight: 1.8,
              marginBottom: 0,
            }}
          >
            Our goal is to make library management
            simpler for staff and more convenient for
            students through a clean, reliable, and
            user-friendly digital platform.
          </p>
        </section>

        {/* Developer */}
        <section
          style={{
            padding: '30px 0',
            borderBottom:
              '1px solid var(--border, #ddd)',
          }}
        >
          <h2>Developer</h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              marginTop: 18,
              padding: 20,
              borderRadius: 14,
              border:
                '1px solid var(--border, #ddd)',
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                flexShrink: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'var(--primary, #2563eb)',
                color: '#fff',
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              AK
            </div>

            <div>
              <h3
                style={{
                  margin: 0,
                }}
              >
                Abhishek Kumar
              </h3>

              <p
                className="muted"
                style={{
                  margin: '4px 0',
                }}
              >
                Web Developer
              </p>

              <a
                href="mailto:webdeveloperabhi88@gmail.com"
                style={{
                  fontSize: 14,
                }}
              >
                webdeveloperabhi88@gmail.com
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            paddingTop: 26,
          }}
        >
          <p
            className="muted"
            style={{
              margin: 0,
            }}
          >
            Built with care for a better library
            experience.
          </p>

          <p
            className="muted"
            style={{
              margin: '8px 0 0',
              fontSize: 13,
            }}
          >
            © {new Date().getFullYear()} StudyLibrary
          </p>
        </div>
      </div>
    </div>
  )
}

function Feature({
  title,
  text,
}) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 12,
        border:
          '1px solid var(--border, #ddd)',
      }}
    >
      <h3
        style={{
          margin: '0 0 8px',
          fontSize: 16,
        }}
      >
        {title}
      </h3>

      <p
        className="muted"
        style={{
          margin: 0,
          lineHeight: 1.6,
          fontSize: 14,
        }}
      >
        {text}
      </p>
    </div>
  )
}

