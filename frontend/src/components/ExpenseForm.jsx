import React, { useMemo, useState } from 'react'

export default function ExpenseForm({ group, onCreate }) {
  const members = group.members.map((member) => member.user)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(members[0]?._id || '')
  const [splitType, setSplitType] = useState('equal')
  const [shares, setShares] = useState({})

  const totalMinor = useMemo(() => Math.round(Number(amount || 0) * 100), [amount])

  async function submit(event) {
    event.preventDefault()
    const payload = {
      description,
      paidBy,
      amountMinor: totalMinor,
      currency: group.baseCurrency,
      splitType,
      participants: members.map((member) => member._id),
    }
    if (splitType === 'custom') {
      payload.shares = members.map((member) => ({ user: member._id, amountMinor: Math.round(Number(shares[member._id] || 0) * 100) }))
    }
    await onCreate(payload)
    setDescription('')
    setAmount('')
    setSplitType('equal')
    setShares({})
  }

  return (
    <form className="card form-card" onSubmit={submit}>
      <h2>Add expense</h2>
      <label>Description<input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Dinner" required /></label>
      <label>Amount ({group.baseCurrency})<input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
      <label>Paid by<select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} required>{members.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}</select></label>
      <label>Split<select value={splitType} onChange={(e) => setSplitType(e.target.value)}><option value="equal">Equal</option><option value="custom">Custom shares</option></select></label>
      {splitType === 'custom' && members.map((member) => (
        <label key={member._id}>{member.name}'s share<input type="number" min="0" step="0.01" value={shares[member._id] || ''} onChange={(e) => setShares({ ...shares, [member._id]: e.target.value })} /></label>
      ))}
      <button type="submit">Save expense</button>
    </form>
  )
}
