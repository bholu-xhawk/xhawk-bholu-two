import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { apiFetch, getToken } from '../services/auth'

const RequireSuperadmin = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      setAllowed(false)
      return
    }
    apiFetch('/api/me')
      .then(async (res) => {
        if (!res.ok) throw new Error('Unauthorized')
        const data = await res.json()
        setAllowed(data.role === 'Superadmin')
      })
      .catch(() => setAllowed(false))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading...</div>
  if (!allowed) return <Navigate to="/" replace />
  return children
}

export default RequireSuperadmin
