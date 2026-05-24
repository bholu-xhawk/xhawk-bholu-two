import React from 'react'
import { motion } from "framer-motion"

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

const card = {
  hidden: { opacity: 0, y: 10 },
  show: (i = 1) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1 } }),
}

export default function Projects() {
  const items = [
    { title: 'Project One', desc: 'A cool demo project with animations.' },
    { title: 'Project Two', desc: 'Another example showcasing transitions.' },
    { title: 'Project Three', desc: 'Yet another placeholder project.' }
  ]

  return (
    <motion.main
      className="page"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <h1>Projects</h1>
      <div className="grid">
        {items.map((it, idx) => (
          <motion.div
            className="card"
            key={it.title}
            custom={idx}
            initial="hidden"
            animate="show"
            variants={card}
          >
            <h3>{it.title}</h3>
            <p>{it.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.main>
  )
}
