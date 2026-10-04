import { useRef } from 'react'

// Seats without a saved position are laid out in a neat grid
export const autoPos = (i, n) => {
  const cols = Math.min(
    6,
    Math.max(1, n)
  )

  const rows = Math.ceil(n / cols)

  return {
    x:
      cols === 1
        ? 50
        : 10 +
          (i % cols) *
            (80 / (cols - 1)),

    y:
      rows === 1
        ? 50
        : 10 +
          Math.floor(i / cols) *
            (80 / (rows - 1)),
  }
}

// Seats drawn on a plan of the hall.
// In edit mode they can be dragged (mouse or finger).
export default function FloorPlan({
  seats,
  pickedId,
  onPick,
  editable,
  onMove,
}) {
  const box = useRef(null)
  const dragging = useRef(null)

  const n = seats.length

  const height = Math.max(
    340,
    Math.ceil(n / 6) * 76 + 40
  )

  const posOf = (s, i) =>
    s.position?.x != null
      ? s.position
      : autoPos(i, n)

  const down = (e, s) => {
    if (!editable) return

    dragging.current = s._id

    e.currentTarget.setPointerCapture(
      e.pointerId
    )
  }

  const move = (e) => {
    if (!dragging.current) return

    const r =
      box.current.getBoundingClientRect()

    const x = Math.min(
      95,
      Math.max(
        5,
        ((e.clientX - r.left) /
          r.width) *
          100
      )
    )

    const y = Math.min(
      93,
      Math.max(
        7,
        ((e.clientY - r.top) /
          r.height) *
          100
      )
    )

    onMove(
      dragging.current,
      Math.round(x * 10) / 10,
      Math.round(y * 10) / 10
    )
  }

  return (
    <div
      ref={box}
      className={`plan ${
        editable ? 'editing' : ''
      }`}
      style={{ height }}
      onPointerMove={move}
      onPointerUp={() =>
        (dragging.current = null)
      }
    >
      {seats.map((s, i) => {
        const p = posOf(s, i)

        return (
          <button
            key={s._id}
            type="button"
            className={`pseat ${
              s.state
            } ${
              pickedId === s._id
                ? 'picked'
                : ''
            }`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
            onPointerDown={(e) =>
              down(e, s)
            }
            onClick={() =>
              !editable && onPick(s)
            }
            title={
              s.state === 'occupied'
                ? `${s.number}: ${s.occupant.name}`
                : `${s.number} (${s.state})`
            }
          >
            <b>{s.number}</b>

            <small>
              {s.state === 'occupied'
                ? s.occupant.name.split(
                    ' '
                  )[0]
                : s.type !== 'Non-AC'
                  ? s.type
                  : ''}
            </small>
          </button>
        )
      })}
    </div>
  )
}