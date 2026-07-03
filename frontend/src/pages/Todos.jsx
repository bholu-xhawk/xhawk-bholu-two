import React, { useEffect, useState } from 'react'

const API_BASE = 'http://127.0.0.1:8000/todos'

function Todos() {
  const [items, setItems] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await fetch(API_BASE)
      const data = await r.json()
      setItems(data)
    } catch (e) {
      setError('Failed to load todos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const addTodo = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setError('')
    try {
      const r = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      if (!r.ok) throw new Error('Failed to create')
      setText('')
      await load()
    } catch (e) {
      setError('Failed to create todo')
    }
  }

  const toggle = async (id, completed) => {
    setError('')
    try {
      const r = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      })
      if (!r.ok) throw new Error('Failed to update')
      await load()
    } catch (e) {
      setError('Failed to update todo')
    }
  }

  const remove = async (id) => {
    setError('')
    try {
      const r = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('Failed to delete')
      await load()
    } catch (e) {
      setError('Failed to delete todo')
    }
  }

  return (
    <div className="todos-page">
      <h1>Todos</h1>
      <form onSubmit={addTodo} className="todo-form">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a todo"
        />
        <button type="submit">Add</button>
      </form>
      {error && <div className="error" style={{ color: 'red' }}>{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul className="todo-list">
          {items.map((t) => (
            <li key={t.id} className={t.completed ? 'completed' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={(e) => toggle(t.id, e.target.checked)}
                />
                <span style={{ marginLeft: '8px' }}>{t.text}</span>
              </label>
              <button style={{ marginLeft: '12px' }} onClick={() => remove(t.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Todos
