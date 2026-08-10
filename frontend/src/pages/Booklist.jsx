import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

const emptyForm = { title: '', author: '', price: '' }
const pageSize = 20

export default function Booklist() {
  const apiBaseUrl = useMemo(
    () => (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),
    []
  )
  const [books, setBooks] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${apiBaseUrl}/books?page=${page}&limit=${pageSize}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load books')
      }

      setBooks(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(Math.max(data.totalPages || 1, 1))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, page])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      price: Number(form.price),
    }

    if (!payload.title || !payload.author || !Number.isFinite(payload.price) || payload.price < 0) {
      setError('Title, author, and a non-negative price are required.')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(editingId ? `${apiBaseUrl}/books/${editingId}` : `${apiBaseUrl}/books`, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = response.status === 204 ? {} : await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to save book')
      }

      resetForm()
      if (!editingId && page !== 1) {
        setPage(1)
      } else {
        await fetchBooks()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (book) => {
    setEditingId(book._id)
    setForm({ title: book.title, author: book.author, price: String(book.price) })
    setError('')
  }

  const deleteBook = async (book) => {
    setError('')

    try {
      const response = await fetch(`${apiBaseUrl}/books/${book._id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Unable to delete book')
      }

      if (books.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await fetchBooks()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const formattedPrice = (price) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)

  return (
    <motion.main
      className="page"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <h1>Booklist</h1>
      <p>Manage your books without leaving the page.</p>

      <section className="card book-form-card">
        <h2>{editingId ? 'Edit book' : 'Add a book'}</h2>
        <form className="book-form" onSubmit={handleSubmit}>
          <label>
            Title
            <input name="title" value={form.title} onChange={handleChange} placeholder="Book title" />
          </label>
          <label>
            Author
            <input name="author" value={form.author} onChange={handleChange} placeholder="Author name" />
          </label>
          <label>
            Price
            <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="0.00" />
          </label>
          <div className="book-form-actions">
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add book'}</button>
            {editingId && <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </section>

      {error && <p className="book-message error-message">{error}</p>}
      {loading && <p className="book-message">Loading books...</p>}

      <section className="card book-table-card">
        <div className="book-table-header">
          <h2>Books</h2>
          <span>{total} total</span>
        </div>
        <div className="table-wrap">
          <table className="book-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 && !loading ? (
                <tr><td colSpan="4" className="empty-cell">No books yet.</td></tr>
              ) : books.map((book) => (
                <tr key={book._id}>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{formattedPrice(book.price)}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="secondary-button" onClick={() => startEdit(book)}>Edit</button>
                      <button type="button" className="danger-button" onClick={() => deleteBook(book)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination-controls">
          <button type="button" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page <= 1}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(current + 1, totalPages))} disabled={page >= totalPages}>Next</button>
        </div>
      </section>
    </motion.main>
  )
}
