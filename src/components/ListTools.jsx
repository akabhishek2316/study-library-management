import {
  useEffect,
  useMemo,
  useState,
} from 'react'

/*
  Small helpers so long lists never flood the screen.

    const list = usePaged(items, {
      pageSize: 15,
      searchText: (item) => `${item.name} ${item.email}`,
      filters: { status: (item, value) => item.status === value },
    })

    <ListBar list={list} placeholder="Search..." />
    list.items.map(...)
    <Pager list={list} />
*/

export function usePaged(
  source,
  {
    pageSize = 15,
    searchText = null,
    filters = {},
  } = {}
) {
  const [query, setQuery] =
    useState('')

  const [page, setPage] =
    useState(1)

  const [values, setValues] =
    useState({})

  const [size, setSize] =
    useState(pageSize)

  const all =
    Array.isArray(source)
      ? source
      : []

  const filtered =
    useMemo(() => {
      const q =
        query
          .trim()
          .toLowerCase()

      return all.filter(
        (item) => {
          if (
            q &&
            searchText &&
            !String(
              searchText(item) ||
                ''
            )
              .toLowerCase()
              .includes(q)
          ) {
            return false
          }

          for (const [
            key,
            value,
          ] of Object.entries(
            values
          )) {
            if (
              value &&
              value !== 'all' &&
              filters[key] &&
              !filters[key](
                item,
                value
              )
            ) {
              return false
            }
          }

          return true
        }
      )
    }, [
      all,
      query,
      values,
    ])

  const pages =
    Math.max(
      1,
      Math.ceil(
        filtered.length /
          size
      )
    )

  // a filter/search can leave us on a page that no longer exists
  useEffect(() => {
    if (page > pages) {
      setPage(pages)
    }
  }, [pages])

  const current =
    Math.min(page, pages)

  return {
    items: filtered.slice(
      (current - 1) * size,
      current * size
    ),

    total: all.length,
    count: filtered.length,
    page: current,
    pages,
    size,

    query,
    values,

    setQuery: (value) => {
      setQuery(value)
      setPage(1)
    },

    setFilter: (
      key,
      value
    ) => {
      setValues((old) => ({
        ...old,
        [key]: value,
      }))
      setPage(1)
    },

    setPage,
    setSize: (value) => {
      setSize(value)
      setPage(1)
    },

    reset: () => {
      setQuery('')
      setValues({})
      setPage(1)
    },
  }
}


/* search box + optional dropdown filters */
export function ListBar({
  list,
  placeholder = 'Search...',
  showSearch = true,

  // [{ key: 'status', label: 'Status', options: [['active','Active'], ...] }]
  filters = [],
}) {
  const active =
    list.query ||
    Object.values(
      list.values
    ).some(
      (v) => v && v !== 'all'
    )

  return (
    <div className="list-bar">
      {showSearch && (
        <input
          type="search"
          value={list.query}
          onChange={(e) =>
            list.setQuery(
              e.target.value
            )
          }
          placeholder={
            placeholder
          }
          aria-label={placeholder}
        />
      )}

      {filters.map((f) => (
        <select
          key={f.key}
          value={
            list.values[
              f.key
            ] || 'all'
          }
          onChange={(e) =>
            list.setFilter(
              f.key,
              e.target.value
            )
          }
          aria-label={f.label}
        >
          <option value="all">
            {f.label}: All
          </option>

          {f.options.map(
            ([value, text]) => (
              <option
                key={value}
                value={value}
              >
                {text}
              </option>
            )
          )}
        </select>
      ))}

      {active && (
        <button
          type="button"
          className="ghost"
          onClick={list.reset}
        >
          Clear
        </button>
      )}
    </div>
  )
}


/* "Showing 1-15 of 120" + previous / next */
export function Pager({
  list,
  sizes = [15, 30, 60],
}) {
  if (list.count === 0) {
    return (
      <p className="muted list-empty">
        {list.total === 0
          ? 'Nothing here yet.'
          : 'No results match your search or filters.'}
      </p>
    )
  }

  const from =
    (list.page - 1) *
      list.size +
    1

  const to = Math.min(
    list.page * list.size,
    list.count
  )

  if (
    list.pages === 1 &&
    list.count <= sizes[0]
  ) {
    return (
      <p className="muted list-count">
        {list.count}{' '}
        {list.count === 1
          ? 'record'
          : 'records'}
      </p>
    )
  }

  return (
    <div className="pager">
      <span className="muted">
        {from}-{to} of{' '}
        {list.count}
        {list.count !==
          list.total &&
          ` (filtered from ${list.total})`}
      </span>

      <div className="pager-buttons">
        <select
          value={list.size}
          onChange={(e) =>
            list.setSize(
              Number(
                e.target.value
              )
            )
          }
          aria-label="Rows per page"
        >
          {sizes.map((s) => (
            <option
              key={s}
              value={s}
            >
              {s} / page
            </option>
          ))}
        </select>

        <button
          type="button"
          className="ghost"
          disabled={
            list.page <= 1
          }
          onClick={() =>
            list.setPage(
              list.page - 1
            )
          }
        >
          Previous
        </button>

        <span>
          {list.page} / {list.pages}
        </span>

        <button
          type="button"
          className="ghost"
          disabled={
            list.page >=
            list.pages
          }
          onClick={() =>
            list.setPage(
              list.page + 1
            )
          }
        >
          Next
        </button>
      </div>
    </div>
  )
}
