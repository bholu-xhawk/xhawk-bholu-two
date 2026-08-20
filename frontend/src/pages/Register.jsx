import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { isAuthenticated, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', defaultCurrency: 'USD' })
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      await register({ ...form, defaultCurrency: form.defaultCurrency.toUpperCase() })
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <main className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <p className="eyebrow">Split expenses fairly</p>
        <h1>Create your account</h1>
        {error && <p className="error">{error}</p>}
        <label>Name<input value={form.name} onChange={(e) => update('name', e.target.value)} required /></label>
        <label>Email<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required /></label>
        <label>Password<input type="password" minLength="8" value={form.password} onChange={(e) => update('password', e.target.value)} required /></label>
        <label>Default currency<input maxLength="3" value={form.defaultCurrency} onChange={(e) => update('defaultCurrency', e.target.value)} required /></label>
        <button type="submit">Register</button>
        <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </main>
  )
}
