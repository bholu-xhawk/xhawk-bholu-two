import React from 'react'
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Books from './Books'

function mockJsonResponse(payload) {
  return {
    ok: true,
    json: async () => payload,
  }
}

describe('Books', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows a loading state while books are being fetched', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))

    render(<Books />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading books')
  })

  it('renders successful API data in table rows', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({
      books: [
        {
          id: 'book-1',
          title: 'The Pragmatic Programmer',
          author: 'Andrew Hunt and David Thomas',
          isbn: '978-0135957059',
          publishedDate: '2019-09-13',
          genre: 'Software Engineering',
        },
      ],
    }))

    render(<Books />)

    expect(await screen.findByRole('table', { name: /books from the book list api/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument()
    expect(screen.getByText('The Pragmatic Programmer')).toBeInTheDocument()
    expect(screen.getByText('Andrew Hunt and David Thomas')).toBeInTheDocument()
    expect(screen.getByText('978-0135957059')).toBeInTheDocument()
    expect(screen.getByText('2019-09-13')).toBeInTheDocument()
    expect(screen.getByText('Software Engineering')).toBeInTheDocument()
  })

  it('renders an empty state when the API returns no books', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ data: [] }))

    render(<Books />)

    expect(await screen.findByText('No books were found.')).toBeInTheDocument()
  })

  it('renders an error state when the API request fails', async () => {
    fetchMock.mockRejectedValue(new Error('Network down'))

    render(<Books />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Network down')
  })
})
