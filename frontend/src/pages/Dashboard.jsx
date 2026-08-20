import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import GroupForm from '../components/GroupForm'

export default function Dashboard() {
  const [groups, setGroups] = useState([])
  const [error, setError] = useState('')

  async function loadGroups() {
    const data = await api.get('/groups')
    setGroups(data)
  }

  useEffect(() => {
    loadGroups().catch((err) => setError(err.message))
  }, [])

  async function createGroup(payload) {
    try {
      const group = await api.post('/groups', payload)
      setGroups((current) => [group, ...current])
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="page-container">
      <section className="hero-card">
        <p className="eyebrow">Shared expenses</p>
        <h1>Know who owes what.</h1>
        <p>Create groups, add expenses, and settle simplified balances without spreadsheets.</p>
      </section>
      {error && <p className="error">{error}</p>}
      <div className="two-column">
        <GroupForm onCreate={createGroup} />
        <section className="card">
          <h2>Your groups</h2>
          {groups.length === 0 ? <p className="muted">No groups yet. Start with roommates, a trip, or dinner crew.</p> : (
            <ul className="group-list">
              {groups.map((group) => (
                <li key={group._id}>
                  <Link to={`/groups/${group._id}`}>
                    <span>{group.name}</span>
                    <small>{group.members.length} members · {group.baseCurrency}</small>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
