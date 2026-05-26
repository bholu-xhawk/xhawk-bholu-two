import React from 'react'
import { Link, NavLink } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">My Portfolio</Link>
      </div>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : undefined}>Home</NavLink>
        <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : undefined}>About</NavLink>
        <NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : undefined}>Projects</NavLink>
        <NavLink to="/skills" className={({ isActive }) => isActive ? 'active' : undefined}>Skills</NavLink>
        <NavLink to="/experience" className={({ isActive }) => isActive ? 'active' : undefined}>Experience</NavLink>
        <NavLink to="/blog" className={({ isActive }) => isActive ? 'active' : undefined}>Blog</NavLink>
        <NavLink to="/resume" className={({ isActive }) => isActive ? 'active' : undefined}>Resume</NavLink>
        <NavLink to="/setup" className={({ isActive }) => isActive ? 'active' : undefined}>Setup</NavLink>
        <NavLink to="/contact" className={({ isActive }) => isActive ? 'active' : undefined}>Contact</NavLink>
      </div>
    </nav>
  )
}

export default Navbar
