import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SpendingChart({ expenses }) {
  const categoryTotals = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const labels = Object.keys(categoryTotals);
  const dataValues = Object.values(categoryTotals);

  if (expenses.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem',
      }}>
        No spending data yet. Log an expense to see your distribution!
      </div>
    );
  }

  const data = {
    labels: labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: [
          '#00f5d4',
          '#a78bfa',
          '#ffb74d',
          '#ff4d6d',
          '#00e676',
          '#36A2EB',
        ],
        borderWidth: 2,
        borderColor: '#161d33',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          color: '#8b93a8',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ₦${context.raw.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div style={{ height: '240px', width: '100%', marginBottom: '1.5rem' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}