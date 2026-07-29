import React, { useEffect, useRef, useState } from 'react'
import { motion } from "framer-motion"
import { deleteUsers, getUsers } from '../api/users'

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const selectAllRef = useRef(null)

  const selectedCount = selectedIds.length
  const allSelected = users.length > 0 && selectedCount === users.length
  const partiallySelected = selectedCount > 0 && selectedCount < users.length

  useEffect(() => {
    let active = true

    async function fetchUsers() {
      setLoading(true)
      setError('')

      try {
        const data = await getUsers()
        if (!active) return

        const nextUsers = Array.isArray(data) ? data : []
        setUsers(nextUsers)
        setSelectedIds((currentIds) => currentIds.filter((id) => nextUsers.some((user) => user._id === id)))
      } catch (err) {
        if (!active) return
        setError(err.message || 'Unable to load users')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchUsers()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = partiallySelected
    }
  }, [partiallySelected])

  function selectSingleUser(id) {
    setSelectedIds([id])
  }

  function toggleSelectedUser(event, id) {
    event.stopPropagation()
    setSelectedIds((currentIds) => (
      currentIds.includes(id)
        ? currentIds.filter((selectedId) => selectedId !== id)
        : [...currentIds, id]
    ))
  }

  function toggleAllUsers(event) {
    event.stopPropagation()
    setSelectedIds(allSelected ? [] : users.map((user) => user._id))
  }

  async function deleteSelectedUsers() {
    if (selectedIds.length === 0) return

    setDeleting(true)
    setError('')

    try {
      const idsToDelete = [...selectedIds]
      await deleteUsers(idsToDelete)
      setUsers((currentUsers) => currentUsers.filter((user) => !idsToDelete.includes(user._id)))
      setSelectedIds([])
    } catch (err) {
      setError(err.message || 'Unable to delete selected users')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.main
      className="page"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <div className="table-toolbar">
        <div>
          <h1>Users</h1>
          <p>Review users from the Node API and select one or many rows to delete.</p>
        </div>
        <button
          className="danger-button"
          type="button"
          disabled={selectedCount === 0 || deleting}
          onClick={deleteSelectedUsers}
        >
          {deleting ? 'Deleting…' : `Delete selected${selectedCount ? ` (${selectedCount})` : ''}`}
        </button>
      </div>

      {error && <div className="error-message" role="alert">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="empty-state">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="empty-state">No users found.</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th scope="col" className="checkbox-column">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    aria-label="Select all users"
                    checked={allSelected}
                    onChange={toggleAllUsers}
                  />
                </th>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelected = selectedIds.includes(user._id)

                return (
                  <tr
                    key={user._id}
                    className={isSelected ? 'selected-row' : undefined}
                    onClick={() => selectSingleUser(user._id)}
                  >
                    <td className="checkbox-column">
                      <input
                        type="checkbox"
                        aria-label={`Select ${user.name}`}
                        checked={isSelected}
                        onChange={(event) => toggleSelectedUser(event, user._id)}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </motion.main>
  )
}
