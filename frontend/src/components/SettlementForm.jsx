import React, { useState } from 'react'

export default function SettlementForm({ balances, onSettle }) {
  const first = balances[0]
  const [balanceKey, setBalanceKey] = useState(first ? `${first.from}:${first.to}` : '')
  const [amount, setAmount] = useState(first ? (first.amountMinor / 100).toFixed(2) : '')

  function selectedBalance() {
    return balances.find((balance) => `${balance.from}:${balance.to}` === balanceKey) || balances[0]
  }

  async function submit(event) {
    event.preventDefault()
    const balance = selectedBalance()
    if (!balance) return
    await onSettle({ from: balance.from, to: balance.to, amountMinor: Math.round(Number(amount) * 100) })
  }

  if (balances.length === 0) return null

  return (
    <form className="card form-card" onSubmit={submit}>
      <h2>Record settlement</h2>
      <label>Debt<select value={balanceKey} onChange={(e) => setBalanceKey(e.target.value)}>{balances.map((balance) => <option key={`${balance.from}:${balance.to}`} value={`${balance.from}:${balance.to}`}>{balance.fromName} → {balance.toName}</option>)}</select></label>
      <label>Amount<input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
      <button type="submit">Record payment</button>
    </form>
  )
}
