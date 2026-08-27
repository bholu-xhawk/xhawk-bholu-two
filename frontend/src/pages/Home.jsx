import React, { useEffect, useState } from 'react'
import { motion } from "framer-motion"
import { createTodo, deleteTodo, listTodos, updateTodoCompletion } from '../api/todos'

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

export default function Home() {
  const [todos, setTodos] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [pendingTodoId, setPendingTodoId] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadTodos() {
      try {
        const loadedTodos = await listTodos()
        if (isMounted) {
          setTodos(loadedTodos)
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load todos')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadTodos()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleAddTodo(event) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title || isCreating) return

    setIsCreating(true)
    setError('')
    try {
      const createdTodo = await createTodo(title)
      setTodos((currentTodos) => [createdTodo, ...currentTodos])
      setNewTitle('')
    } catch (err) {
      setError(err.message || 'Unable to create todo')
    } finally {
      setIsCreating(false)
    }
  }

  function getTodoId(todo) {
    return todo.id || todo._id
  }

  async function handleToggleTodo(todo) {
    if (pendingTodoId) return

    const todoId = getTodoId(todo)
    setPendingTodoId(todoId)
    setError('')
    try {
      const updatedTodo = await updateTodoCompletion(todoId, !todo.completed)
      const updatedTodoId = getTodoId(updatedTodo)
      setTodos((currentTodos) =>
        currentTodos.map((currentTodo) => (
          getTodoId(currentTodo) === updatedTodoId ? updatedTodo : currentTodo
        ))
      )
    } catch (err) {
      setError(err.message || 'Unable to update todo')
    } finally {
      setPendingTodoId(null)
    }
  }

  async function handleDeleteTodo(todo) {
    if (pendingTodoId) return

    const todoId = getTodoId(todo)
    setPendingTodoId(todoId)
    setError('')
    try {
      await deleteTodo(todoId)
      setTodos((currentTodos) => currentTodos.filter((currentTodo) => getTodoId(currentTodo) !== todoId))
    } catch (err) {
      setError(err.message || 'Unable to delete todo')
    } finally {
      setPendingTodoId(null)
    }
  }

  return (
    <motion.main
      className="page todo-page"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <section className="todo-hero">
        <p className="eyebrow">Persistent todo app</p>
        <h1>Todos</h1>
        <p>Track what needs doing and keep your list synced through the API.</p>
      </section>

      <form className="todo-form" onSubmit={handleAddTodo} aria-label="Add todo">
        <label htmlFor="new-todo">New todo</label>
        <div className="todo-form-row">
          <input
            id="new-todo"
            type="text"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Add a task"
            disabled={isCreating}
          />
          <button type="submit" disabled={isCreating || !newTitle.trim()}>
            {isCreating ? 'Adding…' : 'Add todo'}
          </button>
        </div>
      </form>

      {error ? <p className="alert" role="alert">{error}</p> : null}
      {isLoading ? <p className="status">Loading todos…</p> : null}

      {!isLoading && todos.length === 0 ? (
        <p className="empty-state">No todos yet. Add one above to get started.</p>
      ) : null}

      <ul className="todo-list" aria-label="Todo list">
        {todos.map((todo) => {
          const todoId = getTodoId(todo)
          const isPending = pendingTodoId === todoId
          return (
            <li key={todoId} className={todo.completed ? 'todo-item completed' : 'todo-item'}>
              <label>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  disabled={isPending}
                  onChange={() => handleToggleTodo(todo)}
                />
                <span>{todo.title}</span>
              </label>
              <button
                type="button"
                className="delete-button"
                disabled={isPending}
                onClick={() => handleDeleteTodo(todo)}
              >
                Delete
              </button>
            </li>
          )
        })}
      </ul>
    </motion.main>
  )
}
