import { useState } from 'react'
import './App.css'

function Dashboard() {
  const [budget, setBudget] = useState(50000)
  const [expenses, setExpenses] = useState([
    { amount: 5000, category: "Food", date: new Date().toISOString() },
    { amount: 2000, category: "Transport", date: new Date().toISOString() },
  ])

  const [newAmount, setNewAmount] = useState("")
  const [newCategory, setNewCategory] = useState("")

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const remaining = budget - total

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const thisMonthExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    return (
      expenseDate.getMonth() === currentMonth &&
      expenseDate.getFullYear() === currentYear
    )
   })

  const thisMonthTotal = thisMonthExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
   )

  const recentExpenses = [...expenses]
   .sort((a, b) => new Date(b.date) - new Date(a.date))
   .slice(0, 5)
  
   const categoryTotals = expenses.reduce((totals, expense) => {
    const category = expense.category
    totals[category] = (totals[category] || 0) + expense.amount
    return totals  
   }, {})

  const topCategory = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  )[0]

  function handleAddExpense() {
    if (newAmount === "" || newCategory === "") {
      alert("Please fill in both fields")
      return
    }

    const expense = {
      amount: parseFloat(newAmount),
      category: newCategory,
      date: new Date().toISOString(),
    }

    setExpenses([...expenses, expense])
    setNewAmount("")
    setNewCategory("")
  }

  const [insight, setInsight] = useState("")
  const [loadingInsight, setLoadingInsight] = useState(false)

  async function fetchInsight() {
    setLoadingInsight(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/insight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenses, budget }),
      })
      const data = await response.json()
      setInsight(data.insight)
    } catch (error) {
      setInsight("Couldn't load insight - is the backend running?")
    } finally {
      setLoadingInsight(false)
    }
  }

  return (

    <div className="app">
      <h1>Budget Tracker</h1>

      <div className="stats">
        <div className="stat-box budget">
          <div className="stat-label">Budget</div>
          <div className="stat-value">₦{budget}</div>
        </div>
        <div className="stat-box spent">
          <div className="stat-label">Spent</div>
          <div className="stat-value">₦{total}</div>
        </div>
        <div className={`stat-box remaining ${remaining < 0 ? "negative" : ""}`}>
          <div className="stat-label">Remaining</div>
          <div className="stat-value">₦{remaining}</div>
        </div>
      </div>

      <div className="expenses-card">
  <h2>This Month</h2>
  <p className="month-total">₦{thisMonthTotal}</p>

  {topCategory && (
    <p className="top-category">
      Top category: <strong>{topCategory[0]}</strong> (#{topCategory[1]})
    </p>
  )}
  <button onClick={fetchInsight} className="insight-btn">
    {loadingInsight ? "Thinking..." : "Get AI Insight"}
  </button>

  {insight && <p className="insight-text">{insight}</p>}

  <h2>Recent Expenses</h2>
  <ul className="expense-list">
    {recentExpenses.map((expense, index) => (
      <li key={index} className="expense-item">
        <div>
          <span className="expense-category">{expense.category}</span>
          <div className="expense-date">
            {expense.date
              ? new Date(expense.date).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "No date"}
          </div>
        </div>
        <span className="expense-amount">₦{expense.amount}</span>
      </li>
    ))}
  </ul>
</div>

      <div className="expenses-card">
        <h2>Add Expense</h2>
        <div className="add-form">
          <input
            type="number"
            placeholder="Amount"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
          />
          <input
            type="text"
            placeholder="Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button onClick={handleAddExpense}>Add</button>
        </div>

        <h2>Expenses</h2>
        <ul className="expense-list">
          {expenses.map((expense, index) => (
            <li key={index} className="expense-item">
              <div>
                <span className="expense-category">{expense.category}</span>
                <div className="expense-date">
                  
                {expense.date
                  ? new Date(expense.date).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                })
              : "No date"}
              </div>
             </div>

              <span className="expense-amount">₦{expense.amount}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
 
}

export default Dashboard 