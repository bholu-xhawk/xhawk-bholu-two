import React, { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState('')

  async function load() {
    setNotifications(await api.get('/notifications'))
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function markRead(id) {
    const updated = await api.patch(`/notifications/${id}/read`, {})
    setNotifications((current) => current.map((item) => item._id === id ? updated : item))
  }

  return (
    <main className="page-container">
      <section className="hero-card compact">
        <p className="eyebrow">Reminders</p>
        <h1>Notifications</h1>
      </section>
      {error && <p className="error">{error}</p>}
      <section className="card">
        {notifications.length === 0 ? <p className="muted">No reminders yet.</p> : (
          <ul className="clean-list notification-list">
            {notifications.map((notification) => (
              <li key={notification._id} className={notification.unread ? 'unread' : ''}>
                <div><strong>{notification.title}</strong><p>{notification.message}</p></div>
                {notification.unread && <button type="button" className="secondary" onClick={() => markRead(notification._id)}>Mark read</button>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
