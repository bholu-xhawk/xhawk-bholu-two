import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen, waitFor, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Customers from './Customers'
import { listCustomers } from '../api/customers'

vi.mock('../api/customers', () => ({
  listCustomers: vi.fn(),
}))

const firstPage = {
  items: [
    {
      _id: 'customer-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      company: 'Analytical Engines',
      status: 'active',
      signedUpAt: '2024-01-15T00:00:00.000Z',
    },
    {
      _id: 'customer-2',
      name: 'Grace Hopper',
      email: 'grace@example.com',
      company: 'Compiler Co',
      status: 'prospect',
      signedUpAt: '2024-02-20T00:00:00.000Z',
    },
  ],
  page: 1,
  pageSize: 20,
  total: 22,
  totalPages: 2,
}

const secondPage = {
  items: [
    {
      _id: 'customer-21',
      name: 'Katherine Johnson',
      email: 'katherine@example.com',
      company: 'Orbital Math',
      status: 'active',
      signedUpAt: '2024-03-01T00:00:00.000Z',
    },
  ],
  page: 2,
  pageSize: 20,
  total: 22,
  totalPages: 2,
}

function emptyResult(overrides = {}) {
  return { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0, ...overrides }
}

function renderCustomers() {
  return render(<Customers />)
}

function waitForDebounce() {
  return new Promise((resolve) => window.setTimeout(resolve, 350))
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('Customers page', () => {
  it('shows loading, rows, formatted dates, statuses, and pagination metadata', async () => {
    listCustomers.mockResolvedValueOnce(firstPage)

    renderCustomers()

    expect(screen.getByText(/loading customers/i)).toBeInTheDocument()
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()
    expect(screen.getByText('Analytical Engines')).toBeInTheDocument()
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText(/showing 2 of 22 customers/i)).toBeInTheDocument()
    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled()
    expect(listCustomers).toHaveBeenCalledWith(expect.objectContaining({ search: '', sort: 'signedUpAt', direction: 'desc', page: 1 }))
  })

  it('distinguishes an empty database from a search with no matches', async () => {
    listCustomers.mockResolvedValueOnce(emptyResult())

    renderCustomers()
    expect(await screen.findByText(/no customers yet/i)).toBeInTheDocument()

    const user = userEvent.setup()
    listCustomers.mockResolvedValueOnce(emptyResult())
    await user.type(screen.getByLabelText(/search customers/i), 'missing')
    await act(async () => { await waitForDebounce() })

    expect(await screen.findByText(/no customers match your search/i)).toBeInTheDocument()
    expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'missing', page: 1 }))
  })

  it('debounces server search parameters and resets to page 1', async () => {
    const user = userEvent.setup()
    listCustomers.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(emptyResult({ total: 1, totalPages: 1 }))

    renderCustomers()
    await screen.findByText('Ada Lovelace')
    await user.type(screen.getByLabelText(/search customers/i), 'grace')

    expect(listCustomers).toHaveBeenCalledTimes(1)
    await act(async () => { await waitForDebounce() })

    await waitFor(() => expect(listCustomers).toHaveBeenCalledTimes(2))
    expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'grace', sort: 'signedUpAt', direction: 'desc', page: 1 }))
  })

  it('toggles sorting between ascending and descending and marks aria-sort', async () => {
    const user = userEvent.setup()
    listCustomers
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce({ ...firstPage, items: [...firstPage.items].reverse() })
      .mockResolvedValueOnce(firstPage)

    renderCustomers()
    await screen.findByText('Ada Lovelace')

    await user.click(screen.getByRole('button', { name: /name sort name asc/i }))
    await waitFor(() => expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'name', direction: 'asc', page: 1 })))
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute('aria-sort', 'ascending')

    await user.click(screen.getByRole('button', { name: /name sort name desc/i }))
    await waitFor(() => expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'name', direction: 'desc', page: 1 })))
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute('aria-sort', 'descending')
  })

  it('requests the next and previous pages', async () => {
    const user = userEvent.setup()
    listCustomers.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage).mockResolvedValueOnce(firstPage)

    renderCustomers()
    await screen.findByText('Ada Lovelace')
    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(await screen.findByText('Katherine Johnson')).toBeInTheDocument()
    expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: /previous/i }))
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }))
  })

  it('returns to the last valid page when the requested page becomes empty', async () => {
    const user = userEvent.setup()
    listCustomers
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(emptyResult({ page: 2, total: 2, totalPages: 1 }))
      .mockResolvedValueOnce({ ...firstPage, total: 2, totalPages: 1 })

    renderCustomers()
    await screen.findByText('Ada Lovelace')
    await user.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() => expect(listCustomers).toHaveBeenCalledTimes(3))
    expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }))
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument()
  })

  it('ignores stale responses from superseded requests', async () => {
    const user = userEvent.setup()
    let resolveFirst
    let resolveSecond
    listCustomers
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve }))

    renderCustomers()
    expect(screen.getByText(/loading customers/i)).toBeInTheDocument()
    await user.type(screen.getByLabelText(/search customers/i), 'newer')
    await act(async () => { await waitForDebounce() })

    await act(async () => {
      resolveSecond(secondPage)
    })
    expect(await screen.findByText('Katherine Johnson')).toBeInTheDocument()

    await act(async () => {
      resolveFirst(firstPage)
    })

    await waitFor(() => expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument())
    expect(screen.getByText('Katherine Johnson')).toBeInTheDocument()
  })

  it('shows retry after errors and reloads the current query', async () => {
    const user = userEvent.setup()
    listCustomers.mockRejectedValueOnce(new Error('API unavailable')).mockResolvedValueOnce(firstPage)

    renderCustomers()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('API unavailable')
    await user.click(within(alert).getByRole('button', { name: /retry/i }))

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(listCustomers).toHaveBeenCalledTimes(2)
  })
})
