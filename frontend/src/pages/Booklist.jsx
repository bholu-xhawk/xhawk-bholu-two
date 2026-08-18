import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { bulkDeleteBooks, createBook, deleteBook, fetchBooks, updateBook } from '../lib/api'

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
}

const initialForm = {
  title: '',
  author: '',
  genre: '',
  year: '',
  status: 'to-read',
  rating: '',
  description: '',
  imageUrl: '',
}

const statuses = [
  { value: 'to-read', label: 'To read' },
  { value: 'reading', label: 'Reading' },
  { value: 'finished', label: 'Finished' },
]

function normalizeBookForm(form) {
  const payload = {
    title: form.title.trim(),
    author: form.author.trim(),
    genre: form.genre.trim(),
    status: form.status,
    description: form.description.trim(),
    imageUrl: form.imageUrl.trim(),
  }

  payload.year = form.year === '' ? null : Number(form.year)
  payload.rating = form.rating === '' ? null : Number(form.rating)

  return payload
}

function bookToForm(book) {
  return {
    title: book.title || '',
    author: book.author || '',
    genre: book.genre || '',
    year: book.year ?? '',
    status: book.status || 'to-read',
    rating: book.rating ?? '',
    description: book.description || '',
    imageUrl: book.imageUrl || '',
  }
}

function BookFormFields({ form, onChange, prefix = 'book' }) {
  const fieldId = (name) => `${prefix}-${name}`

  return (
    <>
      <label htmlFor={fieldId('title')}>
        Title
        <input id={fieldId('title')} name="title" value={form.title} onChange={onChange} required />
      </label>
      <label htmlFor={fieldId('author')}>
        Author
        <input id={fieldId('author')} name="author" value={form.author} onChange={onChange} required />
      </label>
      <label htmlFor={fieldId('genre')}>
        Genre
        <input id={fieldId('genre')} name="genre" value={form.genre} onChange={onChange} />
      </label>
      <label htmlFor={fieldId('year')}>
        Year
        <input id={fieldId('year')} name="year" type="number" value={form.year} onChange={onChange} />
      </label>
      <label htmlFor={fieldId('status')}>
        Status
        <select id={fieldId('status')} name="status" value={form.status} onChange={onChange}>
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </label>
      <label htmlFor={fieldId('rating')}>
        Rating
        <input id={fieldId('rating')} name="rating" type="number" min="0" max="5" step="0.5" value={form.rating} onChange={onChange} />
      </label>
      <label className="span-two" htmlFor={fieldId('imageUrl')}>
        Image URL
        <input id={fieldId('imageUrl')} name="imageUrl" value={form.imageUrl} onChange={onChange} placeholder="https://example.com/book-cover.jpg" />
      </label>
      <label className="span-two" htmlFor={fieldId('description')}>
        Description
        <textarea id={fieldId('description')} name="description" rows="3" value={form.description} onChange={onChange} />
      </label>
    </>
  )
}

export default function Booklist() {
  const [books, setBooks] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editForm, setEditForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadBooks() {
    setLoading(true)
    setError('')
    try {
      const nextBooks = await fetchBooks()
      setBooks(nextBooks)
      setSelectedIds((current) => current.filter((id) => nextBooks.some((book) => book._id === id)))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBooks()
  }, [])

  const allSelected = useMemo(() => books.length > 0 && selectedIds.length === books.length, [books, selectedIds])

  function handleFormChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleEditChange(event) {
    const { name, value } = event.target
    setEditForm((current) => ({ ...current, [name]: value }))
  }

  async function handleCreate(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const created = await createBook(normalizeBookForm(form))
      setBooks((current) => [...current, created].sort((a, b) => a.title.localeCompare(b.title)))
      setForm(initialForm)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function startEditing(book) {
    setEditingId(book._id)
    setEditForm(bookToForm(book))
  }

  async function handleUpdate(event, id) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updated = await updateBook(id, normalizeBookForm(editForm))
      setBooks((current) => current.map((book) => (book._id === id ? updated : book)))
      setEditingId(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(book) {
    if (!window.confirm(`Delete "${book.title}"?`)) return
    setError('')
    try {
      await deleteBook(book._id)
      setBooks((current) => current.filter((item) => item._id !== book._id))
      setSelectedIds((current) => current.filter((id) => id !== book._id))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Delete ${selectedIds.length} selected book${selectedIds.length === 1 ? '' : 's'}?`)) return
    setError('')
    try {
      await bulkDeleteBooks(selectedIds)
      setBooks((current) => current.filter((book) => !selectedIds.includes(book._id)))
      setSelectedIds([])
    } catch (err) {
      setError(err.message)
    }
  }

  function toggleSelected(id) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : books.map((book) => book._id))
  }

  return (
    <motion.main className="page" initial="hidden" animate="show" exit="exit" variants={container}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Library</p>
          <h1>Booklist</h1>
        </div>
        <button className="secondary-button" type="button" onClick={loadBooks}>Refresh</button>
      </div>

      {error && <div className="alert error" role="alert">{error}</div>}

      <section className="card book-form-card" aria-labelledby="add-book-heading">
        <h2 id="add-book-heading">Add a book</h2>
        <form className="book-form" onSubmit={handleCreate}>
          <BookFormFields form={form} onChange={handleFormChange} prefix="new-book" />
          <div className="form-actions span-two">
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create book'}</button>
          </div>
        </form>
      </section>

      <section className="card book-table-card" aria-labelledby="books-heading">
        <div className="table-toolbar">
          <div>
            <h2 id="books-heading">Books</h2>
            <p>{selectedIds.length} selected</p>
          </div>
          <button className="danger-button" type="button" disabled={selectedIds.length === 0} onClick={handleBulkDelete}>Delete selected</button>
        </div>

        {loading ? (
          <div className="loading-state">Loading books...</div>
        ) : books.length === 0 ? (
          <div className="empty-state">No books yet. Add one above to start your library.</div>
        ) : (
          <div className="table-wrap">
            <table className="book-table">
              <thead>
                <tr>
                  <th scope="col"><input aria-label="Select all books" type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
                  <th scope="col">Title</th>
                  <th scope="col">Author</th>
                  <th scope="col">Genre</th>
                  <th scope="col">Year</th>
                  <th scope="col">Status</th>
                  <th scope="col">Rating</th>
                  <th scope="col">Image</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book._id}>
                    <td><input aria-label={`Select ${book.title}`} type="checkbox" checked={selectedIds.includes(book._id)} onChange={() => toggleSelected(book._id)} /></td>
                    {editingId === book._id ? (
                      <td colSpan="8">
                        <form className="book-form edit-book-form" onSubmit={(event) => handleUpdate(event, book._id)}>
                          <BookFormFields form={editForm} onChange={handleEditChange} prefix={`edit-${book._id}`} />
                          <div className="form-actions span-two">
                            <button className="primary-button" type="submit" disabled={saving}>Save changes</button>
                            <button className="secondary-button" type="button" onClick={() => setEditingId(null)}>Cancel</button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td><Link to={`/booklist/${book._id}`}>{book.title}</Link></td>
                        <td>{book.author}</td>
                        <td>{book.genre || '—'}</td>
                        <td>{book.year || '—'}</td>
                        <td><span className="status-pill">{book.status}</span></td>
                        <td>{book.rating ?? '—'}</td>
                        <td>{book.imageUrl ? 'Available' : 'Placeholder'}</td>
                        <td>
                          <div className="row-actions">
                            <Link className="secondary-link" to={`/booklist/${book._id}`}>View</Link>
                            <button className="secondary-button" type="button" onClick={() => startEditing(book)}>Edit</button>
                            <button className="danger-button" type="button" onClick={() => handleDelete(book)}>Delete</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </motion.main>
  )
}
