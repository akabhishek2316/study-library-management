// =====================================================================
// Floor plan presets
//
// Everything here is calculated in "width units": 1 unit = 1% of the
// board's WIDTH, on both axes. A seat is drawn at most ~8.5 units wide
// (see .pseat in styles.css: clamp(30px, 8cqw, 60px)), so two seats whose
// centres are STEP (11.5) units apart can never touch, on any screen.
//
// The board's height is NOT fixed: each preset returns the `ratio`
// (height / width) it needs, and the board is drawn with that ratio.
// Positions are returned as percentages (x of width, y of height).
// =====================================================================

export const STEP = 11.5 // minimum centre-to-centre distance
const MARGIN = 7 // keeps seats (and their shadow) inside the board
const USABLE = 100 - MARGIN * 2
const MIN_RATIO = 0.72
const MAX_RATIO = 12
const GAP = 7 // extra space for an aisle between desk pairs
const GROUP_GAP = STEP + 4 // centre-to-centre gap between two pods / tables

const round1 = (n) => Math.round(n * 10) / 10

const MAX_COLS = Math.floor(USABLE / STEP) + 1 // 8

// ---------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------

// seats are given as unit coordinates (ux, uy from the top-left corner).
// Convert to the board's percentage system and work out the height needed.
function finish(points, seats, extra = {}) {
  const maxY = points.reduce((m, p) => Math.max(m, p.uy), 0)
  const minRatio = extra.minRatio || MIN_RATIO
  const margin = extra.margin || MARGIN

  const heightUnits = Math.max(
    100 * minRatio,
    maxY + margin,
    extra.minHeightUnits || 0
  )

  const ratio = Math.min(MAX_RATIO, Math.max(minRatio, heightUnits / 100))

  const positions = {}

  points.forEach((p, i) => {
    positions[seats[i]._id] = {
      x: round1(p.ux),
      y: round1((p.uy / (100 * ratio)) * 100),
    }
  })

  return {
    positions,
    ratio: round1(ratio * 1000) / 1000,
    objects: extra.objects || [],

    // dense layouts draw smaller seats (percent of board width); null = normal size
    seatPct: extra.seatPct ?? null,
  }
}

// centre a list of rows (each row = list of x offsets) horizontally
function centeredRowX(count, step) {
  const width = (count - 1) * step
  const start = 50 - width / 2
  return Array.from({ length: count }, (_, i) => start + i * step)
}

// ---------------------------------------------------------------------
// 1. GRID: even rows and columns
// ---------------------------------------------------------------------

function grid(seats, { columns } = {}) {
  const total = seats.length

  let cols =
    columns ||
    Math.min(MAX_COLS, Math.max(1, Math.ceil(Math.sqrt(total * 1.5))))

  cols = Math.min(MAX_COLS, Math.max(1, cols))

  const stepX = cols === 1 ? 0 : Math.max(STEP, USABLE / (cols - 1))
  const stepY = STEP + 1.5

  const points = seats.map((_, i) => {
    const row = Math.floor(i / cols)
    const inRow = Math.min(cols, total - row * cols)
    const xs = centeredRowX(inRow, stepX)

    return { ux: xs[i % cols], uy: MARGIN + row * stepY }
  })

  return finish(points, seats)
}

// ---------------------------------------------------------------------
// 2. DESK ROWS: pairs of seats side by side, aisle between the pairs
// ---------------------------------------------------------------------

function deskRows(seats, { blockSize = 2 } = {}) {
  const total = seats.length
  const b = Math.max(1, blockSize)

  // widest row that still fits the board
  let cols = MAX_COLS

  const widthOf = (c) => (c - 1) * STEP + (Math.ceil(c / b) - 1) * GAP

  while (cols > 1 && widthOf(cols) > USABLE) cols -= 1

  // do not use a wider row than needed
  cols = Math.min(cols, Math.max(b, Math.ceil(total / Math.ceil(total / cols))))

  const stepY = STEP + 2.5

  const points = seats.map((_, i) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    const inRow = Math.min(cols, total - row * cols)
    const rowWidth = widthOf(inRow)
    const start = 50 - rowWidth / 2

    return {
      ux: start + col * STEP + Math.floor(col / b) * GAP,
      uy: MARGIN + row * stepY,
    }
  })

  return finish(points, seats)
}

// ---------------------------------------------------------------------
// 3. STUDY PODS: groups of 2 / 4 / 6 / 8 / 10 / 12 seats
// ---------------------------------------------------------------------

const POD_SHAPES = {
  2: { cols: 2, rows: 1 },
  4: { cols: 2, rows: 2 },
  6: { cols: 3, rows: 2 },
  8: { cols: 4, rows: 2 },
  10: { cols: 5, rows: 2 },
  12: { cols: 6, rows: 2 },
}

function pods(seats, { groupSize = 4 } = {}) {
  const size = POD_SHAPES[groupSize] ? groupSize : 4
  const { cols, rows } = POD_SHAPES[size]

  const podW = (cols - 1) * STEP
  const podH = (rows - 1) * STEP

  const perRow = Math.max(
    1,
    Math.floor((USABLE + GROUP_GAP) / (podW + GROUP_GAP))
  )
  const podCount = Math.ceil(seats.length / size)

  const points = seats.map((_, i) => {
    const pod = Math.floor(i / size)
    const inPod = i % size
    const podRow = Math.floor(pod / perRow)
    const podCol = pod % perRow

    // pods on one row are centred as a block
    const podsHere = Math.min(perRow, podCount - podRow * perRow)
    const blockW = podsHere * podW + (podsHere - 1) * GROUP_GAP
    const left = 50 - blockW / 2

    return {
      ux: left + podCol * (podW + GROUP_GAP) + (inPod % cols) * STEP,
      uy:
        MARGIN +
        podRow * (podH + GROUP_GAP) +
        Math.floor(inPod / cols) * STEP,
    }
  })

  return finish(points, seats)
}

// ---------------------------------------------------------------------
// 4. ALONG THE WALLS: one or more rings of seats, empty middle
// ---------------------------------------------------------------------

function wall(seats) {
  const total = seats.length

  for (let H = 100 * MIN_RATIO; H <= 100 * MAX_RATIO; H += STEP) {
    const points = []
    let ring = 0

    while (points.length < total) {
      const inset = MARGIN + ring * (STEP + 1)
      const left = inset
      const right = 100 - inset
      const top = inset
      const bottom = H - inset

      if (right - left < 0 || bottom - top < 0) break

      const w = right - left
      const h = bottom - top

      // seats fit on the 4 sides: corners are shared
      const perTop = Math.floor(w / STEP) + 1
      const perSide = Math.max(0, Math.floor(h / STEP) - 1)

      const slots = []

      for (let i = 0; i < perTop; i++) {
        const x = perTop === 1 ? 50 : left + (w / (perTop - 1)) * i
        slots.push({ ux: x, uy: top })
      }

      for (let i = 1; i <= perSide; i++) {
        const y = top + (h / (perSide + 1)) * i
        slots.push({ ux: right, uy: y })
      }

      if (h > 0) {
        for (let i = perTop - 1; i >= 0; i--) {
          const x = perTop === 1 ? 50 : left + (w / (perTop - 1)) * i
          slots.push({ ux: x, uy: bottom })
        }
      }

      for (let i = perSide; i >= 1; i--) {
        const y = top + (h / (perSide + 1)) * i
        slots.push({ ux: left, uy: y })
      }

      points.push(...slots)
      ring += 1

      if (ring > 12) break
    }

    if (points.length >= total) {
      return finish(points.slice(0, total), seats, { minHeightUnits: H })
    }
  }

  // a very long list: fall back to a grid
  return grid(seats)
}

// ---------------------------------------------------------------------
// 5. ROUND TABLES: seats around a circular table (the table is drawn)
// ---------------------------------------------------------------------

function roundTables(seats, { groupSize = 4 } = {}) {
  const per = Math.max(2, groupSize)
  // neighbours on a circle can sit diagonally, so keep them 13.6 apart
  // (>= 9.6 on one axis even at 45 degrees): safe for the biggest seat (9.4%)
  const radius = Math.max(9.6, 13.6 / (2 * Math.sin(Math.PI / per)))
  const tableDiameter = Math.max(8, radius * 2 - 14)

  const diameter = radius * 2
  const tablesPerRow = Math.max(
    1,
    Math.floor((USABLE + GROUP_GAP) / (diameter + GROUP_GAP))
  )

  const tableCount = Math.ceil(seats.length / per)
  const rowHeight = diameter + GROUP_GAP

  const points = []
  const objects = []

  for (let t = 0; t < tableCount; t++) {
    const row = Math.floor(t / tablesPerRow)
    const col = t % tablesPerRow
    const here = Math.min(tablesPerRow, tableCount - row * tablesPerRow)
    const blockW = here * diameter + (here - 1) * GROUP_GAP
    const cx = 50 - blockW / 2 + radius + col * (diameter + GROUP_GAP)
    const cy = MARGIN + radius + row * rowHeight

    const inThisTable = Math.min(per, seats.length - t * per)

    for (let k = 0; k < inThisTable; k++) {
      const angle = (-Math.PI / 2) + (2 * Math.PI * k) / per

      points.push({
        ux: cx + radius * Math.cos(angle),
        uy: cy + radius * Math.sin(angle),
      })
    }

    objects.push({ cx, cy, d: tableDiameter })
  }

  const maxY = points.reduce((m, p) => Math.max(m, p.uy), 0)
  const heightUnits = Math.max(100 * MIN_RATIO, maxY + MARGIN)
  const ratio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, heightUnits / 100))

  // table circles, in the same percentage system as the seats
  const tables = objects.map((o, i) => ({
    id: `auto-table-${i}`,
    auto: true,
    type: 'circle',
    x: round1(o.cx - o.d / 2),
    y: round1(((o.cy - o.d / 2) / (100 * ratio)) * 100),
    width: round1(o.d),
    height: round1((o.d / (100 * ratio)) * 100),
    background: '#e2e8f0',
    backgroundOpacity: 0.8,
    borderColor: '#94a3b8',
    borderWidth: 2,
    rotation: 0,
  }))

  return finish(points, seats, { objects: tables, minHeightUnits: heightUnits })
}

// ---------------------------------------------------------------------
// 6. ROW BLOCKS (compact): tight rows of N seats, blocks side by side
//    e.g. 6 seats per row, 2 rows together, 2-3 blocks across the floor.
//    Seats are drawn smaller (5.2% of the board width) so more fit across;
//    on a phone the board scrolls sideways instead of squeezing the seats.
// ---------------------------------------------------------------------

export const DENSE_SEAT = 5.2 // seat width, % of board width
const D_STEP = DENSE_SEAT + 1.7 // centre to centre inside a row (tiny gap)
const D_MARGIN = 5
const D_USABLE = 100 - D_MARGIN * 2

function rowBlocks(seats, { perRow = 6, rowsPerBlock = 2 } = {}) {
  const total = seats.length

  const maxPerRow = Math.floor(D_USABLE / D_STEP) + 1
  const n = Math.max(2, Math.min(maxPerRow, perRow))
  const rows = Math.max(1, Math.min(4, rowsPerBlock))

  const rowW = (n - 1) * D_STEP
  const colGap = D_STEP * 2 // empty space between two blocks side by side
  const maxCols = Math.max(1, Math.floor((D_USABLE + colGap) / (rowW + colGap)))

  const blockSeats = n * rows
  const blocks = Math.ceil(total / blockSeats)
  const cols = Math.min(maxCols, blocks)
  const perCol = Math.ceil(blocks / cols) // blocks stacked in one column

  const blockH = (rows - 1) * D_STEP
  const aisle = D_STEP + 4 // vertical space between two blocks

  const usedCols = Math.ceil(blocks / perCol)
  const totalW = usedCols * rowW + (usedCols - 1) * colGap
  const left = 50 - totalW / 2

  const points = seats.map((_, i) => {
    const block = Math.floor(i / blockSeats)
    const inBlock = i % blockSeats
    const col = Math.floor(block / perCol)
    const slot = block % perCol

    return {
      ux: left + col * (rowW + colGap) + (inBlock % n) * D_STEP,
      uy:
        D_MARGIN +
        slot * (blockH + aisle) +
        Math.floor(inBlock / n) * D_STEP,
    }
  })

  return finish(points, seats, {
    seatPct: DENSE_SEAT,
    minRatio: 0.35,
    margin: D_MARGIN,
  })
}

// ---------------------------------------------------------------------
// public API
// ---------------------------------------------------------------------

export const PRESETS = [
  {
    id: 'grid',
    name: 'Grid',
    hint: 'Even rows and columns',
  },
  {
    id: 'desks',
    name: 'Desk rows',
    hint: 'Pairs of seats with an aisle between them',
  },
  {
    id: 'pods',
    name: 'Study pods',
    hint: 'Small blocks of 2 to 12 seats',
    needsGroup: true,
  },
  {
    id: 'tables',
    name: 'Round tables',
    hint: 'Seats around a round table',
    needsGroup: true,
  },
  {
    id: 'wall',
    name: 'Along the walls',
    hint: 'Seats on the edges, open middle',
  },
  {
    id: 'rows',
    name: 'Row blocks (compact)',
    hint: 'Tight rows, 2-3 blocks side by side',
    needsRow: true,
  },
]

export function buildLayout(presetId, seats, options = {}) {
  if (!seats.length) {
    return { positions: {}, ratio: MIN_RATIO, objects: [] }
  }

  switch (presetId) {
    case 'desks':
      return deskRows(seats, options)
    case 'pods':
      return pods(seats, options)
    case 'tables':
      return roundTables(seats, options)
    case 'wall':
      return wall(seats)
    case 'rows':
      return rowBlocks(seats, options)
    case 'grid':
    default:
      return grid(seats, options)
  }
}

// Default position/height for seats that were never placed
export function defaultRatio(total) {
  return buildLayout(
    'grid',
    Array.from({ length: Math.max(1, total) }, (_, i) => ({ _id: i }))
  ).ratio
}

export function autoPos(index, total) {
  if (!total) return { x: 50, y: 50 }

  const fake = Array.from({ length: total }, (_, i) => ({ _id: i }))

  return buildLayout('grid', fake).positions[index] || { x: 50, y: 50 }
}
