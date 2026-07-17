import React, { useEffect, useState } from 'react'
import { motion } from "framer-motion"

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

const booksApiUrl = import.meta.env.VITE_BOOKS_API_URL || '/api/books'

function normalizeBooks(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.books)) return payload.books
  if (Array.isArray(payload?.data)) return payload.data
  throw new Error('Book List API returned an unsupported response format.')
}

function formatAuthors(book) {
  const authors = book.author ?? book.authors
  if (Array.isArray(authors)) return authors.filter(Boolean).join(', ') || 'Unknown'
  return authors || 'Unknown'
}

function getPublished(book) {
  return book.publishedDate ?? book.published_date ?? book.publishedYear ?? book.published_year ?? book.year ?? '—'
}

function getBookKey(book, index) {
  return book.id ?? book._id ?? book.isbn ?? `${book.title ?? book.name ?? 'book'}-${index}`
}

export default function Books() {
  const [books, setBooks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchBooks() {
      try {
        const response = await fetch(booksApiUrl)
        if (!response.ok) {
          throw new Error(`Book List API request failed with status ${response.status}`)
        }

        const data = await response.json()
        const normalizedBooks = normalizeBooks(data)

        if (isMounted) {
          setBooks(normalizedBooks)
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          setBooks([])
          setError(err.message || 'Unable to load books right now.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchBooks()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <motion.main
      className="page"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <h1>Books</h1>
      <p>Browse the current Book List API collection.</p>

      {isLoading && <div className="status-message" role="status">Loading books…</div>}

      {!isLoading && error && (
        <div className="status-message error" role="alert">
          {error}
        </div>
      )}

      {!isLoading && !error && books.length === 0 && (
        <div className="status-message empty" role="status">No books were found.</div>
      )}

      {!isLoading && !error && books.length > 0 && (
        <div className="table-wrapper">
          <table className="books-table">
            <caption className="sr-only">Books from the Book List API</caption>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Author</th>
                <th scope="col">ISBN</th>
                <th scope="col">Published</th>
                <th scope="col">Category/Genre</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book, index) => (
                <tr key={getBookKey(book, index)}>
                  <td>{book.title ?? book.name ?? 'Untitled'}</td>
                  <td>{formatAuthors(book)}</td>
                  <td>{book.isbn ?? '—'}</td>
                  <td>{getPublished(book)}</td>
                  <td>{book.genre ?? book.category ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.main>
  )
}
