// Shared chart configuration for consistent styling across all analytics charts

export const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 15,
        font: { size: 11, weight: '500' },
        color: '#374151'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      padding: 12,
      cornerRadius: 8,
      titleFont: { size: 13, weight: 'bold' },
      bodyFont: { size: 12 },
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
        drawBorder: false
      },
      ticks: {
        font: { size: 11 },
        color: '#6b7280',
        padding: 8
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: { size: 11 },
        color: '#6b7280',
        padding: 8
      }
    }
  }
};

export const lineChartColors = {
  blue: {
    border: '#3b82f6',
    background: 'rgba(59, 130, 246, 0.15)'
  },
  green: {
    border: '#10b981',
    background: 'rgba(16, 185, 129, 0.15)'
  },
  purple: {
    border: '#8b5cf6',
    background: 'rgba(139, 92, 246, 0.15)'
  },
  amber: {
    border: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.15)'
  },
  red: {
    border: '#ef4444',
    background: 'rgba(239, 68, 68, 0.15)'
  },
  cyan: {
    border: '#06b6d4',
    background: 'rgba(6, 182, 212, 0.15)'
  }
};

export const barChartColors = [
  'rgba(59, 130, 246, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(139, 92, 246, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(6, 182, 212, 0.8)',
  'rgba(236, 72, 153, 0.8)',
  'rgba(132, 204, 22, 0.8)'
];

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-500 font-medium">Loading data...</p>
    </div>
  </div>
);

export const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="mb-4">
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    <div className="h-64">
      {children}
    </div>
  </div>
);

export const SummaryCard = ({ title, value, subtitle, gradient }) => (
  <div className={`relative overflow-hidden ${gradient} rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow`}>
    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
    <div className="relative">
      <div className="text-xs font-semibold uppercase tracking-wide opacity-90">{title}</div>
      <div className="text-4xl font-extrabold mt-2">{value}</div>
      {subtitle && <div className="text-xs opacity-75 mt-1">{subtitle}</div>}
    </div>
  </div>
);
