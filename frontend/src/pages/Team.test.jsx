import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Team from './Team'

describe('Team page', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading and then team members with pagination metadata', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [
          { id: 'user-1', name: 'Ada Lovelace', emailDomain: 'example.com' },
          { id: 'user-2', name: 'Grace Hopper', emailDomain: 'navy.mil' }
        ],
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPages: 1 }
      })
    })

    render(<Team />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading team directory')

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
    expect(screen.getByText('Email domain: example.com')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 1 · 2 team members')).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith('/directory/users?page=1&pageSize=20')
  })

  it('renders an empty state when no users are returned', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [],
        pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }
      })
    })

    render(<Team />)

    expect(await screen.findByText('No team members found.')).toBeInTheDocument()
  })

  it('renders an error state when the directory request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 502 })

    render(<Team />)

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch user directory: 502'))
  })
})
