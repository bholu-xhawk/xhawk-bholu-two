import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchUserDirectory } from '../api/directory'

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

export default function Team() {
  const [directory, setDirectory] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDirectory() {
      try {
        setStatus('loading')
        const result = await fetchUserDirectory({ page: 1, pageSize: 20 })
        if (!active) return
        setDirectory(result)
        setStatus('success')
      } catch (err) {
        if (!active) return
        setError(err.message || 'Unable to load team directory')
        setStatus('error')
      }
    }

    loadDirectory()

    return () => {
      active = false
    }
  }, [])

  const users = directory?.data || []
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
      <p>Browse the public team directory shared by the API.</p>

      {status === 'loading' && <p role="status">Loading team directory...</p>}

      {status === 'error' && <p role="alert">{error}</p>}

      {status === 'success' && users.length === 0 && (
        <p>No team members found.</p>
      )}

      {status === 'success' && users.length > 0 && (
        <>
          <div className="grid" aria-label="Team members">
            {users.map((user) => (
              <article className="card" key={user.id}>
                <h3>{user.name}</h3>
                <p>Email domain: {user.emailDomain}</p>
              </article>
            ))}
          </div>

          {pagination && (
            <p className="pagination-summary">
              Page {pagination.page} of {pagination.totalPages} · {pagination.totalCount} team members
            </p>
          )}
        </>
      )}
    </motion.main>
  )
}
