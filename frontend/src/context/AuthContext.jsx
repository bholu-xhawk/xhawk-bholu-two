import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem('splitwise_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    let cancelled = false
    async function loadMe() {
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const data = await api.get('/me')
        if (!cancelled) setUser(data.user)
      } catch (_err) {
        window.localStorage.removeItem('splitwise_token')
        if (!cancelled) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadMe()
    return () => { cancelled = true }
  }, [token])

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password })
    window.localStorage.setItem('splitwise_token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  async function register(payload) {
    const data = await api.post('/auth/register', payload)
    window.localStorage.setItem('splitwise_token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  function logout() {
    window.localStorage.removeItem('splitwise_token')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(() => ({ token, user, loading, isAuthenticated: Boolean(user), login, register, logout }), [token, user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
