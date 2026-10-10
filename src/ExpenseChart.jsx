import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ExpenseChart({ expenses }) {
  // Group expenses by category
  const categories = [...new Set(expenses.map(e => e.category))];
  const dataPoints = categories.map(cat => 
    expenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0)
  );

  const data = {
    labels: categories,
    datasets: [
      {
        data: dataPoints,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      },
    ],
  };

  return (
    <div style={{ maxWidth: '350px', margin: '0 auto' }}>
      <h3>Expense Breakdown</h3>
      <Doughnut data={data} />
    </div>
  );
}