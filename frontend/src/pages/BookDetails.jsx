import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchBook } from '../lib/api'

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
}

export default function BookDetails() {
  const { id } = useParams()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    let active = true

    async function loadBook() {
      setLoading(true)
      setError('')
      setImageFailed(false)
      try {
        const nextBook = await fetchBook(id)
        if (active) setBook(nextBook)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadBook()

    return () => {
      active = false
    }
  }, [id])

  return (
    <motion.main className="page" initial="hidden" animate="show" exit="exit" variants={container}>
      <Link className="back-link" to="/booklist">← Back to Booklist</Link>

      {loading && <div className="loading-state">Loading book...</div>}
      {error && <div className="alert error" role="alert">{error === 'not found' ? 'Book not found.' : error}</div>}

      {!loading && !error && book && (
        <article className="card book-details-card">
          <div className="book-cover-panel">
            {book.imageUrl && !imageFailed ? (
              <img src={book.imageUrl} alt={`${book.title} cover`} onError={() => setImageFailed(true)} />
            ) : (
              <div className="book-cover-placeholder" aria-label="Book cover placeholder">No image available</div>
            )}
          </div>
          <div className="book-details-content">
            <p className="eyebrow">Book details</p>
            <h1>{book.title}</h1>
            <p className="book-author">by {book.author}</p>
            <dl className="metadata-grid">
              <div>
                <dt>Genre</dt>
                <dd>{book.genre || '—'}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{book.year || '—'}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{book.status || '—'}</dd>
              </div>
              <div>
                <dt>Rating</dt>
                <dd>{book.rating ?? '—'}</dd>
              </div>
            </dl>
            <h2>Description</h2>
            <p>{book.description || 'No description has been added for this book yet.'}</p>
          </div>
        </article>
      )}
    </motion.main>
  )
}
