import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../services/auth'

const Login = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('User')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, role })
      })
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body.detail || 'Login failed')
      }
      const data = await resp.json()
      setToken(data.access_token)
      if (role === 'Superadmin') navigate('/superadmin')
      else navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="User">User</option>
            <option value="Superadmin">Superadmin</option>
          </select>
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit">Login</button>
      </form>
    </div>
  )
}

export default Login
