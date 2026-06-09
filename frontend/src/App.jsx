import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import About from './pages/About'
import Projects from './pages/Projects'
import Contact from './pages/Contact'
import Setup from './pages/Setup'
import Skills from './pages/Skills'
import Experience from './pages/Experience'
import Blog from './pages/Blog'
import Resume from './pages/Resume'

function App() {
  const location = useLocation()

  return (
    <div className="app">
      <Navbar />
      <div className="page-container">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/resume" element={<Resume />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
