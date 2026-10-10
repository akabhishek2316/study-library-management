import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  autoPos,
  defaultRatio,
} from './floorLayouts'


// ==================================================
// EDITOR SETTINGS
// ==================================================

const GRID_SIZE = 11
const ALIGN_THRESHOLD = 7

const MIN_X = 4
const MAX_X = 96

const MIN_Y = 4
const MAX_Y = 96

const MIN_OBJECT_WIDTH = 5
const MIN_OBJECT_HEIGHT = 4

// ==================================================
// SAFE POSITION
// ==================================================

const safePosition = (
  position
) => {
  const x = Number(
    position?.x
  )

  const y = Number(
    position?.y
  )

  return {
    x: Number.isFinite(x)
      ? clamp(x, MIN_X, MAX_X)
      : 50,

    y: Number.isFinite(y)
      ? clamp(y, MIN_Y, MAX_Y)
      : 50,
  }
}

// ==================================================
// AUTO POSITION
//
// Important:
// Seat position CENTER coordinates hain.
//
// Prefix hone par bhi seats ke beech
// minimum horizontal spacing maintain hoti hai.
// ==================================================

// autoPos() now lives in floorLayouts.js (same spacing rules as the presets)
export { autoPos }

// ==================================================
// SNAP
// ==================================================

const snapNumber = (
  value,
  grid
) => {
  if (
    !Number.isFinite(
      grid
    ) ||
    grid <= 0
  ) {
    return value
  }

  return (
    Math.round(
      value / grid
    ) * grid
  )
}

// ==================================================
// FIND CLOSEST
// ==================================================

const findClosest = (
  value,
  candidates,
  threshold
) => {
  let closest = null

  let distance =
    Infinity

  candidates.forEach(
    (candidate) => {
      const diff =
        Math.abs(
          value -
            candidate
        )

      if (
        diff <=
          threshold &&
        diff <
          distance
      ) {
        closest =
          candidate

        distance =
          diff
      }
    }
  )

  return closest
}

// ==================================================
// CLAMP
// ==================================================

function clamp(
  value,
  min,
  max
) {
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  )
}

// ==================================================
// OBJECT ID
// ==================================================

const makeObjectId =
  () =>
    `floor-object-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`

// ==================================================
// CREATE FLOOR OBJECT
// ==================================================

const createFloorObject = (
  type
) => {
  if (
    type === 'rect'
  ) {
    return {
      id:
        makeObjectId(),

      type:
        'rect',

      x: 35,

      y: 35,

      width: 20,

      height: 15,

      background:
        '#e2e8f0',

      backgroundOpacity:
        0.7,

      borderColor:
        '#64748b',

      borderWidth:
        2,

      rotation:
        0,
    }
  }

  if (
    type === 'circle'
  ) {
    return {
      id:
        makeObjectId(),

      type:
        'circle',

      x: 40,

      y: 35,

      width: 15,

      height: 15,

      background:
        '#e2e8f0',

      backgroundOpacity:
        0.7,

      borderColor:
        '#64748b',

      borderWidth:
        2,

      rotation:
        0,
    }
  }

  return {
    id:
      makeObjectId(),

    type:
      'text',

    x: 40,

    y: 45,

    width: 20,

    height: 8,

    text:
      'Text',

    background:
      'transparent',

    backgroundOpacity:
      0,

    borderColor:
      'transparent',

    borderWidth:
      0,

    color:
      '#0f172a',

    fontSize:
      18,

    fontWeight:
      600,

    textAlign:
      'center',

    rotation:
      0,
  }
}

// ==================================================
// FLOOR PLAN
// ==================================================

export default function FloorPlan({
  seats = [],
  pickedId,
  onPick,
  editable = false,
  onMove,
  positions = {},

  // floor decoration (rectangles, circles, text) lives in the database.
  // The parent owns it: it passes the saved list in and is told about edits.
  objects = null,
  onObjectsChange = null,
  resetKey = 0,

  // board height / width, so a preset can make the board as tall as it needs
  ratio = null,

  // moves several seats at once: [{ id, x, y }, ...]
  onMoveMany = null,

  // dense layouts: seat width as % of the board width (null = normal size)
  seatPct = null,
}) {
  const boardRef =
    useRef(null)

  // ==================================================
  // SEAT DRAG
  // ==================================================

  const dragging =
    useRef(null)

  // ==================================================
  // MULTI-SELECT (move a whole row / column together)
  //   mode "single": drag one seat (Shift+click adds seats)
  //   mode "row":    pressing a seat selects its whole row
  //   mode "column": pressing a seat selects its whole column
  // ==================================================

  const [
    selectMode,
    setSelectMode,
  ] = useState('single')

  const [
    selectedSeatIds,
    setSelectedSeatIds,
  ] = useState([])

  // ==================================================
  // OBJECT DRAG
  // ==================================================

  const objectDragging =
    useRef(null)

  // ==================================================
  // OBJECT RESIZE
  // ==================================================

  const objectResizing =
    useRef(null)

  // ==================================================
  // GUIDES
  // ==================================================

  const [
    guides,
    setGuides,
  ] = useState({
    vertical:
      null,

    horizontal:
      null,
  })

  // ==================================================
  // DRAG STATE
  // ==================================================

  const [
    isDragging,
    setIsDragging,
  ] = useState(false)

  const [
    objectAction,
    setObjectAction,
  ] = useState(false)

  // ==================================================
  // SELECTED OBJECT
  // ==================================================

  const [
    selectedObjectId,
    setSelectedObjectId,
  ] = useState(null)

  // ==================================================
  // FLOOR OBJECTS
  // ==================================================

  const [
    floorObjects,
    setFloorObjects,
  ] = useState(() =>
    Array.isArray(objects)
      ? objects
      : []
  )

  // ==================================================
  // TOTAL
  // ==================================================

  const total =
    seats.length

  // ==================================================
  // HALL ID
  // ==================================================

  const hallId =
    (() => {
      const first =
        seats?.[0]

      if (!first) {
        return 'unknown'
      }

      if (
        first.hall &&
        typeof first.hall ===
          'object'
      ) {
        return String(
          first.hall._id ||
            first.hall.id ||
            'unknown'
        )
      }

      return String(
        first.hall ||
          'unknown'
      )
    })()

  // ==================================================
  // BOARD SIZE
  // The saved ratio (or the one a preset asked for) wins; otherwise
  // use the same default the "Grid" preset would need.
  // ==================================================

  const boardHeightRatio =
    clamp(
      Number(ratio) > 0
        ? Number(ratio)
        : defaultRatio(total),

      0.3,

      12
    )

  const boardAspectRatio =
    1 /
    boardHeightRatio

  // ==================================================
  // FLOOR OBJECTS  (loaded from / reported to the parent, no localStorage)
  // ==================================================

  const fromParent =
    useRef(null)

  const currentObjects =
    useRef([])

  currentObjects.current =
    floorObjects

  useEffect(() => {
    const list =
      Array.isArray(objects)
        ? objects
        : []

    // the list came back from our own edit: nothing to reload
    if (
      list ===
      currentObjects.current
    ) {
      return
    }

    fromParent.current =
      list

    setFloorObjects(
      list
    )
  }, [
    hallId,
    resetKey,
    objects,
  ])

  useEffect(() => {
    setSelectedObjectId(
      null
    )

    setSelectedSeatIds(
      []
    )
  }, [
    hallId,
    resetKey,
    editable,
  ])

  useEffect(() => {
    if (
      !onObjectsChange ||
      floorObjects ===
        fromParent.current ||
      floorObjects ===
        objects
    ) {
      return
    }

    onObjectsChange(
      floorObjects
    )
  }, [
    floorObjects,
  ])

  // ==================================================
  // SEAT POSITION
  // ==================================================

  const getPosition = (
    seat,
    index
  ) => {
    const temporary =
      positions?.[
        seat._id
      ]

    if (
      temporary &&
      temporary.x != null &&
      temporary.y != null
    ) {
      return safePosition(
        temporary
      )
    }

    if (
      seat.position &&
      seat.position.x != null &&
      seat.position.y != null
    ) {
      return safePosition(
        seat.position
      )
    }

    return autoPos(
      index,
      total
    )
  }

  // ==================================================
  // BOARD PERCENT
  // ==================================================

  const getBoardPercent =
    (event) => {
      const board =
        boardRef.current

      if (!board) {
        return {
          x: 0,
          y: 0,
        }
      }

      const rect =
        board.getBoundingClientRect()

      if (
        rect.width <= 0 ||
        rect.height <= 0
      ) {
        return {
          x: 0,
          y: 0,
        }
      }

      return {
        x:
          (
            (
              event.clientX -
              rect.left
            ) /
            rect.width
          ) *
          100,

        y:
          (
            (
              event.clientY -
              rect.top
            ) /
            rect.height
          ) *
          100,
      }
    }

  // ==================================================
  // START SEAT DRAG
  // ==================================================

  const startDrag = (
    event,
    seat
  ) => {
    if (!editable) {
      return
    }

    if (
      event.button !== 0
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const element =
      event.currentTarget

    const seatRect =
      element.getBoundingClientRect()

    const board =
      boardRef.current

    if (!board) {
      return
    }

    const boardRect =
      board.getBoundingClientRect()

    // ---- Shift / Ctrl / Cmd + press: add or remove this seat from the selection
    if (
      event.shiftKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      setSelectedSeatIds(
        (current) =>
          current.includes(
            seat._id
          )
            ? current.filter(
                (id) =>
                  id !==
                  seat._id
              )
            : [
                ...current,
                seat._id,
              ]
      )

      return
    }

    // ---- which seats move together?
    const where = (item) => {
      const index =
        seats.findIndex(
          (s) =>
            s._id ===
            item._id
        )

      return getPosition(
        item,
        index
      )
    }

    let ids = selectedSeatIds

    if (
      selectMode === 'row' ||
      selectMode === 'column'
    ) {
      const here =
        where(seat)

      // two seats are on the same row/column when their centres are
      // less than half a seat apart
      const toleranceX =
        (seatRect.width /
          2 /
          boardRect.width) *
        100

      const toleranceY =
        (seatRect.height /
          2 /
          boardRect.height) *
        100

      ids = seats
        .filter((item) => {
          const p =
            where(item)

          return selectMode ===
            'row'
            ? Math.abs(
                p.y - here.y
              ) <= toleranceY
            : Math.abs(
                p.x - here.x
              ) <= toleranceX
        })
        .map(
          (item) => item._id
        )

      setSelectedSeatIds(
        ids
      )
    } else if (
      !ids.includes(
        seat._id
      )
    ) {
      // pressing a seat that is not selected: back to moving one seat
      ids = []

      setSelectedSeatIds(
        []
      )
    }

    const group =
      ids.length > 1 &&
      ids.includes(seat._id)
        ? ids
            .map((id) => {
              const item =
                seats.find(
                  (s) =>
                    s._id === id
                )

              return item
                ? {
                    id,
                    ...where(
                      item
                    ),
                  }
                : null
            })
            .filter(Boolean)
        : null

    const seatCenterX =
      seatRect.left +
      seatRect.width / 2

    const seatCenterY =
      seatRect.top +
      seatRect.height / 2

    dragging.current = {
      group,

      startClientX:
        event.clientX,

      startClientY:
        event.clientY,

      id:
        seat._id,

      pointerOffsetX:
        event.clientX -
        seatCenterX,

      pointerOffsetY:
        event.clientY -
        seatCenterY,

      boardWidth:
        boardRect.width,

      boardHeight:
        boardRect.height,
    }

    setIsDragging(
      true
    )

    onPick?.(
      seat
    )

    try {
      element.setPointerCapture(
        event.pointerId
      )
    } catch {
      // Ignore
    }
  }

  // ==================================================
  // GET DRAGGED SEAT SIZE
  // ==================================================

  const getDraggedSize =
    (id) => {
      const board =
        boardRef.current

      if (!board) {
        return null
      }

      const element =
        board.querySelector(
          `[data-seat-id="${id}"]`
        )

      if (!element) {
        return null
      }

      const rect =
        element.getBoundingClientRect()

      return {
        width:
          rect.width,

        height:
          rect.height,
      }
    }

  // ==================================================
  // OTHER SEAT RECTANGLES
  // ==================================================

  const getOtherSeatRects =
    (
      currentId,
      boardRect
    ) => {
      const result = []

      seats.forEach(
        (
          seat,
          index
        ) => {
          if (
            seat._id ===
            currentId
          ) {
            return
          }

          const position =
            getPosition(
              seat,
              index
            )

          const centerX =
            (
              position.x /
              100
            ) *
            boardRect.width

          const centerY =
            (
              position.y /
              100
            ) *
            boardRect.height

          const element =
            boardRef.current?.querySelector(
              `[data-seat-id="${seat._id}"]`
            )

          if (!element) {
            return
          }

          const rect =
            element.getBoundingClientRect()

          const width =
            rect.width

          const height =
            rect.height

          result.push({
            left:
              centerX -
              width / 2,

            right:
              centerX +
              width / 2,

            centerX,

            top:
              centerY -
              height / 2,

            bottom:
              centerY +
              height / 2,

            centerY,
          })
        }
      )

      return result
    }

  // ==================================================
  // SEAT MOVE
  // ==================================================

  const handleMove =
    (event) => {
      const drag =
        dragging.current

      if (!drag) {
        return
      }

      const board =
        boardRef.current

      if (!board) {
        return
      }

      const rect =
        board.getBoundingClientRect()

      if (
        rect.width <= 0 ||
        rect.height <= 0
      ) {
        return
      }

      const size =
        getDraggedSize(
          drag.id
        )

      if (!size) {
        return
      }

      // ------------------------------------------------
      // MOVE A WHOLE ROW / COLUMN / SELECTION TOGETHER
      // ------------------------------------------------

      if (drag.group) {
        const halfW =
          (size.width /
            2 /
            rect.width) *
          100

        const halfH =
          (size.height /
            2 /
            rect.height) *
          100

        const xs =
          drag.group.map(
            (g) => g.x
          )

        const ys =
          drag.group.map(
            (g) => g.y
          )

        // the group stops when its first seat touches a board edge
        const dx = clamp(
          ((event.clientX -
            drag.startClientX) /
            rect.width) *
            100,

          halfW -
            Math.min(...xs),

          100 -
            halfW -
            Math.max(...xs)
        )

        const dy = clamp(
          ((event.clientY -
            drag.startClientY) /
            rect.height) *
            100,

          halfH -
            Math.min(...ys),

          100 -
            halfH -
            Math.max(...ys)
        )

        const updates =
          drag.group.map(
            (g) => ({
              id: g.id,

              x:
                Math.round(
                  (g.x + dx) *
                    100
                ) / 100,

              y:
                Math.round(
                  (g.y + dy) *
                    100
                ) / 100,
            })
          )

        if (onMoveMany) {
          onMoveMany(
            updates
          )
        } else {
          updates.forEach(
            (u) =>
              onMove?.(
                u.id,
                u.x,
                u.y
              )
          )
        }

        return
      }

      let centerXpx =
        event.clientX -
        rect.left -
        drag.pointerOffsetX

      let centerYpx =
        event.clientY -
        rect.top -
        drag.pointerOffsetY

      const halfWidth =
        size.width / 2

      const halfHeight =
        size.height / 2

      centerXpx =
        clamp(
          centerXpx,
          halfWidth,
          rect.width -
            halfWidth
        )

      centerYpx =
        clamp(
          centerYpx,
          halfHeight,
          rect.height -
            halfHeight
        )

      let centerX =
        (
          centerXpx /
          rect.width
        ) *
        100

      let centerY =
        (
          centerYpx /
          rect.height
        ) *
        100

      // ----------------------------------------------
      // GRID
      // ----------------------------------------------

      // const gridPercentX =
      //   (
      //     GRID_SIZE /
      //     rect.width
      //   ) *
      //   100

      // const gridPercentY =
      //   (
      //     GRID_SIZE /
      //     rect.height
      //   ) *
      //   100

      // centerX =
      //   snapNumber(
      //     centerX,
      //     gridPercentX
      //   )

      // centerY =
      //   snapNumber(
      //     centerY,
      //     gridPercentY
      //   )

      // ----------------------------------------------
      // OTHER SEATS
      // ----------------------------------------------

      const others =
        getOtherSeatRects(
          drag.id,
          rect
        )

      const seatWidthPercent =
        (
          size.width /
          rect.width
        ) *
        100

      const seatHeightPercent =
        (
          size.height /
          rect.height
        ) *
        100

      const halfSeatWidthPercent =
        seatWidthPercent / 2

      const halfSeatHeightPercent =
        seatHeightPercent / 2

      const verticalCandidates =
        []

      const horizontalCandidates =
        []

      others.forEach(
        (item) => {
          verticalCandidates.push(
            (
              item.left /
              rect.width
            ) *
            100
          )

          verticalCandidates.push(
            (
              item.centerX /
              rect.width
            ) *
            100
          )

          verticalCandidates.push(
            (
              item.right /
              rect.width
            ) *
            100
          )

          horizontalCandidates.push(
            (
              item.top /
              rect.height
            ) *
            100
          )

          horizontalCandidates.push(
            (
              item.centerY /
              rect.height
            ) *
            100
          )

          horizontalCandidates.push(
            (
              item.bottom /
              rect.height
            ) *
            100
          )
        }
      )

      const thresholdX =
        (
          ALIGN_THRESHOLD /
          rect.width
        ) *
        100

      const thresholdY =
        (
          ALIGN_THRESHOLD /
          rect.height
        ) *
        100

      // ----------------------------------------------
      // VERTICAL ALIGNMENT
      // ----------------------------------------------

      const verticalMatches = [
        {
          value:
            centerX -
            halfSeatWidthPercent,

          offset:
            halfSeatWidthPercent,
        },

        {
          value:
            centerX,

          offset:
            0,
        },

        {
          value:
            centerX +
            halfSeatWidthPercent,

          offset:
            -halfSeatWidthPercent,
        },
      ]

      let bestVertical =
        null

      verticalMatches.forEach(
        (match) => {
          const found =
            findClosest(
              match.value,
              verticalCandidates,
              thresholdX
            )

          if (
            found == null
          ) {
            return
          }

          const distance =
            Math.abs(
              match.value -
                found
            )

          if (
            !bestVertical ||
            distance <
              bestVertical.distance
          ) {
            bestVertical = {
              target:
                found,

              offset:
                match.offset,

              distance,
            }
          }
        }
      )

      // ----------------------------------------------
      // HORIZONTAL ALIGNMENT
      // ----------------------------------------------

      const horizontalMatches = [
        {
          value:
            centerY -
            halfSeatHeightPercent,

          offset:
            halfSeatHeightPercent,
        },

        {
          value:
            centerY,

          offset:
            0,
        },

        {
          value:
            centerY +
            halfSeatHeightPercent,

          offset:
            -halfSeatHeightPercent,
        },
      ]

      let bestHorizontal =
        null

      horizontalMatches.forEach(
        (match) => {
          const found =
            findClosest(
              match.value,
              horizontalCandidates,
              thresholdY
            )

          if (
            found == null
          ) {
            return
          }

          const distance =
            Math.abs(
              match.value -
                found
            )

          if (
            !bestHorizontal ||
            distance <
              bestHorizontal.distance
          ) {
            bestHorizontal = {
              target:
                found,

              offset:
                match.offset,

              distance,
            }
          }
        }
      )

      // ----------------------------------------------
      // APPLY VERTICAL GUIDE
      // ----------------------------------------------

if (bestHorizontal) {
  setGuides((current) => ({
    ...current,
    horizontal:
      bestHorizontal.target,
  }))
} else {
  setGuides((current) => ({
    ...current,
    horizontal: null,
  }))
}
      // ----------------------------------------------
      // FINAL CLAMP
      // ----------------------------------------------

      const minXPercent =
        (
          halfWidth /
          rect.width
        ) *
        100

      const maxXPercent =
        100 -
        minXPercent

      const minYPercent =
        (
          halfHeight /
          rect.height
        ) *
        100

      const maxYPercent =
        100 -
        minYPercent

      centerX =
        clamp(
          centerX,
          minXPercent,
          maxXPercent
        )

      centerY =
        clamp(
          centerY,
          minYPercent,
          maxYPercent
        )

      onMove?.(
  drag.id,

  Math.round(
    centerX * 100
  ) / 100,

  Math.round(
    centerY * 100
  ) / 100
)
    }

  // ==================================================
  // OBJECT DRAG START
  // ==================================================

  const startObjectDrag =
  (
    event,
    object
  ) => {
    if (!editable) {
      return
    }

    if (
      event.button !== 0
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const board =
      boardRef.current

    if (!board) {
      return
    }

    const boardRect =
      board.getBoundingClientRect()

    const startLeftPx =
      (
        object.x / 100
      ) *
      boardRect.width

    const startTopPx =
      (
        object.y / 100
      ) *
      boardRect.height

    const widthPx =
      (
        object.width / 100
      ) *
      boardRect.width

    const heightPx =
      (
        object.height / 100
      ) *
      boardRect.height

    objectDragging.current = {
      id:
        object.id,

      startClientX:
        event.clientX,

      startClientY:
        event.clientY,

      startLeftPx,

      startTopPx,

      widthPx,

      heightPx,
    }

    setSelectedObjectId(
      object.id
    )

    setObjectAction(
      true
    )

    try {
      event.currentTarget.setPointerCapture(
        event.pointerId
      )
    } catch {
      // Ignore
    }
  }
  // ==================================================
  // OBJECT RESIZE START
  // ==================================================

  const startObjectResize =
    (
      event,
      object
    ) => {
      if (!editable) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const point =
        getBoardPercent(
          event
        )

      objectResizing.current = {
        id:
          object.id,

        startX:
          point.x,

        startY:
          point.y,

        startWidth:
          object.width,

        startHeight:
          object.height,
      }

      setSelectedObjectId(
        object.id
      )

      setObjectAction(
        true
      )

      try {
        event.currentTarget.setPointerCapture(
          event.pointerId
        )
      } catch {
        // Ignore
      }
    }

  // ==================================================
  // OBJECT MOVE / RESIZE
  // ==================================================

  useEffect(() => {
    const move =
      (event) => {
        // ------------------------------------------
        // OBJECT DRAG
        // ------------------------------------------

       if (
  objectDragging.current
) {
  const board =
    boardRef.current

  if (!board) {
    return
  }

  const boardRect =
    board.getBoundingClientRect()

  const drag =
    objectDragging.current

  const dx =
    event.clientX -
    drag.startClientX

  const dy =
    event.clientY -
    drag.startClientY

  let leftPx =
    drag.startLeftPx +
    dx

  let topPx =
    drag.startTopPx +
    dy

  leftPx =
    clamp(
      leftPx,
      0,
      boardRect.width -
        drag.widthPx
    )

  topPx =
    clamp(
      topPx,
      0,
      boardRect.height -
        drag.heightPx
    )

  const x =
    (
      leftPx /
      boardRect.width
    ) *
    100

  const y =
    (
      topPx /
      boardRect.height
    ) *
    100

  setFloorObjects(
    (current) =>
      current.map(
        (object) => {
          if (
            object.id !==
            drag.id
          ) {
            return object
          }

          return {
            ...object,

            x:
              Math.round(
                x * 100
              ) / 100,

            y:
              Math.round(
                y * 100
              ) / 100,
          }
        }
      )
  )

  return
}

        // ------------------------------------------
        // OBJECT RESIZE
        // ------------------------------------------

        if (
          objectResizing.current
        ) {
          const board =
            boardRef.current

          if (!board) {
            return
          }

          const point =
            getBoardPercent(
              event
            )

          const resize =
            objectResizing.current

          const dx =
            point.x -
            resize.startX

          const dy =
            point.y -
            resize.startY

          setFloorObjects(
            (current) =>
              current.map(
                (object) => {
                  if (
                    object.id !==
                    resize.id
                  ) {
                    return object
                  }

                  const width =
                    clamp(
                      resize.startWidth +
                        dx,

                      MIN_OBJECT_WIDTH,

                      100 -
                        object.x
                    )

                  const height =
                    clamp(
                      resize.startHeight +
                        dy,

                      MIN_OBJECT_HEIGHT,

                      100 -
                        object.y
                    )

                  return {
                    ...object,
                    width,
                    height,
                  }
                }
              )
          )
        }
      }

    const up =
      () => {
        dragging.current =
          null

        objectDragging.current =
          null

        objectResizing.current =
          null

        setIsDragging(
          false
        )

        setObjectAction(
          false
        )

        setGuides({
          vertical:
            null,

          horizontal:
            null,
        })
      }

    window.addEventListener(
      'pointermove',
      move
    )

    window.addEventListener(
      'pointerup',
      up
    )

    window.addEventListener(
      'pointercancel',
      up
    )

    return () => {
      window.removeEventListener(
        'pointermove',
        move
      )

      window.removeEventListener(
        'pointerup',
        up
      )

      window.removeEventListener(
        'pointercancel',
        up
      )
    }
  })

  // ==================================================
  // ADD OBJECT
  // ==================================================

  const addObject =
    (type) => {
      const object =
        createFloorObject(
          type
        )

      setFloorObjects(
        (current) => [
          ...current,
          object,
        ]
      )

      setSelectedObjectId(
        object.id
      )
    }

  // ==================================================
  // DELETE OBJECT
  // ==================================================

  const deleteObject =
    (id) => {
      setFloorObjects(
        (current) =>
          current.filter(
            (object) =>
              object.id !==
              id
          )
      )

      if (
        selectedObjectId ===
        id
      ) {
        setSelectedObjectId(
          null
        )
      }
    }

  // ==================================================
  // DELETE SELECTED
  // ==================================================

  const deleteSelected =
    () => {
      if (
        !selectedObjectId
      ) {
        return
      }

      deleteObject(
        selectedObjectId
      )
    }

  // ==================================================
  // TEXT EDIT
  // ==================================================

  const editText =
    (object) => {
      if (
        object.type !==
        'text'
      ) {
        return
      }

      const value =
        window.prompt(
          'Text enter karo:',
          object.text ||
            'Text'
        )

      if (
        value === null
      ) {
        return
      }

      setFloorObjects(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              object.id
                ? {
                    ...item,
                    text:
                      value,
                  }
                : item
          )
      )
    }

  // ==================================================
  // UPDATE OBJECT
  // ==================================================

  const updateObject =
    (
      id,
      patch
    ) => {
      setFloorObjects(
        (current) =>
          current.map(
            (object) =>
              object.id ===
              id
                ? {
                    ...object,
                    ...patch,
                  }
                : object
          )
      )
    }

  // ==================================================
  // KEYBOARD DELETE
  // ==================================================

  useEffect(() => {
    if (!editable) {
      return
    }

    const keyDown =
      (event) => {
        if (
          event.key !==
            'Delete' &&
          event.key !==
            'Backspace'
        ) {
          return
        }

        const target =
          event.target

        if (
          target?.tagName ===
            'INPUT' ||
          target?.tagName ===
            'TEXTAREA' ||
          target?.isContentEditable
        ) {
          return
        }

        deleteSelected()
      }

    window.addEventListener(
      'keydown',
      keyDown
    )

    return () =>
      window.removeEventListener(
        'keydown',
        keyDown
      )
  }, [
    editable,
    selectedObjectId,
  ])

  // ==================================================
  // FINISH POINTER
  // ==================================================

  const finishPointer =
    () => {
      dragging.current =
        null

      objectDragging.current =
        null

      objectResizing.current =
        null

      setIsDragging(
        false
      )

      setObjectAction(
        false
      )

      setGuides({
        vertical:
          null,

        horizontal:
          null,
      })
    }

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="floor-plan-editor">

      {/* ==========================================
          TOOLBAR
          ========================================== */}

      {editable && (
        <div className="floor-editor-toolbar">

          <button
            type="button"
            className="floor-tool"
            onClick={() =>
              addObject(
                'rect'
              )
            }
          >
            ▭ Rectangle
          </button>

          <button
            type="button"
            className="floor-tool"
            onClick={() =>
              addObject(
                'circle'
              )
            }
          >
            ○ Circle
          </button>

          <button
            type="button"
            className="floor-tool"
            onClick={() =>
              addObject(
                'text'
              )
            }
          >
            T Text
          </button>

          <button
            type="button"
            className="floor-tool danger"
            disabled={
              !selectedObjectId
            }
            onClick={
              deleteSelected
            }
          >
            🗑 Delete
          </button>

          <span className="floor-tool-divider" />

          {[
            ['single', '☝ One seat'],
            ['row', '⇔ Whole row'],
            ['column', '⇕ Whole column'],
          ].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className={`floor-tool ${
                selectMode === mode
                  ? 'active'
                  : ''
              }`}
              onClick={() => {
                setSelectMode(mode)
                setSelectedSeatIds([])
              }}
            >
              {label}
            </button>
          ))}

          <button
            type="button"
            className="floor-tool"
            onClick={() =>
              setSelectedSeatIds(
                seats.map((s) => s._id)
              )
            }
          >
            Select all
          </button>

          <button
            type="button"
            className="floor-tool"
            disabled={
              !selectedSeatIds.length
            }
            onClick={() =>
              setSelectedSeatIds([])
            }
          >
            Clear ({selectedSeatIds.length})
          </button>

          <span className="floor-editor-help">
            {selectMode === 'row'
              ? 'Press a seat: its whole row moves together.'
              : selectMode === 'column'
              ? 'Press a seat: its whole column moves together.'
              : 'Drag a seat. Shift+click adds seats; drag one to move all selected.'}
          </span>
        </div>
      )}

      {/* ==========================================
          BOARD
          ========================================== */}

      <div
        ref={
          boardRef
        }
        className={`plan ${
          seatPct
            ? 'dense'
            : ''
        } ${
          editable
            ? 'editing'
            : ''
        } ${
          isDragging ||
          objectAction
            ? 'is-dragging'
            : ''
        }`}
        style={{
          '--seat-pct':
            seatPct || undefined,

          aspectRatio:
            `${boardAspectRatio} / 1`,

          minHeight:
            total > 0
              ? undefined
              : '280px',

          touchAction:
            editable
              ? 'none'
              : 'auto',
        }}
        onPointerDown={(
          event
        ) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            setSelectedObjectId(
              null
            )

            setSelectedSeatIds(
              []
            )
          }
        }}
        onPointerMove={
          handleMove
        }
        onPointerUp={
          finishPointer
        }
        onPointerCancel={
          finishPointer
        }
      >

        {/* ========================================
            ALIGNMENT GUIDES
            ======================================== */}

        {editable &&
          guides.vertical !=
            null && (
            <div
              className="alignment-guide vertical"
              style={{
                left:
                  `${guides.vertical}%`,
              }}
            />
          )}

        {editable &&
          guides.horizontal !=
            null && (
            <div
              className="alignment-guide horizontal"
              style={{
                top:
                  `${guides.horizontal}%`,
              }}
            />
          )}

        {/* ========================================
            FLOOR OBJECTS
            ======================================== */}

        {floorObjects.map(
          (object) => {
            const selected =
              selectedObjectId ===
              object.id

            const opacity =
              object.backgroundOpacity ??
              1

            const style = {
              left:
                `${object.x}%`,

              top:
                `${object.y}%`,

              width:
                `${object.width}%`,

              height:
                `${object.height}%`,

              background:
                object.background ===
                'transparent'
                  ? 'transparent'
                  : object.background,

              border:
                `${object.borderWidth || 0}px solid ${
                  object.borderColor ||
                  'transparent'
                }`,

              opacity:
                object.type ===
                'text'
                  ? 1
                  : opacity,

              color:
                object.color ||
                '#0f172a',

              '--floor-font-size':
                `${object.fontSize || 18}px`,

              fontWeight:
                object.fontWeight ||
                600,

              textAlign:
                object.textAlign ||
                'center',

              transform:
                `rotate(${
                  object.rotation ||
                  0
                }deg)`,

              zIndex:
                selected
                  ? 15
                  : 5,
            }

            return (
              <div
                key={
                  object.id
                }
                className={`floor-object ${
                  object.type
                } ${
                  selected
                    ? 'selected'
                    : ''
                }`}
                style={
                  style
                }
                onPointerDown={(
                  event
                ) =>
                  startObjectDrag(
                    event,
                    object
                  )
                }
                onClick={(
                  event
                ) => {
                  event.stopPropagation()

                  setSelectedObjectId(
                    object.id
                  )
                }}
                onDoubleClick={(
                  event
                ) => {
                  event.stopPropagation()

                  editText(
                    object
                  )
                }}
              >

                {object.type ===
                  'text' &&
                  object.text}

                {editable &&
                  selected && (
                    <div
                      className="floor-resize-handle"
                      onPointerDown={(
                        event
                      ) =>
                        startObjectResize(
                          event,
                          object
                        )
                      }
                    />
                  )}
              </div>
            )
          }
        )}

        {/* ========================================
            SEATS
            ======================================== */}

        {seats.map(
          (
            seat,
            index
          ) => {
            const position =
              getPosition(
                seat,
                index
              )

            const picked =
              pickedId ===
              seat._id

            const draggingThis =
              dragging.current
                ?.id ===
              seat._id

            return (
              <button
                key={
                  seat._id
                }
                type="button"
                data-seat-id={
                  seat._id
                }
                className={`pseat ${
                  seat.state ||
                  'available'
                } ${
                  picked
                    ? 'picked'
                    : ''
                } ${
                  draggingThis
                    ? 'dragging'
                    : ''
                } ${
                  selectedSeatIds.includes(
                    seat._id
                  )
                    ? 'multi-selected'
                    : ''
                }`}
                style={{
                  left:
                    `${position.x}%`,

                  top:
                    `${position.y}%`,

                  touchAction:
                    editable
                      ? 'none'
                      : 'auto',
                }}
                onPointerDown={(
                  event
                ) =>
                  startDrag(
                    event,
                    seat
                  )
                }
                onClick={() => {
                  if (
                    !editable &&
                    onPick
                  ) {
                    onPick(
                      seat
                    )
                  }
                }}
                title={
                  seat.state ===
                  'occupied'
                    ? `${
                        seat.number
                      }: ${
                        seat
                          .occupant
                          ?.name ||
                        'Occupied'
                      }`
                    : `${
                        seat.number
                      } (${
                        seat.state ||
                        'available'
                      })`
                }
              >
                <b>
                  {
                    seat.number
                  }
                </b>

                <small>
                  {seat.state ===
                  'occupied'
                    ? (
                        seat
                          .occupant
                          ?.name ||
                        'Occupied'
                      )
                        .split(
                          ' '
                        )[0]

                    : seat.state ===
                      'maintenance'
                    ? 'Maintenance'
                    : ''}
                </small>
              </button>
            )
          }
        )}

        {/* ========================================
            EMPTY
            ======================================== */}

        {!seats.length &&
          !floorObjects.length && (
            <div className="floor-empty">
              Add seats or use the
              editor tools above.
            </div>
          )}
      </div>

      {/* ==========================================
          SELECTED OBJECT PANEL
          ========================================== */}

      {editable &&
        selectedObjectId && (
          <div className="floor-object-panel">

            {(() => {
              const object =
                floorObjects.find(
                  (item) =>
                    item.id ===
                    selectedObjectId
                )

              if (!object) {
                return null
              }

              return (
                <>
                  <strong>
                    {object.type ===
                    'rect'
                      ? 'Rectangle'
                      : object.type ===
                        'circle'
                      ? 'Circle'
                      : 'Text'}
                  </strong>

                  {object.type ===
                    'text' && (
                    <button
                      type="button"
                      className="floor-tool"
                      onClick={() =>
                        editText(
                          object
                        )
                      }
                    >
                      ✏️ Edit Text
                    </button>
                  )}

                  {object.type !==
                    'text' && (
                    <>
                      <label>
                        Background

                        <input
                          type="color"
                          value={
                            object.background?.startsWith(
                              '#'
                            )
                              ? object.background
                              : '#e2e8f0'
                          }
                          onChange={(
                            event
                          ) =>
                            updateObject(
                              object.id,
                              {
                                background:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                        />
                      </label>

                      <label>
                        Border Color

                        <input
                          type="color"
                          value={
                            object.borderColor ||
                            '#64748b'
                          }
                          onChange={(
                            event
                          ) =>
                            updateObject(
                              object.id,
                              {
                                borderColor:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                        />
                      </label>

                      <label>
                        Border Width

                        <input
                          type="number"
                          min="0"
                          max="8"
                          value={
                            object.borderWidth ??
                            2
                          }
                          onChange={(
                            event
                          ) =>
                            updateObject(
                              object.id,
                              {
                                borderWidth:
                                  Number(
                                    event
                                      .target
                                      .value
                                  ),
                              }
                            )
                          }
                        />
                      </label>
                    </>
                  )}

                  {object.type ===
                    'text' && (
                    <>
                      <label>
                        Font

                        <input
                          type="number"
                          min="8"
                          max="80"
                          value={
                            object.fontSize ||
                            18
                          }
                          onChange={(
                            event
                          ) =>
                            updateObject(
                              object.id,
                              {
                                fontSize:
                                  Number(
                                    event
                                      .target
                                      .value
                                  ),
                              }
                            )
                          }
                        />
                      </label>

                      <label>
                        Color

                        <input
                          type="color"
                          value={
                            object.color ||
                            '#0f172a'
                          }
                          onChange={(
                            event
                          ) =>
                            updateObject(
                              object.id,
                              {
                                color:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                        />
                      </label>
                    </>
                  )}

                  <button
                    type="button"
                    className="floor-tool danger"
                    onClick={() =>
                      deleteObject(
                        object.id
                      )
                    }
                  >
                    🗑 Delete
                  </button>
                </>
              )
            })()}
          </div>
        )}
    </div>
  )
}