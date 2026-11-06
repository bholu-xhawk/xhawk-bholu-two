import React, { useEffect, useState } from 'react'
import { clearCompletedTodos, createTodo, deleteTodo, listTodos, updateTodo } from '../api/todos'

export default function Todos() {
  const [todos, setTodos] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState(null)

  useEffect(() => {
    let ignore = false

    async function loadTodos() {
      setLoading(true)
      setError('')
      try {
        const loadedTodos = await listTodos()
        if (!ignore) setTodos(loadedTodos)
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

  function replaceTodo(updatedTodo) {
    setTodos((currentTodos) => currentTodos.map((todo) => (todo._id === updatedTodo._id ? updatedTodo : todo)))
  }

  async function handleCreate(event) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) {
      setError('Enter a todo title before adding it.')
      return
    }

    setPendingAction('create')
    setError('')
    try {
      const createdTodo = await createTodo(title)
      setTodos((currentTodos) => [createdTodo, ...currentTodos])
      setNewTitle('')
    } catch (err) {
      setError(err.message || 'Unable to create todo')
    } finally {
      setPendingAction(null)
    }
  }

  function beginEdit(todo) {
    setEditingId(todo._id)
    setEditingTitle(todo.title)
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingTitle('')
    setError('')
  }

  async function handleSave(todo) {
    const title = editingTitle.trim()
    if (!title) {
      setError('Enter a todo title before saving it.')
      return
    }

    setPendingAction(`edit:${todo._id}`)
    setError('')
    try {
      const updatedTodo = await updateTodo(todo._id, { title })
      replaceTodo(updatedTodo)
      setEditingId(null)
      setEditingTitle('')
    } catch (err) {
      setError(err.message || 'Unable to update todo')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleToggle(todo) {
    setPendingAction(`toggle:${todo._id}`)
    setError('')
    try {
      const updatedTodo = await updateTodo(todo._id, { completed: !todo.completed })
      replaceTodo(updatedTodo)
    } catch (err) {
      setError(err.message || 'Unable to update todo')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleDelete(todo) {
    const confirmed = window.confirm(`Delete "${todo.title}"?`)
    if (!confirmed) return

    setPendingAction(`delete:${todo._id}`)
    setError('')
    try {
      await deleteTodo(todo._id)
      setTodos((currentTodos) => currentTodos.filter((currentTodo) => currentTodo._id !== todo._id))
      if (editingId === todo._id) cancelEdit()
    } catch (err) {
      setError(err.message || 'Unable to delete todo')
    } finally {
      setPendingAction(null)
    }
  }

  const createPending = pendingAction === 'create'
  const clearCompletedPending = pendingAction === 'clear-completed'
  const completedCount = todos.filter((todo) => todo.completed).length
  const hasCompletedTodos = completedCount > 0
  const controlsDisabled = Boolean(pendingAction)

  async function handleClearCompleted() {
    if (!hasCompletedTodos) return

    const confirmed = window.confirm(`Clear ${completedCount} completed ${completedCount === 1 ? 'todo' : 'todos'}?`)
    if (!confirmed) return

    setPendingAction('clear-completed')
    setError('')
    try {
      await clearCompletedTodos()
      setTodos((currentTodos) => currentTodos.filter((todo) => !todo.completed))
      if (editingId && todos.some((todo) => todo._id === editingId && todo.completed)) {
        cancelEdit()
      }
    } catch (err) {
      setError(err.message || 'Unable to clear completed todos')
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <main className="todo-page" aria-labelledby="todo-title">
      <section className="todo-hero">
        <p className="eyebrow">MongoDB backed task list</p>
        <h1 id="todo-title">Todos</h1>
        <p>Capture tasks, mark them complete, and keep them persisted through the existing Express API.</p>
      </section>

      <form className="todo-create-form" onSubmit={handleCreate} aria-label="Create todo">
        <label htmlFor="new-todo">New todo</label>
        <div className="todo-create-row">
          <input
            id="new-todo"
            type="text"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="What needs to be done?"
            disabled={createPending}
          />
          <button type="submit" disabled={createPending}>
            {createPending ? 'Adding…' : 'Add todo'}
          </button>
        </div>
      </form>

      {error && (
        <div className="todo-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="todo-status">Loading todos…</p>
      ) : todos.length === 0 ? (
        <p className="todo-empty">No todos yet. Add your first task above.</p>
      ) : (
        <section className="todo-list-panel" aria-label="Todos">
          <div className="todo-toolbar">
            <p>
              {completedCount} of {todos.length} complete
            </p>
            <button
              type="button"
              className="danger todo-clear-completed"
              onClick={handleClearCompleted}
              disabled={!hasCompletedTodos || controlsDisabled}
              aria-label="Clear completed"
            >
              {clearCompletedPending ? 'Clearing…' : 'Clear completed'}
            </button>
          </div>
          <ul className="todo-list" aria-label="Todo list">
            {todos.map((todo) => {
              const isEditing = editingId === todo._id
              const editPending = pendingAction === `edit:${todo._id}`
              const deletePending = pendingAction === `delete:${todo._id}`

              return (
                <li className={`todo-item${todo.completed ? ' completed' : ''}`} key={todo._id}>
                  <label className="todo-check">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggle(todo)}
                      disabled={controlsDisabled}
                    />
                    <span>{todo.completed ? 'Completed' : 'Incomplete'}</span>
                  </label>

                  <div className="todo-content">
                    {isEditing ? (
                      <label className="sr-only" htmlFor={`edit-${todo._id}`}>
                        Edit {todo.title}
                      </label>
                    ) : null}
                    {isEditing ? (
                      <input
                        id={`edit-${todo._id}`}
                        className="todo-edit-input"
                        type="text"
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        disabled={controlsDisabled}
                      />
                    ) : (
                      <span className="todo-title">{todo.title}</span>
                    )}
                  </div>

                  <div className="todo-actions">
                    {isEditing ? (
                      <>
                        <button type="button" onClick={() => handleSave(todo)} disabled={controlsDisabled}>
                          {editPending ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" className="secondary" onClick={cancelEdit} disabled={controlsDisabled}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button type="button" className="secondary" onClick={() => beginEdit(todo)} disabled={controlsDisabled}>
                        Edit
                      </button>
                    )}
                    <button type="button" className="danger" onClick={() => handleDelete(todo)} disabled={controlsDisabled}>
                      {deletePending ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </main>
  )
}
