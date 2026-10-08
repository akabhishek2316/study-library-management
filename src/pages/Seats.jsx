import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  api,
  fmtDate,
  todayISO,
} from '../api'

import { useAuth } from '../AuthContext'

import FloorPlan, {
  autoPos,
} from '../components/FloorPlan'


export default function Seats() {
  const { user } =
    useAuth()

  const owner =
    user?.role === 'owner'


  const [shifts, setShifts] =
    useState([])

  const [halls, setHalls] =
    useState([])

  const [seats, setSeats] =
    useState([])


  const [shift, setShift] =
    useState('')

  const [hall, setHall] =
    useState('')

  const [date, setDate] =
    useState(
      todayISO()
    )


  const [picked, setPicked] =
    useState(null)

  const [view, setView] =
    useState('plan')

  const [editing, setEditing] =
    useState(false)


  /*
    Temporary positions.

    Database position is NOT changed
    until Save Layout is clicked.
  */
  const [layout, setLayout] =
    useState({})


  /*
    Only even group sizes.
  */
  const [groupSize, setGroupSize] =
    useState(4)


  const [form, setForm] =
    useState({
      hallMode:
        'existing',

      hall:
        '',

      hallName:
        '',

      hallType:
        'Non-AC',

      hallDescription:
        '',

      prefix:
        'S',

      startNumber:
        '1',

      quantity:
        '1',
    })


  const [error, setError] =
    useState('')

  const [ok, setOk] =
    useState('')


  // ------------------------------------------------
  // Initial data
  // ------------------------------------------------

  useEffect(() => {
    const loadInitial =
      async () => {
        try {
          setError('')

          const [
            shiftData,
            hallData,
          ] =
            await Promise.all([
              api('/shifts'),
              api('/seats/halls'),
            ])


          const validShifts =
            Array.isArray(
              shiftData
            )
              ? shiftData.filter(
                  (item) =>
                    item &&
                    item._id
                )
              : []


          const validHalls =
            Array.isArray(
              hallData
            )
              ? hallData.filter(
                  (item) =>
                    item &&
                    item._id
                )
              : []


          setShifts(
            validShifts
          )

          setHalls(
            validHalls
          )


          if (
            validShifts.length
          ) {
            setShift(
              String(
                validShifts[0]._id
              )
            )
          }


          if (
            validHalls.length
          ) {
            const firstHall =
              String(
                validHalls[0]._id
              )

            setHall(
              firstHall
            )

            setForm(
              (current) => ({
                ...current,

                hall:
                  firstHall,
              })
            )
          }
        } catch (err) {
          setError(
            err.message
          )
        }
      }


    loadInitial()
  }, [])


  // ------------------------------------------------
  // Load seat map
  // ------------------------------------------------

  const load =
    async () => {
      if (!shift) {
        setSeats([])
        return
      }


      try {
        setError('')

        const data =
          await api(
            `/seats/map?shift=${encodeURIComponent(
              shift
            )}&date=${encodeURIComponent(
              date
            )}`
          )


        setSeats(
          Array.isArray(
            data?.seats
          )
            ? data.seats
            : []
        )
      } catch (err) {
        setSeats([])

        setError(
          err.message
        )
      }
    }


  useEffect(() => {
    setPicked(null)
    setLayout({})

    load()
  }, [
    shift,
    date,
  ])


  // ------------------------------------------------
  // Normalize seats
  // ------------------------------------------------

  const normalizedSeats =
    useMemo(
      () => {
        return seats.map(
          (seat) => {
            const hallObject =
              seat.hall &&
              typeof seat.hall ===
                'object'
                ? seat.hall
                : null


            const hallId =
              String(
                hallObject?._id ||
                  seat.hall ||
                  ''
              )


            const hallData =
              halls.find(
                (item) =>
                  String(
                    item._id
                  ) ===
                  hallId
              )


            return {
              ...seat,

              hallId,

              hallName:
                hallObject?.name ||
                hallData?.name ||
                'Unknown Hall',

              hallType:
                hallObject?.type ||
                hallData?.type ||
                '-',
            }
          }
        )
      },
      [
        seats,
        halls,
      ]
    )


  // ------------------------------------------------
  // Visible seats
  // ------------------------------------------------

  const visibleSeats =
    useMemo(
      () => {
        if (!hall) {
          return normalizedSeats
        }


        return normalizedSeats.filter(
          (seat) =>
            seat.hallId ===
            String(hall)
        )
      },
      [
        normalizedSeats,
        hall,
      ]
    )


  // ------------------------------------------------
  // Hall groups
  // ------------------------------------------------

  const hallGroups =
    useMemo(
      () => {
        const groups = {}


        visibleSeats.forEach(
          (seat) => {
            const key =
              seat.hallId ||
              'unknown'


            if (!groups[key]) {
              groups[key] = {
                id:
                  key,

                name:
                  seat.hallName ||
                  'Unknown Hall',

                type:
                  seat.hallType ||
                  '-',

                seats: [],
              }
            }


            groups[key].seats.push(
              seat
            )
          }
        )


        return Object.values(
          groups
        )
      },
      [
        visibleSeats,
      ]
    )


  // ------------------------------------------------
  // Add seats
  // ------------------------------------------------

  const addSeat =
    async (event) => {
      event.preventDefault()

      setError('')
      setOk('')


      try {
        const quantity =
          Number(
            form.quantity
          )

        const startNumber =
          Number(
            form.startNumber
          )


        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity < 1 ||
          quantity > 200
        ) {
          throw new Error(
            'Number of seats must be between 1 and 200.'
          )
        }


        if (
          !Number.isInteger(
            startNumber
          ) ||
          startNumber < 1
        ) {
          throw new Error(
            'Starting number must be a positive number.'
          )
        }


        if (
          form.hallMode ===
            'existing' &&
          !form.hall
        ) {
          throw new Error(
            'Please select a hall.'
          )
        }


        if (
          form.hallMode ===
            'new' &&
          !form.hallName.trim()
        ) {
          throw new Error(
            'Please enter hall name.'
          )
        }


        if (
          !form.prefix.trim()
        ) {
          throw new Error(
            'Please enter seat prefix.'
          )
        }


        await api(
          '/seats/bulk',
          {
            method:
              'POST',

            body: {
              hallMode:
                form.hallMode,

              hall:
                form.hall,

              hallName:
                form.hallName,

              hallType:
                form.hallType,

              hallDescription:
                form.hallDescription,

              prefix:
                form.prefix,

              startNumber,

              quantity,
            },
          }
        )


        const hallData =
          await api(
            '/seats/halls'
          )


        const updatedHalls =
          Array.isArray(
            hallData
          )
            ? hallData
            : []


        setHalls(
          updatedHalls
        )


        let selectedHall =
          form.hall


        if (
          form.hallMode ===
          'new'
        ) {
          const created =
            updatedHalls.find(
              (item) =>
                item.name
                  ?.trim()
                  .toLowerCase() ===
                form.hallName
                  .trim()
                  .toLowerCase()
            )


          selectedHall =
            created?._id ||
            ''
        }


        setForm({
          hallMode:
            'existing',

          hall:
            selectedHall,

          hallName:
            '',

          hallType:
            'Non-AC',

          hallDescription:
            '',

          prefix:
            'S',

          startNumber:
            '1',

          quantity:
            '1',
        })


        if (
          selectedHall
        ) {
          setHall(
            String(
              selectedHall
            )
          )
        }


        setPicked(null)
        setLayout({})

        await load()


        setOk(
          `${quantity} ${
            quantity === 1
              ? 'seat'
              : 'seats'
          } added successfully.`
        )
      } catch (err) {
        setError(
          err.message
        )
      }
    }


  // ------------------------------------------------
  // Maintenance
  // ------------------------------------------------

  const toggleMaintenance =
    async (seat) => {
      setError('')
      setOk('')


      try {
        await api(
          `/seats/${seat._id}`,
          {
            method:
              'PUT',

            body: {
              status:
                seat.status ===
                'active'
                  ? 'maintenance'
                  : 'active',
            },
          }
        )


        setPicked(null)

        await load()
      } catch (err) {
        setError(
          err.message
        )
      }
    }


  // ------------------------------------------------
  // Delete
  // ------------------------------------------------

  const removeSeat =
    async (seat) => {
      if (
        !window.confirm(
          `Delete seat ${seat.number}?`
        )
      ) {
        return
      }


      setError('')
      setOk('')


      try {
        await api(
          `/seats/${seat._id}`,
          {
            method:
              'DELETE',
          }
        )


        setPicked(null)
        setLayout({})

        await load()
      } catch (err) {
        setError(
          err.message
        )
      }
    }


  // ------------------------------------------------
  // Counts
  // ------------------------------------------------

  const availableCount =
    visibleSeats.filter(
      (seat) =>
        seat.state ===
        'available'
    ).length


  const occupiedCount =
    visibleSeats.filter(
      (seat) =>
        seat.state ===
        'occupied'
    ).length


  const maintenanceCount =
    visibleSeats.filter(
      (seat) =>
        seat.state ===
        'maintenance'
    ).length


  // ------------------------------------------------
  // AUTO ARRANGE
  // ------------------------------------------------

  const autoArrange =
    () => {
      const next = {}


      hallGroups.forEach(
        (group) => {
          group.seats.forEach(
            (
              seat,
              index
            ) => {
              next[
                seat._id
              ] =
                autoPos(
                  index,
                  group.seats.length
                )
            }
          )
        }
      )


      setLayout(
        next
      )
    }


  // ------------------------------------------------
  // GROUP SHAPE
  // ------------------------------------------------

  const getGroupShape =
    (size) => {
      if (
        size === 2
      ) {
        return {
          columns: 2,
          rows: 1,
        }
      }


      if (
        size === 4
      ) {
        return {
          columns: 2,
          rows: 2,
        }
      }


      if (
        size === 6
      ) {
        return {
          columns: 3,
          rows: 2,
        }
      }


      if (
        size === 8
      ) {
        return {
          columns: 4,
          rows: 2,
        }
      }


      if (
        size === 10
      ) {
        return {
          columns: 5,
          rows: 2,
        }
      }


      if (
        size === 12
      ) {
        return {
          columns: 6,
          rows: 2,
        }
      }


      return {
        columns: 2,
        rows: 2,
      }
    }


  // ------------------------------------------------
  // GROUP LAYOUT
  //
  // Uses the full floor area while
  // keeping enough spacing between
  // individual seats and groups.
  // ------------------------------------------------

  const applyGroupLayout =
    () => {
      const size =
        Number(
          groupSize
        )


      const next = {}


      hallGroups.forEach(
        (group) => {
          const groupSeats =
            group.seats


          if (
            !groupSeats.length
          ) {
            return
          }


          const totalGroups =
            Math.ceil(
              groupSeats.length /
                size
            )


          /*
            Spread group blocks
            across the board.

            Maximum 3 groups
            horizontally.
          */

          const groupsPerRow =
            Math.min(
              3,
              Math.max(
                1,
                Math.ceil(
                  Math.sqrt(
                    totalGroups
                  )
                )
              )
            )


          const groupRows =
            Math.ceil(
              totalGroups /
                groupsPerRow
            )


          const BOARD_LEFT =
            7

          const BOARD_RIGHT =
            93

          const BOARD_TOP =
            10

          const BOARD_BOTTOM =
            90


          const boardWidth =
            BOARD_RIGHT -
            BOARD_LEFT

          const boardHeight =
            BOARD_BOTTOM -
            BOARD_TOP


          const blockWidth =
            boardWidth /
            groupsPerRow

          const blockHeight =
            boardHeight /
            groupRows


          groupSeats.forEach(
            (
              seat,
              index
            ) => {
              const groupIndex =
                Math.floor(
                  index /
                    size
                )


              const insideIndex =
                index %
                size


              const {
                columns,
                rows,
              } =
                getGroupShape(
                  size
                )


              const groupColumn =
                groupIndex %
                groupsPerRow


              const groupRow =
                Math.floor(
                  groupIndex /
                    groupsPerRow
                )


              const groupStartX =
                BOARD_LEFT +
                groupColumn *
                  blockWidth


              const groupStartY =
                BOARD_TOP +
                groupRow *
                  blockHeight


              const seatColumn =
                insideIndex %
                columns


              const seatRow =
                Math.floor(
                  insideIndex /
                    columns
                )


              /*
                Padding inside
                each group block.
              */

              const paddingX =
                Math.min(
                  4,
                  blockWidth *
                    0.08
                )

              const paddingY =
                Math.min(
                  6,
                  blockHeight *
                    0.10
                )


              const usableWidth =
                Math.max(
                  5,
                  blockWidth -
                    paddingX * 2
                )


              const usableHeight =
                Math.max(
                  5,
                  blockHeight -
                    paddingY * 2
                )


              /*
                Center of each
                individual seat slot.
              */

              const slotWidth =
                usableWidth /
                columns

              const slotHeight =
                usableHeight /
                rows


              let x =
                groupStartX +
                paddingX +
                seatColumn *
                  slotWidth +
                slotWidth / 2


              let y =
                groupStartY +
                paddingY +
                seatRow *
                  slotHeight +
                slotHeight / 2


              /*
                FloorPlan uses
                left/top for the
                seat position.

                Move slightly back
                so the seat itself
                stays centered in
                its slot.
              */

              x -= 3.4
              y -= 4.5


              x =
                Math.max(
                  3,
                  Math.min(
                    94,
                    x
                  )
                )


              y =
                Math.max(
                  5,
                  Math.min(
                    90,
                    y
                  )
                )


              next[
                seat._id
              ] = {
                x:
                  Math.round(
                    x * 10
                  ) / 10,

                y:
                  Math.round(
                    y * 10
                  ) / 10,
              }
            }
          )
        }
      )


      setLayout(
        next
      )
    }


  // ------------------------------------------------
  // Save layout
  // ------------------------------------------------

  const saveLayout =
    async () => {
      setError('')
      setOk('')


      try {
        const positions =
          []


        hallGroups.forEach(
          (group) => {
            group.seats.forEach(
              (
                seat,
                index
              ) => {
                const position =
                  layout[
                    seat._id
                  ] ||
                  seat.position ||
                  autoPos(
                    index,
                    group.seats.length
                  )


                positions.push({
                  id:
                    seat._id,

                  x:
                    Number(
                      position.x
                    ),

                  y:
                    Number(
                      position.y
                    ),
                })
              }
            )
          }
        )


        if (
          !positions.length
        ) {
          throw new Error(
            'No seat positions to save.'
          )
        }


        await api(
          '/seats/layout',
          {
            method:
              'PUT',

            body: {
              positions,
            },
          }
        )


        setEditing(
          false
        )

        setLayout({})

        await load()


        setOk(
          'Layout saved successfully.'
        )
      } catch (err) {
        setError(
          err.message
        )
      }
    }


  // ------------------------------------------------
  // Hall change
  // ------------------------------------------------

  const handleHallChange =
    (value) => {
      setHall(
        value
      )

      setForm(
        (current) => ({
          ...current,

          hall:
            value,
        })
      )

      setPicked(null)
      setLayout({})
      setEditing(false)
    }


  // ------------------------------------------------
  // Render
  // ------------------------------------------------

  return (
    <>
      <h1>
        Seat Map
      </h1>


      {error && (
        <div className="alert error">
          {error}
        </div>
      )}


      {ok && (
        <div className="alert ok">
          {ok}
        </div>
      )}


      {/* FILTER BAR */}

      <div className="card row-form">
        <label>
          Date

          <input
            type="date"
            value={date}
            onChange={(event) =>
              setDate(
                event.target.value
              )
            }
          />
        </label>


        <label>
          Shift

          <select
            value={shift}
            onChange={(event) => {
              setPicked(null)
              setLayout({})

              setShift(
                event.target.value
              )
            }}
          >
            <option value="">
              Select shift
            </option>

            {shifts.map(
              (item) => (
                <option
                  key={
                    item._id
                  }
                  value={
                    item._id
                  }
                >
                  {item.name} (
                  {item.startTime}-
                  {item.endTime}
                  )
                </option>
              )
            )}
          </select>
        </label>


        <label>
          Hall

          <select
            value={hall}
            onChange={(event) =>
              handleHallChange(
                event.target.value
              )
            }
          >
            <option value="">
              All Halls
            </option>

            {halls.map(
              (item) => (
                <option
                  key={
                    item._id
                  }
                  value={
                    item._id
                  }
                >
                  {item.name} ·{' '}
                  {item.type}
                </option>
              )
            )}
          </select>
        </label>


        <div className="tabs">
          <button
            type="button"
            className={
              view ===
              'plan'
                ? 'on'
                : ''
            }
            onClick={() => {
              setView(
                'plan'
              )

              setPicked(null)
            }}
          >
            Floor Plan
          </button>


          <button
            type="button"
            className={
              view ===
              'grid'
                ? 'on'
                : ''
            }
            onClick={() => {
              setView(
                'grid'
              )

              setEditing(
                false
              )

              setLayout({})
            }}
          >
            Grid
          </button>
        </div>


        <div className="legend">
          <span className="badge green">
            Available{' '}
            {availableCount}
          </span>

          <span className="badge red">
            Occupied{' '}
            {occupiedCount}
          </span>

          <span className="badge gray">
            Maintenance{' '}
            {maintenanceCount}
          </span>
        </div>
      </div>


      {/* EDIT LAYOUT */}

      {owner &&
        view ===
          'plan' && (
          <div className="card layout-toolbar">
            {!editing ? (
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setPicked(null)
                  setLayout({})

                  setEditing(
                    true
                  )
                }}
              >
                ✏️ Edit Layout
              </button>
            ) : (
              <>
                <div className="layout-info">
                  Drag seats or use
                  an even group
                  layout.
                </div>


                <label className="group-select">
                  Group

                  <select
                    value={
                      groupSize
                    }
                    onChange={(
                      event
                    ) =>
                      setGroupSize(
                        Number(
                          event
                            .target
                            .value
                        )
                      )
                    }
                  >
                    <option value="2">
                      2 Seats
                    </option>

                    <option value="4">
                      4 Seats
                    </option>

                    <option value="6">
                      6 Seats
                    </option>

                    <option value="8">
                      8 Seats
                    </option>

                    <option value="10">
                      10 Seats
                    </option>

                    <option value="12">
                      12 Seats
                    </option>
                  </select>
                </label>


                <button
                  type="button"
                  className="ghost"
                  onClick={
                    applyGroupLayout
                  }
                >
                  Apply Group
                </button>


                <button
                  type="button"
                  className="ghost"
                  onClick={
                    autoArrange
                  }
                >
                  Auto Arrange
                </button>


                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setEditing(
                      false
                    )

                    setLayout({})

                    setPicked(null)
                  }}
                >
                  Cancel
                </button>


                <button
                  type="button"
                  onClick={
                    saveLayout
                  }
                >
                  Save Layout
                </button>
              </>
            )}
          </div>
        )}


      {/* HALLS */}

      {hallGroups.map(
        (group) => (
          <div
            className="card"
            key={
              group.id
            }
          >
            <div className="hall-heading">
              <h2>
                {group.name}
              </h2>

              <p className="muted">
                Hall Type:{' '}
                <b>
                  {group.type}
                </b>
              </p>
            </div>


            {view ===
            'plan' ? (
              <FloorPlan
                seats={
                  group.seats
                }

                pickedId={
                  picked?._id
                }

                onPick={
                  setPicked
                }

                editable={
                  editing
                }

                positions={
                  layout
                }

                onMove={(
                  id,
                  x,
                  y
                ) => {
                  setLayout(
                    (current) => ({
                      ...current,

                      [id]: {
                        x,
                        y,
                      },
                    })
                  )
                }}
              />
            ) : (
              <div className="seat-grid">
                {group.seats.map(
                  (seat) => (
                    <button
                      key={
                        seat._id
                      }
                      type="button"
                      className={`seat ${
                        seat.state
                      } ${
                        picked?._id ===
                        seat._id
                          ? 'picked'
                          : ''
                      }`}
                      onClick={() =>
                        setPicked(
                          seat
                        )
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
                          ? seat
                              .occupant
                              ?.name ||
                            'Occupied'
                          : seat.state ===
                            'maintenance'
                            ? 'Maintenance'
                            : 'Available'}
                      </small>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )
      )}


      {/* SELECTED SEAT */}

      {picked &&
        !editing && (
          <div className="card">
            <h3>
              Seat{' '}
              {picked.number}
            </h3>


            <p className="muted">
              Hall:{' '}
              <b>
                {
                  picked.hallName
                }
              </b>
            </p>


            <p className="muted">
              Hall Type:{' '}
              <b>
                {
                  picked.hallType
                }
              </b>
            </p>


            {picked.occupant ? (
              <p>
                Booked by{' '}
                <b>
                  {
                    picked
                      .occupant
                      .name
                  }
                </b>{' '}
                (
                {
                  picked
                    .occupant
                    .phone ||
                  'no phone'
                }
                ), till{' '}
                {
                  fmtDate(
                    picked
                      .occupant
                      .endDate
                  )
                }.
              </p>
            ) : (
              <p className="muted">
                {picked.state ===
                'maintenance'
                  ? 'Under maintenance.'
                  : 'Free for this date and shift.'}
              </p>
            )}


            {owner && (
              <div className="actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() =>
                    toggleMaintenance(
                      picked
                    )
                  }
                >
                  {picked.status ===
                  'active'
                    ? 'Mark Maintenance'
                    : 'Mark Working'}
                </button>


                <button
                  type="button"
                  className="ghost danger"
                  onClick={() =>
                    removeSeat(
                      picked
                    )
                  }
                >
                  Delete Seat
                </button>
              </div>
            )}
          </div>
        )}


      {/* ADD SEATS */}

      {owner && (
        <div className="card">
          <h3>
            Add Seats
          </h3>

          <p className="muted">
            Hall → Seats
          </p>


          <form
            className="seat-create-form"
            onSubmit={
              addSeat
            }
          >
            <label>
              Hall

              <select
                value={
                  form.hallMode
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      hallMode:
                        event.target
                          .value,
                    })
                  )
                }
              >
                <option value="existing">
                  Existing Hall
                </option>

                <option value="new">
                  Create New Hall
                </option>
              </select>
            </label>


            {form.hallMode ===
            'existing' ? (
              <label>
                Select Hall

                <select
                  value={
                    form.hall
                  }
                  onChange={(event) => {
                    const value =
                      event.target
                        .value

                    setHall(
                      value
                    )

                    setForm(
                      (current) => ({
                        ...current,

                        hall:
                          value,
                      })
                    )
                  }}
                  required
                >
                  <option value="">
                    Select Hall
                  </option>

                  {halls.map(
                    (item) => (
                      <option
                        key={
                          item._id
                        }
                        value={
                          item._id
                        }
                      >
                        {item.name} ·{' '}
                        {item.type}
                      </option>
                    )
                  )}
                </select>
              </label>
            ) : (
              <>
                <label>
                  Hall Name

                  <input
                    placeholder="e.g. Main Hall"
                    value={
                      form.hallName
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,

                          hallName:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                  />
                </label>


                <label>
                  Hall Type

                  <select
                    value={
                      form.hallType
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,

                          hallType:
                            event.target
                              .value,
                        })
                      )
                    }
                  >
                    <option value="AC">
                      AC
                    </option>

                    <option value="Non-AC">
                      Non-AC
                    </option>

                    <option value="Cabin">
                      Cabin
                    </option>
                  </select>
                </label>


                <label>
                  Description

                  <input
                    placeholder="Optional"
                    value={
                      form.hallDescription
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,

                          hallDescription:
                            event.target
                              .value,
                        })
                      )
                    }
                  />
                </label>
              </>
            )}


            <label>
              Prefix

              <input
                value={
                  form.prefix
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      prefix:
                        event.target
                          .value,
                    })
                  )
                }
                required
              />
            </label>


            <label>
              Start No.

              <input
                type="number"
                min="1"
                value={
                  form.startNumber
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      startNumber:
                        event.target
                          .value,
                    })
                  )
                }
                required
              />
            </label>


            <label>
              Seats

              <input
                type="number"
                min="1"
                max="200"
                value={
                  form.quantity
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      quantity:
                        event.target
                          .value,
                    })
                  )
                }
                required
              />
            </label>


            <button
              type="submit"
              className="seat-add-button"
            >
              Add{' '}
              {
                form.quantity ||
                0
              }{' '}
              {
                Number(
                  form.quantity
                ) === 1
                  ? 'Seat'
                  : 'Seats'
              }
            </button>
          </form>
        </div>
      )}
    </>
  )
}