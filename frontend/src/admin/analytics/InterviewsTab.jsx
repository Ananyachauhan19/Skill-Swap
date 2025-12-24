import React, { useEffect, useState } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { BACKEND_URL } from '../../config';
import { LoadingSpinner, commonChartOptions, lineChartColors } from './chartConfig';

export default function InterviewsTab({ dateRange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.range !== 'custom') {
        params.append('range', dateRange.range);
      } else if (dateRange.startDate && dateRange.endDate) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }
      
      const res = await fetch(`${BACKEND_URL}/api/admin/analytics/interviews?${params.toString()}`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch interviews data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const interviewsOverTimeData = {
    labels: data?.interviewsOverTime?.map(d => d.date.slice(5)) || [],
    datasets: [{
      label: 'Interviews',
      data: data?.interviewsOverTime?.map(d => d.count) || [],
      borderColor: lineChartColors.amber.border,
      backgroundColor: lineChartColors.amber.background,
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2
    }]
  };

  const participationData = {
    labels: ['As Requester', 'As Interviewer'],
    datasets: [{
      label: 'Participation',
      data: [
        data?.participation?.asRequester || 0,
        data?.participation?.asInterviewer || 0
      ],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
      borderWidth: 0
    }]
  };

  const ratingsData = {
    labels: data?.avgRatings?.map(r => `${r.rating} ⭐`) || [],
    datasets: [{
      label: 'Interviewers',
      data: data?.avgRatings?.map(r => r.count) || [],
      backgroundColor: 'rgba(245, 158, 11, 0.8)',
      borderWidth: 0
    }]
  };

  const pipelineData = {
    labels: ['Applied', 'Approved', 'Active', 'Conducted 5+'],
    datasets: [{
      label: 'Interviewers',
      data: [
        data?.pipeline?.applied || 0,
        data?.pipeline?.approved || 0,
        data?.pipeline?.active || 0,
        data?.pipeline?.experienced || 0
      ],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(245, 158, 11, 0.8)'],
      borderWidth: 0
    }]
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Total Interviews</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.total || 0}</div>
            <div className="text-xs opacity-75 mt-1">💼 All requests</div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Completed</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.completed || 0}</div>
            <div className="text-xs opacity-75 mt-1">✅ Finished</div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Scheduled</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.scheduled || 0}</div>
            <div className="text-xs opacity-75 mt-1">📅 Upcoming</div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Avg Rating</div>
            <div className="text-4xl font-extrabold mt-2">{data?.summary?.avgRating || 0} ⭐</div>
            <div className="text-xs opacity-75 mt-1">📈 Quality score</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">Interviews Over Time</h3>
            <p className="text-xs text-gray-500 mt-0.5">Daily interview requests</p>
          </div>
          <div className="h-64">
            <Line data={interviewsOverTimeData} options={{ ...commonChartOptions, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">Interview Participation</h3>
            <p className="text-xs text-gray-500 mt-0.5">Role distribution</p>
          </div>
          <div className="h-64">
            <Doughnut data={participationData} options={{ ...commonChartOptions, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">Average Interviewer Ratings</h3>
            <p className="text-xs text-gray-500 mt-0.5">Rating distribution</p>
          </div>
          <div className="h-64">
            <Bar data={ratingsData} options={{ ...commonChartOptions, maintainAspectRatio: false, indexAxis: 'y' }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">Interviewer Approval Pipeline</h3>
            <p className="text-xs text-gray-500 mt-0.5">Progression stages</p>
          </div>
          <div className="h-64">
            <Bar data={pipelineData} options={{ ...commonChartOptions, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
}
