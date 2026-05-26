import React from 'react'
import { motion } from "framer-motion"

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

export default function Blog() {
  const posts = [
    { title: 'Hello World', excerpt: 'My first placeholder post.' },
    { title: 'Animating with Framer Motion', excerpt: 'Basics of page transitions.' },
    { title: 'Routing Tips', excerpt: 'Working effectively with React Router.' }
  ]

  return (
    <motion.main
      className="page"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <h1>Blog</h1>
      <div className="grid">
        {posts.map(p => (
          <div className="card" key={p.title}>
            <h3>{p.title}</h3>
            <p>{p.excerpt}</p>
          </div>
        ))}
      </div>
    </motion.main>
  )
}
