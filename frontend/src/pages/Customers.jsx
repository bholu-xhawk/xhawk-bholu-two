import React, { useEffect, useRef, useState } from 'react'
import { listCustomers } from '../api/customers'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'company', label: 'Company' },
  { key: 'status', label: 'Status' },
  { key: 'signedUpAt', label: 'Signed up' },
]

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormatter.format(date)
}

function nextDirection(currentSort, currentDirection, columnKey) {
  if (currentSort !== columnKey) return 'asc'
  return currentDirection === 'asc' ? 'desc' : 'asc'
}

export default function Customers() {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState('signedUpAt')
  const [direction, setDirection] = useState('desc')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestIdRef = useRef(0)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  useEffect(() => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    const controller = new AbortController()

    async function loadCustomers() {
      setLoading(true)
      setError('')
      try {
        const response = await listCustomers({ search: debouncedSearch, sort, direction, page, signal: controller.signal })
        if (requestIdRef.current === requestId) {
          setResult(response)
        }
      } catch (err) {
        if (controller.signal.aborted || requestIdRef.current !== requestId) return
        setError(err.message || 'Unable to load customers')
      } finally {
        if (!controller.signal.aborted && requestIdRef.current === requestId) {
          setLoading(false)
        }
      }
    }

    loadCustomers()

    return () => {
      controller.abort()
    }
  }, [debouncedSearch, sort, direction, page, reloadKey])

  function handleSearchChange(event) {
    setSearchInput(event.target.value)
    setPage(1)
  }

  function handleSort(columnKey) {
    setDirection(nextDirection(sort, direction, columnKey))
    setSort(columnKey)
    setPage(1)
  }

  function handleRetry() {
    setReloadKey((current) => current + 1)
  }

  const hasSearch = debouncedSearch.length > 0
  const hasRows = result.items.length > 0
  const canGoPrevious = page > 1 && !loading
  const canGoNext = page < result.totalPages && !loading

  return (
    <main className="customers-page" aria-labelledby="customers-title">
      <section className="customers-hero">
        <p className="eyebrow">MongoDB customer directory</p>
        <h1 id="customers-title">Customers</h1>
        <p>Search, sort, and page through customer records served by the Express API.</p>
      </section>

      <section className="customers-toolbar" aria-label="Customer table controls">
        <label htmlFor="customer-search">Search customers</label>
        <input
          id="customer-search"
          type="search"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by name or email"
        />
      </section>

      {error ? (
        <div className="customers-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={handleRetry}>Retry</button>
        </div>
      ) : null}

      {loading ? <p className="customers-status">Loading customers…</p> : null}

      {!loading && !error && !hasRows ? (
        <p className="customers-empty">
          {hasSearch ? 'No customers match your search.' : 'No customers yet.'}
        </p>
      ) : null}

      {!error && hasRows ? (
        <>
          <div className="customers-table-wrap">
            <table className="customers-table">
              <caption>
                Showing {result.items.length} of {result.total} customers
              </caption>
              <thead>
                <tr>
                  {columns.map((column) => {
                    const isActive = sort === column.key
                    const nextSortDirection = nextDirection(sort, direction, column.key)
                    return (
                      <th key={column.key} scope="col" aria-sort={isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                        <button type="button" className="sort-button" onClick={() => handleSort(column.key)}>
                          {column.label}
                          <span aria-hidden="true"> {isActive ? (direction === 'asc' ? '▲' : '▼') : '↕'}</span>
                          <span className="sr-only">Sort {column.label} {nextSortDirection}</span>
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {result.items.map((customer) => (
                  <tr key={customer._id}>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.company}</td>
                    <td><span className="status-pill">{customer.status}</span></td>
                    <td>{formatDate(customer.signedUpAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="customers-pagination" aria-label="Customer pagination">
            <button type="button" className="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={!canGoPrevious}>
              Previous
            </button>
            <span>Page {result.page} of {Math.max(result.totalPages, 1)}</span>
            <button type="button" className="secondary" onClick={() => setPage((current) => current + 1)} disabled={!canGoNext}>
              Next
            </button>
          </nav>
        </>
      ) : null}
    </main>
  )
}
