import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import BookList from './BookList'

afterEach(() => cleanup())

const books = [
  { title: 'Book One', author: 'Author One', genre: 'Fiction', publishedDate: '2001' },
  { title: 'Book Two', author: 'Author Two', genre: 'Memoir', publishedDate: '2002' },
  { title: 'Book Three', author: 'Author Three', genre: 'History', publishedDate: '2003' },
  { title: 'Book Four', author: 'Author Four', genre: 'Fantasy', publishedDate: '2004' },
  { title: 'Book Five', author: 'Author Five', genre: 'Science', publishedDate: '2005' }
]

describe('BookList', () => {
  it('renders table headers and first-page rows', () => {
    render(<BookList books={books} itemsPerPage={2} />)

    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Author' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Genre' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Published Date' })).toBeInTheDocument()
    expect(screen.getByText('Book One')).toBeInTheDocument()
    expect(screen.getByText('Book Two')).toBeInTheDocument()
    expect(screen.queryByText('Book Three')).not.toBeInTheDocument()
  })

  it('changes visible rows with Next and Previous controls', () => {
    render(<BookList books={books} itemsPerPage={2} />)

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByText('Book One')).not.toBeInTheDocument()
    expect(screen.getByText('Book Three')).toBeInTheDocument()
    expect(screen.getByText('Book Four')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByText('Book One')).toBeInTheDocument()
    expect(screen.getByText('Book Two')).toBeInTheDocument()
    expect(screen.queryByText('Book Three')).not.toBeInTheDocument()
  })

  it('disables boundary controls at the first and last pages', () => {
    render(<BookList books={books} itemsPerPage={2} />)

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '3' }))
    expect(screen.getByText('Book Five')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('renders an empty state for an empty book list', () => {
    render(<BookList books={[]} />)

    expect(screen.getByText('No books are available yet.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
