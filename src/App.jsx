import React, { useState, useEffect, useRef } from 'react';
import BudgetProgressBar from './BudgetProgressBar';
import SpendingChart from './SpendingChart';
import BudgetCard3D from './BudgetCard3D';
import Login from './Login';
import Signup from './Signup';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showSignup, setShowSignup] = useState(false);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [expenseError, setExpenseError] = useState('');
  const expenseFormRef = useRef(null);

  const [aiPlan, setAiPlan] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API_URL}/users/me`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => handleLogout());

    fetch(`${API_URL}/expenses`, { headers })
      .then((res) => res.json())
      .then((data) => setExpenses(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error fetching expenses:', err));
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setExpenses([]);
  };

  const handleDeleteExpense = async (id) => {
    try {
      const res = await fetch(`${API_URL}/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setExpenses((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const handleStartEdit = (expense) => {
    setEditingId(expense.id);
    setAmount(expense.amount);
    setCategory(expense.category);
    setDescription(expense.description || '');
    setExpenseError('');
    expenseFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setDescription('');
    setCategory('Food');
    setExpenseError('');
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!amount || !category.trim()) return;

    const isEditing = editingId !== null;
    const url = isEditing
      ? `${API_URL}/expenses/${editingId}`
      : `${API_URL}/expenses`;
    const method = isEditing ? 'PUT' : 'POST';
    setExpenseError('');

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: parseFloat(amount), category, description }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Request failed (${response.status})`);
      }

      const savedExpense = await response.json();
      if (isEditing) {
        setExpenses((prev) => prev.map((item) => (item.id === editingId ? savedExpense : item)));
      } else {
        setExpenses((prev) => [...prev, savedExpense]);
      }
      handleCancelEdit();
    } catch (err) {
      console.error('Failed to save expense:', err);
      setExpenseError(err.message || 'Could not save expense. Please try again.');
    }
  };

  const handleGenerateAiPlan = async () => {
    setLoadingAi(true);
    try {
      const response = await fetch(`${API_URL}/ai/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          monthly_income: user?.monthly_income || 3000000,
          financial_goals: 'Build an emergency fund and optimize daily spending',
        }),
      });
      if (!response.ok) throw new Error(`Server returned status ${response.status}`);
      const data = await response.json();
      const planText = typeof data.plan === 'object' ? JSON.stringify(data.plan, null, 2) : data.plan;
      setAiPlan(planText);
    } catch (err) {
      console.error('Failed to get AI plan:', err);
      setAiPlan('Error generating financial plan. Check browser console.');
    } finally {
      setLoadingAi(false);
    }
  };

  if (!token) {
    if (showSignup) {
      return (
        <div className="auth-page">
          <div>
            <Signup onSignupSuccess={() => setShowSignup(false)} />
            <p className="auth-switch">
              Already have an account?{' '}
              <button onClick={() => setShowSignup(false)}>Log in</button>
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="auth-page">
        <div>
          <Login onLoginSuccess={(newToken) => setToken(newToken)} />
          <p className="auth-switch">
            Don't have an account?{' '}
            <button onClick={() => setShowSignup(true)}>Sign up</button>
          </p>
        </div>
      </div>
    );
  }

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="app-shell">
      {/* TOP HEADER BAR */}
      <header className="app-header">
        <div className="header-left">
          <div className="avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
          <div className="header-info">
            <h2>Welcome back to Wisely, {user?.name || 'User'}</h2>
            <div className="header-meta">
              <span>Profession: {user?.profession || 'Not set'}</span>
              <span>&nbsp;|&nbsp;</span>
              <span>Income: ₦{(user?.monthly_income || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      <BudgetCard3D name={user?.name} income={user?.monthly_income || 0} spent={totalSpent} />

      <BudgetProgressBar income={user?.monthly_income} expenses={expenses} aiPlan={aiPlan} />

      <div className="main-grid">
        <div className="surface">
          <h3>{editingId ? 'Edit Expense' : 'Log New Expense'}</h3>
          <form ref={expenseFormRef} onSubmit={handleSaveExpense}>
            <input
              className="form-input"
              type="number"
              placeholder="Amount (₦)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <input
              className="form-input"
              list="category-options"
              type="text"
              placeholder="Category (e.g. Food, Rent, Gifts...)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
            <datalist id="category-options">
              <option value="Food" />
              <option value="Transport" />
              <option value="Utilities" />
              <option value="Entertainment" />
              <option value="Shopping" />
              <option value="Rent" />
              <option value="Healthcare" />
              <option value="Savings" />
              <option value="Beauty" />
            </datalist>
            <input
              className="form-input"
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="form-row">
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                {editingId ? 'Update Expense' : 'Add Expense'}
              </button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
            {expenseError && <p className="form-error" role="alert">{expenseError}</p>}
          </form>

          <div className="ai-box">
            <h3>AI Financial Coach</h3>
            <button className="btn-primary" onClick={handleGenerateAiPlan} disabled={loadingAi}>
              {loadingAi ? <span className="thinking">Analyzing your spending...</span> : 'Generate Financial Plan'}
            </button>

            {aiPlan && (
              <div className="ai-result">
                {(() => {
                  try {
                    const parsed = typeof aiPlan === 'string'
                      ? JSON.parse(aiPlan.replace(/```json|```/g, '').trim())
                      : aiPlan;
                    return (
                      <div>
                        <p><strong>Essentials:</strong> ₦{parsed.needs?.toLocaleString()}</p>
                        <p><strong>Lifestyle:</strong> ₦{parsed.wants?.toLocaleString()}</p>
                        <p><strong>Savings & Investments:</strong> ₦{parsed.savings_and_investments?.toLocaleString()}</p>
                        <p className="coaching">"{parsed.coaching_message}"</p>
                      </div>
                    );
                  } catch (e) {
                    return <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: 'var(--text-secondary)' }}>{aiPlan}</pre>;
                  }
                })()}
              </div>
            )}
          </div>
        </div>

        <div className="surface">
          <h3>Spending Overview</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Total Spent: <strong style={{ color: 'var(--accent-cyan)' }}>₦{totalSpent.toLocaleString()}</strong>
          </p>

          <SpendingChart expenses={expenses} />

          <div>
            {expenses.map((expense) => (
              <div key={expense.id} className="expense-row">
                <div>
                  <span className="expense-category">{expense.category}</span>
                  {expense.description && <span className="expense-desc">{expense.description}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="expense-amount">₦{expense.amount.toLocaleString()}</span>
                  <div className="expense-actions">
                    <button type="button" className="edit-link" onClick={() => handleStartEdit(expense)}>Edit</button>
                    <button type="button" className="delete-link" onClick={() => handleDeleteExpense(expense.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}