import React, { useEffect, useMemo, useState } from 'react'

const DEFAULT_ITEMS_PER_PAGE = 5

export default function BookList({ books = [], itemsPerPage = DEFAULT_ITEMS_PER_PAGE }) {
  const safeBooks = Array.isArray(books) ? books : []
  const pageSize = Math.max(1, Number(itemsPerPage) || DEFAULT_ITEMS_PER_PAGE)
  const totalPages = Math.max(1, Math.ceil(safeBooks.length / pageSize))
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(page => Math.min(Math.max(page, 1), totalPages))
  }, [totalPages])

  const visibleBooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return safeBooks.slice(start, start + pageSize)
  }, [currentPage, pageSize, safeBooks])

  if (safeBooks.length === 0) {
    return (
      <section className="book-list" aria-label="Book list">
        <p className="book-list__empty">No books are available yet.</p>
      </section>
    )
  }

  return (
    <section className="book-list" aria-label="Book list">
      <div className="book-list__table-wrapper">
        <table className="book-list__table">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Author</th>
              <th scope="col">Genre</th>
              <th scope="col">Published Date</th>
            </tr>
          </thead>
          <tbody>
            {visibleBooks.map(book => (
              <tr key={`${book.title}-${book.author}-${book.publishedDate}`}>
                <td data-label="Title">{book.title}</td>
                <td data-label="Author">{book.author}</td>
                <td data-label="Genre">{book.genre}</td>
                <td data-label="Published Date">{book.publishedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="book-list__pagination" aria-label="Book pagination">
        <button
          type="button"
          onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => {
          const pageNumber = index + 1
          return (
            <button
              type="button"
              key={pageNumber}
              className={pageNumber === currentPage ? 'active' : undefined}
              aria-current={pageNumber === currentPage ? 'page' : undefined}
              onClick={() => setCurrentPage(pageNumber)}
            >
              {pageNumber}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </nav>
    </section>
  )
}
