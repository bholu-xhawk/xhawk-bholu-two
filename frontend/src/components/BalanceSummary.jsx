import React from 'react'

function money(amountMinor, currency) {
  return `${(amountMinor / 100).toFixed(2)} ${currency}`
}

export default function BalanceSummary({ balances }) {
  return (
    <section className="card">
      <h2>Balances</h2>
      {balances.length === 0 ? (
        <p className="muted">Everyone is settled up.</p>
      ) : (
        <ul className="clean-list balance-list">
          {balances.map((balance) => (
            <li key={balance._id || `${balance.from}-${balance.to}`}>
              <strong>{balance.fromName}</strong> owes <strong>{balance.toName}</strong>
              <span className="amount">{money(balance.amountMinor, balance.currency)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
