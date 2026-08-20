import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">SettleUp</Link>
        {user && <span className="nav-user">Hi, {user.name}</span>}
      </div>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : undefined}>Groups</NavLink>
            <NavLink to="/notifications" className={({ isActive }) => isActive ? 'active' : undefined}>Alerts</NavLink>
            <button className="link-button" type="button" onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : undefined}>Log in</NavLink>
            <NavLink to="/register" className={({ isActive }) => isActive ? 'active' : undefined}>Register</NavLink>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
