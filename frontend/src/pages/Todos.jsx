import React, { useEffect, useState } from 'react'

const API_BASE = 'http://127.0.0.1:8000'

function Todos() {
  const [todos, setTodos] = useState([])
  const [title, setTitle] = useState('')
  const [draftTitles, setDraftTitles] = useState({})
  const [loading, setLoading] = useState(false)

  const fetchTodos = async () => {
    const r = await fetch(`${API_BASE}/todos`)
    const data = await r.json()
    setTodos(data)
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  const addTodo = async () => {
    if (!title.trim()) return
    setLoading(true)
    await fetch(`${API_BASE}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim() })
    })
    setTitle('')
    await fetchTodos()
    setLoading(false)
  }

  const toggleCompleted = async (id, completed) => {
    await fetch(`${API_BASE}/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    })
    await fetchTodos()
  }

  const clearDraftTitle = (id, titleToClear) => {
    setDraftTitles((drafts) => {
      if (drafts[id] !== titleToClear) return drafts
      const next = { ...drafts }
      delete next[id]
      return next
    })
  }

  const updateTitle = async (id, newTitle) => {
    await fetch(`${API_BASE}/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle })
    })
    await fetchTodos()
    clearDraftTitle(id, newTitle)
  }

  const deleteTodo = async (id) => {
    await fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE' })
    await fetchTodos()
  }

  return (
    <div className="todos-page">
      <h1>Todos</h1>
      <div className="todo-input">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New todo title"
        />
        <button onClick={addTodo} disabled={loading || !title.trim()}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map((t) => (
          <li key={t.id} className="todo-item">
            <input
              type="checkbox"
              checked={t.completed}
              onChange={(e) => toggleCompleted(t.id, e.target.checked)}
            />
            <input
              type="text"
              value={draftTitles[t.id] ?? t.title}
              onChange={(e) => setDraftTitles((drafts) => ({ ...drafts, [t.id]: e.target.value }))}
              onBlur={(e) => {
                if (e.target.value !== t.title) updateTitle(t.id, e.target.value)
                else clearDraftTitle(t.id, e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
              }}
              style={{ marginLeft: '8px', marginRight: '8px' }}
            />
            <button onClick={() => deleteTodo(t.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Todos
