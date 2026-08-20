import React, { useState } from 'react'

export default function GroupForm({ onCreate }) {
  const [name, setName] = useState('')
  const [baseCurrency, setBaseCurrency] = useState('USD')

  async function submit(event) {
    event.preventDefault()
    await onCreate({ name, baseCurrency: baseCurrency.toUpperCase() })
    setName('')
  }

  return (
    <form className="card form-card" onSubmit={submit}>
      <h2>Create a group</h2>
      <label>Group name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Roommates" required /></label>
      <label>Currency<input value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} maxLength="3" required /></label>
      <button type="submit">Create group</button>
    </form>
  )
}
