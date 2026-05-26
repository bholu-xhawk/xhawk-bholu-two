import React from 'react'
import { motion } from "framer-motion"

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

export default function Setup() {
  return (
    <motion.main
      className="page"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <h1>Setup</h1>
      <p>This page outlines the basic setup instructions for this portfolio project.</p>
      <ol>
        <li>Install dependencies</li>
        <li>Run the development server</li>
        <li>Edit pages under src/pages to add your content</li>
      </ol>
    </motion.main>
  )
}
