import React, { useState } from 'react'

export default function MemberList({ group, onAddMember }) {
  const [email, setEmail] = useState('')

  async function submit(event) {
    event.preventDefault()
    await onAddMember(email)
    setEmail('')
  }

  return (
    <section className="card">
      <h2>Members</h2>
      <ul className="clean-list">
        {group.members.map((member) => (
          <li key={member.user._id || member.user}>
            <span>{member.user.name || member.user.email || member.user}</span>
            <span className="pill">{member.role}</span>
          </li>
        ))}
      </ul>
      <form className="inline-form" onSubmit={submit}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@example.com" required />
        <button type="submit">Add</button>
      </form>
    </section>
  )
}
