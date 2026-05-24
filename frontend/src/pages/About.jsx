import React from 'react'
import { motion } from "framer-motion"

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

export default function About() {
  return (
    <motion.main
      className="page"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <h1>About</h1>
      <p>I'm a developer who enjoys crafting delightful UI with smooth animations.</p>
      <p>This page is a placeholder to demonstrate route transitions.</p>
    </motion.main>
  )
}
