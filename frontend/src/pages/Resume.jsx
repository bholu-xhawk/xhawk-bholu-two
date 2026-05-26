import React from 'react'
import { motion } from "framer-motion"

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

export default function Resume() {
  return (
    <motion.main
      className="page"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <h1>Resume</h1>
      <p>Download a PDF version of my resume or view the highlights below.</p>
      <div className="actions">
        <a className="button" href="#" onClick={e => e.preventDefault()}>Download PDF</a>
      </div>
      <ul>
        <li>5+ years building web apps</li>
        <li>Specialized in React and motion design</li>
        <li>Comfortable across the stack</li>
      </ul>
    </motion.main>
  )
}
