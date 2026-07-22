import React from 'react'
import { motion } from "framer-motion"
import TodoList from '../components/TodoList'

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

export default function Todo() {
  return (
    <motion.main
      className="page"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <h1>Todos</h1>
      <p>Track quick tasks, select items, and remove completed work from your list.</p>
      <TodoList />
    </motion.main>
  )
}
