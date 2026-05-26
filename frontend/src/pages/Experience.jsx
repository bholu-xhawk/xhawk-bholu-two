import React from 'react'
import { motion } from "framer-motion"

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

export default function Experience() {
  return (
    <motion.main
      className="page"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <h1>Experience</h1>
      <p>A brief timeline of placeholder experience entries.</p>
      <ul>
        <li>2024 — Frontend Developer at Example Co.</li>
        <li>2022 — UI Engineer at Demo Inc.</li>
        <li>2020 — Junior Developer at Sample LLC</li>
      </ul>
    </motion.main>
  )
}
