import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchDirectoryPage } from '../api/directory'

const PAGE_SIZE = 10

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

const card = {
  hidden: { opacity: 0, y: 10 },
  show: (i = 1) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1 } }),
}

export default function Team() {
  const [page, setPage] = useState(1)
  const [directory, setDirectory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDirectory() {
      setLoading(true)
      setError('')

      try {
        const data = await fetchDirectoryPage({ page, page_size: PAGE_SIZE })
        if (active) setDirectory(data)
      } catch (_err) {
        if (active) {
          setDirectory(null)
          setError('Unable to load the team directory. Please try again later.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDirectory()

    return () => {
      active = false
    }
  }, [page])

  const users = directory?.users || []
  const pagination = directory?.pagination

  return (
    <motion.main
      className="page"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <h1>Team</h1>
      <p>Browse the public team directory by name and email domain.</p>

      {loading && <p role="status">Loading team directory...</p>}

      {!loading && error && <p role="alert">{error}</p>}

      {!loading && !error && users.length === 0 && (
        <p>No team members found.</p>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="grid" aria-label="Team directory">
          {users.map((user, idx) => (
            <motion.div
              className="card"
              key={user.id}
              custom={idx}
              initial="hidden"
              animate="show"
              variants={card}
            >
              <h3>{user.name}</h3>
              <p>Email domain: {user.emailDomain}</p>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && !error && pagination && (
        <div className="pagination-controls" aria-label="Directory pagination">
          <button
            type="button"
            onClick={() => setPage(current => Math.max(1, current - 1))}
            disabled={!pagination.has_prev}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            type="button"
            onClick={() => setPage(current => current + 1)}
            disabled={!pagination.has_next}
          >
            Next
          </button>
        </div>
      )}
    </motion.main>
  )
}
