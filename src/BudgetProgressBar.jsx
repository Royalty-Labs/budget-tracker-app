import React from 'react';

export default function BudgetProgressBar({ income, expenses, aiPlan }) {
  const totalIncome = income || 150000;
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  let targetNeeds = totalIncome * 0.50;
  let targetWants = totalIncome * 0.30;
  let targetSavings = totalIncome * 0.20;

  if (aiPlan) {
    try {
      const parsed = typeof aiPlan === 'string'
        ? JSON.parse(aiPlan.replace(/```json|```/g, '').trim())
        : aiPlan;
      if (parsed.needs) targetNeeds = parsed.needs;
      if (parsed.wants) targetWants = parsed.wants;
      if (parsed.savings_and_investments) targetSavings = parsed.savings_and_investments;
    } catch (e) {
      // fallback to standard 50/30/20
    }
  }

  const spentPercent = Math.min((totalSpent / totalIncome) * 100, 100);
  const needsPercent = (targetNeeds / totalIncome) * 100;
  const wantsPercent = (targetWants / totalIncome) * 100;
  const savingsPercent = (targetSavings / totalIncome) * 100;

  const isOverBudget = totalSpent > totalIncome;

  return (
    <div className="surface">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>Budget Utilization vs. AI Target</h3>
        <span style={{
          fontSize: '13px',
          fontWeight: 'bold',
          color: isOverBudget ? 'var(--accent-red)' : 'var(--accent-green)',
        }}>
          ₦{totalSpent.toLocaleString()} / ₦{totalIncome.toLocaleString()}
        </span>
      </div>

      <div style={{
        height: '10px', width: '100%',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '5px', overflow: 'hidden', marginBottom: '16px',
      }}>
        <div style={{
          height: '100%',
          width: `${spentPercent}%`,
          background: isOverBudget ? 'var(--accent-red)' : 'var(--accent-cyan)',
          transition: 'width 0.4s ease',
        }} />
      </div>

      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
        Target Allocation Breakdown (50 / 30 / 20 Rule):
      </p>
      <div style={{
        display: 'flex', height: '8px', width: '100%',
        borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-secondary)',
      }}>
        <div style={{ width: `${needsPercent}%`, background: 'var(--accent-cyan)' }} title="Essentials (Needs)" />
        <div style={{ width: `${wantsPercent}%`, background: 'var(--accent-amber)' }} title="Lifestyle (Wants)" />
        <div style={{ width: `${savingsPercent}%`, background: 'var(--accent-green)' }} title="Savings & Investment" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', background: 'var(--accent-cyan)', borderRadius: '50%' }} />
          Needs (₦{targetNeeds.toLocaleString()})
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', background: 'var(--accent-amber)', borderRadius: '50%' }} />
          Wants (₦{targetWants.toLocaleString()})
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', background: 'var(--accent-green)', borderRadius: '50%' }} />
          Savings (₦{targetSavings.toLocaleString()})
        </span>
      </div>
    </div>
  );
}