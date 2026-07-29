import React from 'react'
import { motion } from "framer-motion"
import BookList from '../components/BookList'

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

const sampleBooks = [
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', genre: 'Science Fiction', publishedDate: '1969' },
  { title: 'Kindred', author: 'Octavia E. Butler', genre: 'Historical Fiction', publishedDate: '1979' },
  { title: 'Beloved', author: 'Toni Morrison', genre: 'Literary Fiction', publishedDate: '1987' },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy', publishedDate: '1937' },
  { title: 'Pachinko', author: 'Min Jin Lee', genre: 'Historical Fiction', publishedDate: '2017' },
  { title: 'The Overstory', author: 'Richard Powers', genre: 'Literary Fiction', publishedDate: '2018' },
  { title: 'Station Eleven', author: 'Emily St. John Mandel', genre: 'Dystopian Fiction', publishedDate: '2014' },
  { title: 'The Night Watchman', author: 'Louise Erdrich', genre: 'Historical Fiction', publishedDate: '2020' },
  { title: 'Circe', author: 'Madeline Miller', genre: 'Fantasy', publishedDate: '2018' },
  { title: 'The Nickel Boys', author: 'Colson Whitehead', genre: 'Historical Fiction', publishedDate: '2019' },
  { title: 'Sea of Tranquility', author: 'Emily St. John Mandel', genre: 'Science Fiction', publishedDate: '2022' },
  { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', genre: 'Contemporary Fiction', publishedDate: '2022' }
]

export default function Books() {
  return (
    <motion.main
      className="page"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <h1>Books</h1>
      <p>Browse a sample reading list with client-side pagination.</p>
      <BookList books={sampleBooks} itemsPerPage={5} />
    </motion.main>
  )
}
