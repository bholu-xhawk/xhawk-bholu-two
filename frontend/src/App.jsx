import React from 'react'
import Navbar from './components/Navbar'
import TodoApp from './pages/TodoApp'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="page-container">
        <TodoApp />
      </main>
    </div>
  )
}

export default App
