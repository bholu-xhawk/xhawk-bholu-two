import React from 'react'
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import TodoList from './TodoList'

afterEach(() => {
  cleanup()
})

const addTodo = (text) => {
  fireEvent.change(screen.getByLabelText(/new todo/i), {
    target: { value: text },
  })
  fireEvent.click(screen.getByRole('button', { name: /add todo/i }))
}

describe('TodoList', () => {
  it('adds a trimmed todo and ignores blank submissions', () => {
    render(<TodoList />)

    expect(screen.getByRole('button', { name: /delete selected/i })).toBeDisabled()
    addTodo('   ')
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument()

    addTodo('  Write tests  ')

    expect(screen.getByText('Write tests')).toBeInTheDocument()
    expect(screen.getByLabelText(/new todo/i)).toHaveValue('')
    expect(screen.queryByText('  Write tests  ')).not.toBeInTheDocument()
  })

  it('deletes a single todo item', () => {
    render(<TodoList />)

    addTodo('Buy milk')
    addTodo('Read docs')
    fireEvent.click(screen.getByRole('button', { name: /delete buy milk/i }))

    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    expect(screen.getByText('Read docs')).toBeInTheDocument()
  })

  it('deletes all selected todos and leaves unselected todos', () => {
    render(<TodoList />)

    addTodo('First task')
    addTodo('Second task')
    addTodo('Third task')

    fireEvent.click(screen.getByRole('checkbox', { name: 'First task' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Third task' }))

    const bulkDeleteButton = screen.getByRole('button', { name: /delete selected/i })
    expect(screen.getByText('2 selected')).toBeInTheDocument()
    expect(bulkDeleteButton).toBeEnabled()

    fireEvent.click(bulkDeleteButton)

    expect(screen.queryByText('First task')).not.toBeInTheDocument()
    expect(screen.getByText('Second task')).toBeInTheDocument()
    expect(screen.queryByText('Third task')).not.toBeInTheDocument()
    expect(bulkDeleteButton).toBeDisabled()
  })
})
