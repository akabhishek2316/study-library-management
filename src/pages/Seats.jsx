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

import FloorPlan from '../components/FloorPlan'

import {
  PRESETS,
  autoPos,
  buildLayout,
} from '../components/floorLayouts'


const EMPTY_LIST = []

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

  /*
    Floor plan extras. They come from the database (hall.floor):
      floors     = what is saved
      floorEdits = unsaved changes made while editing
                   { [hallId]: { objects, ratio } }
  */
  const [floors, setFloors] =
    useState({})

  const [floorEdits, setFloorEdits] =
    useState({})

  const [resetKey, setResetKey] =
    useState(0)

  const [preset, setPreset] =
    useState('grid')

  // "Row blocks" preset options
  const [perRow, setPerRow] =
    useState(6)

  const [rowsPerBlock, setRowsPerBlock] =
    useState(2)


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

        setFloors(
          data?.floors &&
            typeof data.floors ===
              'object'
            ? data.floors
            : {}
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
  // FLOOR PLAN HELPERS
  // ------------------------------------------------

  const floorFor =
    (hallId) => ({
      objects:
        floorEdits[hallId]
          ?.objects ??
        floors[hallId]
          ?.objects ??
        EMPTY_LIST,

      ratio:
        floorEdits[hallId]
          ?.ratio ??
        floors[hallId]
          ?.ratio ??
        null,

      // an edit of "null" (normal seat size) must win over the saved value
      seatPct:
        floorEdits[hallId] &&
        'seatPct' in
          floorEdits[hallId]
          ? floorEdits[hallId]
              .seatPct
          : floors[hallId]
              ?.seatPct ??
            null,
    })


  const changeObjects =
    (hallId, objects) =>
      setFloorEdits(
        (current) => ({
          ...current,

          [hallId]: {
            ...current[
              hallId
            ],

            objects,
          },
        })
      )


  // leaving edit mode throws away unsaved floor changes
  useEffect(() => {
    if (!editing) {
      setFloorEdits({})
      setResetKey(
        (key) => key + 1
      )
    }
  }, [editing])


  // ------------------------------------------------
  // PRESETS
  //
  // The layout engine (components/floorLayouts.js)
  // keeps every seat far enough from the next one
  // and makes the board as tall as it needs to be,
  // so seats can never overlap.
  // ------------------------------------------------

  const applyPreset =
    () => {
      const nextPositions = {}
      const nextEdits = {}

      hallGroups.forEach(
        (group) => {
          const result =
            buildLayout(
              preset,
              group.seats,
              {
                groupSize,
                perRow,
                rowsPerBlock,
              }
            )

          Object.assign(
            nextPositions,
            result.positions
          )

          // keep the drawings the owner made, replace old preset tables
          const kept =
            floorFor(
              group.id
            ).objects.filter(
              (item) =>
                !item.auto
            )

          nextEdits[
            group.id
          ] = {
            ratio:
              result.ratio,

            seatPct:
              result.seatPct,

            objects: [
              ...kept,
              ...result.objects,
            ],
          }
        }
      )

      setLayout(
        nextPositions
      )

      setFloorEdits(
        (current) => ({
          ...current,
          ...nextEdits,
        })
      )

      setResetKey(
        (key) => key + 1
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
        let count = 0

        for (const group of hallGroups) {
          const positions =
            group.seats.map(
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
                    group.seats
                      .length
                  )

                return {
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
                }
              }
            )

          if (!positions.length) {
            continue
          }

          const floor =
            floorFor(
              group.id
            )

          await api(
            '/seats/layout',
            {
              method:
                'PUT',

              body: {
                hall:
                  group.id,

                positions,

                objects:
                  floor.objects,

                ratio:
                  floor.ratio,

                seatPct:
                  floor.seatPct,
              },
            }
          )

          count +=
            positions.length
        }


        if (!count) {
          throw new Error(
            'No seat positions to save.'
          )
        }


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
                  Drag seats, or pick
                  a preset and press
                  Apply. Rectangles,
                  circles and text are
                  saved with the layout.
                </div>


                <label className="group-select">
                  Preset

                  <select
                    value={
                      preset
                    }
                    onChange={(
                      event
                    ) =>
                      setPreset(
                        event
                          .target
                          .value
                      )
                    }
                  >
                    {PRESETS.map(
                      (item) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {
                            item.name
                          }
                          {' - '}
                          {
                            item.hint
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>


                {PRESETS.find(
                  (item) =>
                    item.id ===
                    preset
                )?.needsRow && (
                  <>
                    <label className="group-select">
                      Seats in one row

                      <select
                        value={perRow}
                        onChange={(event) =>
                          setPerRow(
                            Number(
                              event.target.value
                            )
                          )
                        }
                      >
                        {[3, 4, 5, 6, 7, 8, 9, 10, 12].map(
                          (n) => (
                            <option
                              key={n}
                              value={n}
                            >
                              {n}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label className="group-select">
                      Rows together

                      <select
                        value={rowsPerBlock}
                        onChange={(event) =>
                          setRowsPerBlock(
                            Number(
                              event.target.value
                            )
                          )
                        }
                      >
                        {[1, 2, 3].map((n) => (
                          <option
                            key={n}
                            value={n}
                          >
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}


                {PRESETS.find(
                  (item) =>
                    item.id ===
                    preset
                )?.needsGroup && (
                  <label className="group-select">
                    Seats per
                    group

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
                      {[
                        2, 4, 6,
                        8, 10, 12,
                      ].map(
                        (size) => (
                          <option
                            key={
                              size
                            }
                            value={
                              size
                            }
                          >
                            {size}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                )}


                <button
                  type="button"
                  className="ghost"
                  onClick={
                    applyPreset
                  }
                >
                  Apply preset
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

                objects={
                  floorFor(
                    group.id
                  ).objects
                }

                ratio={
                  floorFor(
                    group.id
                  ).ratio
                }

                seatPct={
                  floorFor(
                    group.id
                  ).seatPct
                }

                onMoveMany={(
                  updates
                ) =>
                  setLayout(
                    (current) => {
                      const next = {
                        ...current,
                      }

                      updates.forEach(
                        (u) => {
                          next[u.id] = {
                            x: u.x,
                            y: u.y,
                          }
                        }
                      )

                      return next
                    }
                  )
                }

                resetKey={
                  resetKey
                }

                onObjectsChange={(
                  list
                ) =>
                  changeObjects(
                    group.id,
                    list
                  )
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