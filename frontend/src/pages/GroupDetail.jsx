import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import BalanceSummary from '../components/BalanceSummary'
import ExpenseForm from '../components/ExpenseForm'
import MemberList from '../components/MemberList'
import SettlementForm from '../components/SettlementForm'

export default function GroupDetail() {
  const { groupId } = useParams()
  const [group, setGroup] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [balances, setBalances] = useState([])
  const [error, setError] = useState('')

  async function loadAll() {
    const [groupData, expenseData, balanceData] = await Promise.all([
      api.get(`/groups/${groupId}`),
      api.get(`/groups/${groupId}/expenses`),
      api.get(`/groups/${groupId}/balances`),
    ])
    setGroup(groupData)
    setExpenses(expenseData)
    setBalances(balanceData)
  }

  useEffect(() => {
    loadAll().catch((err) => setError(err.message))
  }, [groupId])

  async function addMember(email) {
    const updated = await api.post(`/groups/${groupId}/members`, { email })
    setGroup(updated)
  }

  async function addExpense(payload) {
    const expense = await api.post(`/groups/${groupId}/expenses`, payload)
    setExpenses((current) => [expense, ...current])
    setBalances(await api.get(`/groups/${groupId}/balances`))
  }

  async function addSettlement(payload) {
    await api.post(`/groups/${groupId}/settlements`, payload)
    await loadAll()
  }

  async function remind() {
    await api.post(`/groups/${groupId}/notifications/reminders`, {})
    alert('Reminders created for unsettled balances.')
  }

  if (!group) return <main className="page-container"><div className="card">Loading group…</div></main>

  return (
    <main className="page-container">
      <section className="hero-card compact">
        <p className="eyebrow">{group.baseCurrency}</p>
        <h1>{group.name}</h1>
        <button type="button" className="secondary" onClick={remind}>Send in-app reminders</button>
      </section>
      {error && <p className="error">{error}</p>}
      <div className="two-column">
        <div className="stack">
          <ExpenseForm group={group} onCreate={addExpense} />
          <SettlementForm balances={balances} onSettle={addSettlement} />
        </div>
        <div className="stack">
          <BalanceSummary balances={balances} />
          <MemberList group={group} onAddMember={addMember} />
          <section className="card">
            <h2>Recent expenses</h2>
            {expenses.length === 0 ? <p className="muted">No expenses yet.</p> : (
              <ul className="clean-list">
                {expenses.map((expense) => <li key={expense._id}><span>{expense.description}</span><span className="amount">{(expense.convertedAmountMinor / 100).toFixed(2)} {expense.baseCurrency}</span></li>)}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
