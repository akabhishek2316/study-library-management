import { Component } from 'react'

// Without this, one bug in any page shows a blank white screen.
// Now the user gets a message and a way back.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    console.error('Screen crashed:', error, info)
  }

  render() {
    if (!this.state.failed) {
      return this.props.children
    }

    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h2>Something went wrong</h2>

          <p style={{ color: '#64748b' }}>
            This screen could not be shown. Your data is safe.
            Please reload the page; if it keeps happening,
            tell the library desk.
          </p>

          <button
            onClick={() => window.location.reload()}
          >
            Reload
          </button>{' '}

          <button
            className="ghost"
            onClick={() => {
              window.location.href = '/'
            }}
          >
            Go to home
          </button>
        </div>
      </div>
    )
  }
}
