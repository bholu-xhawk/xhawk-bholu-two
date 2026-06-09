import React from 'react'
import { motion } from "framer-motion"

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

export default function Skills() {
  return (
    <motion.main
      className="page"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <h1>Skills</h1>
      <p>Here are some example skills you'd list on your portfolio.</p>
      <ul>
        <li>JavaScript / TypeScript</li>
        <li>React / Redux / Framer Motion</li>
        <li>Node.js / Express</li>
        <li>CSS / Tailwind / Styled Components</li>
      </ul>
    </motion.main>
  )
}
