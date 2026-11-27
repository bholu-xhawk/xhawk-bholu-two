import React, { useEffect, useState } from 'react'
import { listTodos } from '../api/todos'

export default function Todos() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadTodos() {
      setLoading(true)
      setError('')
      try {
        const loadedTodos = await listTodos()
        if (!ignore) setTodos(Array.isArray(loadedTodos) ? loadedTodos : [])
      } catch (err) {
        if (!ignore) setError(err.message || 'Unable to load todos')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadTodos()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <main className="todo-page" aria-labelledby="todo-title">
      <section className="todo-hero">
        <p className="eyebrow">Mocked read-only task list</p>
        <h1 id="todo-title">Todos</h1>
        <p>Browse a deterministic set of mocked todos from the Express GET endpoint. This view is read-only.</p>
      </section>

      {error && (
        <div className="todo-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="todo-status">Loading todos…</p>
      ) : todos.length === 0 ? (
        <p className="todo-empty">No mocked todos are available.</p>
      ) : (
        <ul className="todo-list" aria-label="Read-only todo list">
          {todos.map((todo) => (
            <li className={`todo-item${todo.completed ? ' completed' : ''}`} key={todo.id}>
              <div className="todo-content">
                <span className="todo-title">{todo.title}</span>
              </div>
              <span className={`todo-badge ${todo.completed ? 'completed' : 'incomplete'}`}>
                {todo.completed ? 'Completed' : 'Incomplete'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
