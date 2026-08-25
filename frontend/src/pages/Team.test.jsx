import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Team from './Team'
import { fetchDirectoryPage } from '../api/directory'

vi.mock('framer-motion', () => ({
  motion: {
    main: ({ children, initial, animate, exit, variants, ...props }) => <main {...props}>{children}</main>,
    div: ({ children, initial, animate, variants, custom, ...props }) => <div {...props}>{children}</div>,
  },
}))

vi.mock('../api/directory', () => ({
  fetchDirectoryPage: vi.fn(),
}))

describe('Team page', () => {
  beforeEach(() => {
    fetchDirectoryPage.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows a loading state on initial render', () => {
    fetchDirectoryPage.mockReturnValue(new Promise(() => {}))

    render(<Team />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading team directory...')
  })

  it('renders directory names and email domains without full email addresses', async () => {
    fetchDirectoryPage.mockResolvedValue({
      users: [
        { id: 1, name: 'Alice Adams', emailDomain: 'example.com' },
        { id: 2, name: 'Bob Brown', emailDomain: 'example.org' },
      ],
      pagination: { page: 1, page_size: 10, total: 2, total_pages: 1, has_next: false, has_prev: false },
    })

    render(<Team />)

    expect(await screen.findByText('Alice Adams')).toBeInTheDocument()
    expect(screen.getByText('Bob Brown')).toBeInTheDocument()
    expect(screen.getByText('Email domain: example.com')).toBeInTheDocument()
    expect(screen.queryByText(/alice@example\.com/i)).not.toBeInTheDocument()
    expect(fetchDirectoryPage).toHaveBeenCalledWith({ page: 1, page_size: 10 })
  })

  it('shows an error state when the directory request fails', async () => {
    fetchDirectoryPage.mockRejectedValue(new Error('failed'))

    render(<Team />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load the team directory')
  })

  it('shows an empty state when there are no users', async () => {
    fetchDirectoryPage.mockResolvedValue({
      users: [],
      pagination: { page: 1, page_size: 10, total: 0, total_pages: 0, has_next: false, has_prev: false },
    })

    render(<Team />)

    expect(await screen.findByText('No team members found.')).toBeInTheDocument()
  })

  it('loads the next and previous pages from pagination controls', async () => {
    const user = userEvent.setup()
    fetchDirectoryPage
      .mockResolvedValueOnce({
        users: [{ id: 1, name: 'Alice Adams', emailDomain: 'example.com' }],
        pagination: { page: 1, page_size: 10, total: 11, total_pages: 2, has_next: true, has_prev: false },
      })
      .mockResolvedValueOnce({
        users: [{ id: 11, name: 'Zoe Zimmer', emailDomain: 'example.net' }],
        pagination: { page: 2, page_size: 10, total: 11, total_pages: 2, has_next: false, has_prev: true },
      })
      .mockResolvedValueOnce({
        users: [{ id: 1, name: 'Alice Adams', emailDomain: 'example.com' }],
        pagination: { page: 1, page_size: 10, total: 11, total_pages: 2, has_next: true, has_prev: false },
      })

    render(<Team />)

    expect(await screen.findByText('Alice Adams')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByText('Zoe Zimmer')).toBeInTheDocument()
    await waitFor(() => expect(fetchDirectoryPage).toHaveBeenLastCalledWith({ page: 2, page_size: 10 }))
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Previous' }))

    expect(await screen.findByText('Alice Adams')).toBeInTheDocument()
    await waitFor(() => expect(fetchDirectoryPage).toHaveBeenLastCalledWith({ page: 1, page_size: 10 }))
  })
})
