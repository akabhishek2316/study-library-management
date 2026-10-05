import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { api } from './api'
import { useAuth } from './AuthContext'
import Icon from './components/Icon'
import Toasts from './components/Toasts'

const isIOS =
  /iphone|ipad|ipod/i.test(
    navigator.userAgent
  )

const isInstalled = () =>
  window.matchMedia(
    '(display-mode: standalone)'
  ).matches ||
  window.navigator.standalone

// [path, label, icon, color, exact?]
// (the color tints the icon in the menu)
const ADMIN = [
  [
    '/admin',
    'Dashboard',
    'home',
    '#60a5fa',
    true,
  ],
  [
    '/admin/students',
    'Students',
    'users',
    '#a78bfa',
  ],
  [
  '/admin/admissions',
  'Admission Requests',
  'admission',
  '#f59e0b',
],
  [
    '/admin/seats',
    'Seats',
    'grid',
    '#2dd4bf',
  ],
  [
    '/admin/memberships',
    'Memberships',
    'card',
    '#818cf8',
  ],
  [
  '/admin/seat-change-requests',
  'Seat Change Requests',
  'swap',
  '#22d3ee',
],
  [
    '/admin/payments',
    'Payments',
    'rupee',
    '#4ade80',
  ],
  [
    '/admin/attendance',
    'Attendance',
    'check',
    '#fb923c',
  ],
  [
    '/admin/notices',
    'Notices',
    'megaphone',
    '#f472b6',
  ],
  [
    '/admin/feedback',
    'Feedback',
    'message',
    '#fbbf24',
  ],
]

const OWNER = [
  [
    '/admin/setup',
    'Shifts & Plans',
    'clock',
    '#38bdf8',
  ],
  [
    '/admin/analytics',
    'Analytics',
    'chart',
    '#c084fc',
  ],
  [
    '/admin/reports',
    'Reports',
    'file',
    '#fb7185',
  ],
  [
    '/admin/settings',
    'Settings',
    'sliders',
    '#94a3b8',
  ],
]

const STUDENT = [
  [
    '/student',
    'Home',
    'home',
    '#60a5fa',
    true,
  ],
  [
    '/student/attendance',
    'Attendance',
    'check',
    '#fb923c',
  ],
  [
    '/student/notices',
    'Notices',
    'megaphone',
    '#f472b6',
  ],
  [
    '/student/feedback',
    'Feedback',
    'message',
    '#fbbf24',
  ],
]

// Phones show tables as cards.
// This copies each column heading onto its cells (data-label)
// so the CSS can print it.
function labelTables(root) {
  root
    .querySelectorAll('table')
    .forEach((t) => {
      const heads = [
        ...t.querySelectorAll(
          'thead th'
        ),
      ].map((h) =>
        h.textContent.trim()
      )

      t
        .querySelectorAll('tbody tr')
        .forEach((tr) =>
          [...tr.children].forEach(
            (td, i) => {
              if (td.colSpan > 1) {
                return
              }

              const label =
                heads[i] ?? ''

              if (
                td.getAttribute(
                  'data-label'
                ) !== label
              ) {
                td.setAttribute(
                  'data-label',
                  label
                )
              }
            }
          )
        )
    })
}

export default function Layout({ admin }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()

  const [unread, setUnread] =
    useState(0)

  const [installEvt, setInstallEvt] =
    useState(null)

  const [hintOff, setHintOff] =
    useState(
      !!localStorage.getItem(
        'iosHintOff'
      )
    )

  const [drawer, setDrawer] =
    useState(false)

  const [menu, setMenu] =
    useState(false)

  const [busy, setBusy] =
    useState(false)

  const contentRef =
    useRef(null)

  const links = admin
    ? [
        ...ADMIN,
        ...(user.role === 'owner'
          ? OWNER
          : []),
      ]
    : STUDENT

  const base = admin
    ? '/admin'
    : '/student'

  const current = [...links]
    .sort(
      (a, b) =>
        b[0].length - a[0].length
    )
    .find(
      ([to]) =>
        loc.pathname === to ||
        loc.pathname.startsWith(
          to + '/'
        )
    )

  const title = loc.pathname.endsWith(
    '/notifications'
  )
    ? 'Notifications'
    : current?.[1] ||
      'Study Library'

  const today =
    new Date().toLocaleDateString(
      'en-IN',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      }
    )

  useEffect(() => {
    setDrawer(false)
    setMenu(false)
  }, [loc.pathname])

  useEffect(() => {
    document.body.classList.toggle(
      'no-scroll',
      drawer
    )

    return () =>
      document.body.classList.remove(
        'no-scroll'
      )
  }, [drawer])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDrawer(false)
        setMenu(false)
      }
    }

    window.addEventListener(
      'keydown',
      onKey
    )

    return () =>
      window.removeEventListener(
        'keydown',
        onKey
      )
  }, [])

  // thin loading bar at the top while the app is talking to the server
  useEffect(() => {
    const on = (e) =>
      setBusy(e.detail > 0)

    window.addEventListener(
      'net',
      on
    )

    return () =>
      window.removeEventListener(
        'net',
        on
      )
  }, [])

  useEffect(() => {
    const el = contentRef.current

    if (!el) {
      return
    }

    let raf

    const run = () => {
      cancelAnimationFrame(raf)

      raf = requestAnimationFrame(
        () => labelTables(el)
      )
    }

    run()

    const mo =
      new MutationObserver(run)

    mo.observe(el, {
      childList: true,
      subtree: true,
    })

    return () => {
      mo.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
  const load = () =>
    api(
      '/notifications/unread-count'
    )
      .then((d) =>
        setUnread(d.unread)
      )
      .catch(() => {})

  load()

  const onUpdated = () => {
    load()
  }

  window.addEventListener(
    'notifications-updated',
    onUpdated
  )

  const t = setInterval(
    load,
    60000
  )

  return () => {
    clearInterval(t)

    window.removeEventListener(
      'notifications-updated',
      onUpdated
    )
  }
}, [loc.pathname])

  useEffect(() => {
    const h = (e) => {
      e.preventDefault()
      setInstallEvt(e)
    }

    window.addEventListener(
      'beforeinstallprompt',
      h
    )

    return () =>
      window.removeEventListener(
        'beforeinstallprompt',
        h
      )
  }, [])

  const install = async () => {
    installEvt.prompt()

    await installEvt.userChoice

    setInstallEvt(null)
    setMenu(false)
  }

  const Item = ([
    to,
    label,
    icon,
    color,
    end,
  ]) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className="nav-item"
      style={{ '--c': color }}
    >
      <span className="ico">
        <Icon
          name={icon}
          size={18}
        />
      </span>

      <span>{label}</span>
    </NavLink>
  )

  return (
    <div
      className={`shell ${
        admin
          ? 'admin-shell'
          : 'student-shell'
      } ${
        drawer ? 'drawer-open' : ''
      }`}
    >
      <div
        className={`topload ${
          busy ? 'on' : ''
        }`}
        aria-hidden="true"
      />

      <Toasts />

      <aside
        className="sidebar"
        aria-label="Main navigation"
      >
        <div className="brand">
          <span className="logo">
            <Icon
              name="book"
              size={20}
            />
          </span>

          <div>
            <h2>Study Library</h2>

            <small>
              {admin
                ? 'Management'
                : 'Student'}
            </small>
          </div>

          <button
            className="icon-btn sidebar-close"
            onClick={() =>
              setDrawer(false)
            }
            aria-label="Close menu"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav>
          {admin ? (
            <>
              <p className="nav-label">
                Manage
              </p>

              {ADMIN.map(Item)}

              {user.role === 'owner' && (
                <>
                  <p className="nav-label">
                    Owner
                  </p>

                  {OWNER.map(Item)}
                </>
              )}
            </>
          ) : (
            STUDENT.map(Item)
          )}
        </nav>
      </aside>

      <div
        className="backdrop"
        onClick={() =>
          setDrawer(false)
        }
      />

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            {admin && (
              <button
                className="icon-btn menu-btn"
                onClick={() =>
                  setDrawer(true)
                }
                aria-label="Open menu"
              >
                <Icon name="menu" />
              </button>
            )}

            {!admin && (
              <span className="logo sm">
                <Icon
                  name="book"
                  size={18}
                />
              </span>
            )}

            <b className="topbar-title">
              {title}
            </b>

            <div className="greet">
              <b>
                Hello,{' '}
                {user.name.split(
                  ' '
                )[0]}{' '}
                👋
              </b>

              <small>{today}</small>
            </div>
          </div>

          <div className="topbar-right">
            <Link
              className="icon-btn bell"
              to={`${base}/notifications`}
              aria-label="Notifications"
            >
              <span className="bell-ico">
                🔔
              </span>

              {unread > 0 && (
                <b>
                  {unread > 99
                    ? '99+'
                    : unread}
                </b>
              )}
            </Link>

            <div className="profile">
              <button
                className="avatar"
                onClick={() =>
                  setMenu(!menu)
                }
                aria-label="Account menu"
                aria-expanded={menu}
              >
                {user.name
                  .charAt(0)
                  .toUpperCase()}
              </button>

              {menu && (
                <>
                  <div
                    className="menu-scrim"
                    onClick={() =>
                      setMenu(false)
                    }
                  />

                  <div
                    className="menu"
                    role="menu"
                  >
                    <div className="menu-head">
                      <b>{user.name}</b>

                      <small>
                        {user.email}
                      </small>

                      <span className="badge gray">
                        {user.role}
                      </span>
                    </div>

                    {installEvt &&
                      !isInstalled() && (
                        <button
                          className="menu-item"
                          onClick={install}
                        >
                          <Icon
                            name="download"
                            size={18}
                          />

                          Install app
                        </button>
                      )}

                    <button
                      className="menu-item"
                      onClick={() => {
                        logout()
                        navigate('/login')
                      }}
                    >
                      <Icon
                        name="logout"
                        size={18}
                      />

                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main
          className="content"
          ref={contentRef}
        >
          {!admin &&
            isIOS &&
            !isInstalled() &&
            !hintOff && (
              <div className="alert ok">
                <span>
                  Install this app: tap{' '}
                  <b>Share</b> then{' '}
                  <b>
                    Add to Home Screen
                  </b>
                  .
                </span>

                <button
                  className="ghost"
                  onClick={() => {
                    localStorage.setItem(
                      'iosHintOff',
                      '1'
                    )

                    setHintOff(true)
                  }}
                >
                  Got it
                </button>
              </div>
            )}

          <div
            className="page"
            key={loc.pathname}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {!admin && (
        <nav
          className="bottom"
          aria-label="Main navigation"
        >
          {STUDENT.map(
            ([
              to,
              label,
              icon,
              ,
              end,
            ]) => (
              <NavLink
                key={to}
                to={to}
                end={end}
              >
                <Icon
                  name={icon}
                  size={22}
                />

                <span>{label}</span>
              </NavLink>
            )
          )}
        </nav>
      )}
    </div>
  )
}