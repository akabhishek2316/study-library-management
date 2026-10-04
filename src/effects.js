// Click feedback for the whole app. No page has to change;
// it works on every button.
//
// 1. a ripple where you press a button
// 2. a spinner on the button while the request it started is running
// 3. a request counter that drives the thin loading bar at the top
//    (see Layout.jsx)

let lastClick = {
  el: null,
  at: 0,
}

let pending = 0

const announce = () =>
  window.dispatchEvent(
    new CustomEvent('net', {
      detail: pending,
    })
  )

if (typeof document !== 'undefined') {
  // ripple: only sets a data attribute + the press position,
  // so React's own DOM is never touched
  document.addEventListener(
    'pointerdown',
    (e) => {
      const b =
        e.target.closest?.(
          'button, .bottom a, .nav-item'
        )

      if (!b || b.disabled) {
        return
      }

      const r =
        b.getBoundingClientRect()

      b.style.setProperty(
        '--rx',
        `${e.clientX - r.left}px`
      )

      b.style.setProperty(
        '--ry',
        `${e.clientY - r.top}px`
      )

      b.removeAttribute('data-rip')

      void b.offsetWidth
      // restart the animation if you tap again quickly

      b.setAttribute('data-rip', '')

      clearTimeout(b._rip)

      b._rip = setTimeout(
        () =>
          b.removeAttribute(
            'data-rip'
          ),
        700
      )
    },
    {
      passive: true,
    }
  )

  // remember which button was clicked
  // (capture phase = before the page's own click handler runs)
  document.addEventListener(
    'click',
    (e) => {
      const b =
        e.target.closest?.('button')

      lastClick =
        b && !b.disabled
          ? {
              el: b,
              at: Date.now(),
            }
          : {
              el: null,
              at: 0,
            }
    },
    true
  )
}

/**
 * Call when a request starts.
 * Returns a function to call when it ends.
 */
export function beginRequest() {
  pending++

  announce()

  // a request that starts right after a click belongs
  // to that button, so the button shows a spinner
  const btn =
    lastClick.el &&
    Date.now() - lastClick.at < 400
      ? lastClick.el
      : null

  if (btn) {
    btn.dataset.busy = String(
      Number(btn.dataset.busy || 0) + 1
    )
  }

  return () => {
    pending = Math.max(
      0,
      pending - 1
    )

    announce()

    if (btn) {
      const n =
        Number(
          btn.dataset.busy || 1
        ) - 1

      if (n <= 0) {
        delete btn.dataset.busy
      } else {
        btn.dataset.busy =
          String(n)
      }
    }
  }
}

/**
 * Small message at the top of the screen
 * ("Saved", "Deleted", errors...).
 */
export const toast = (
  type,
  text
) =>
  window.dispatchEvent(
    new CustomEvent('toast', {
      detail: {
        type,
        text,
      },
    })
  )