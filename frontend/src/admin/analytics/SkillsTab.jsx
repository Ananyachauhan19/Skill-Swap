import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { BACKEND_URL } from '../../config';

export default function SkillsTab({ dateRange }) {
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
      
      const res = await fetch(`${BACKEND_URL}/api/admin/analytics/skills?${params.toString()}`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch skills data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div className="text-center py-8 text-gray-500">Loading skills analytics...</div>;
  }


  const {
    summary,
    tutorAnalytics,
    interviewAnalytics,
    crossSkillIntelligence,
    insights
  } = data;

  // Tutor Supply Chart
  const tutorSupplyData = {
    labels: tutorAnalytics.supply.map(s => s.skill),
    datasets: [{
      label: 'Tutors Available',
      data: tutorAnalytics.supply.map(s => s.tutorCount),
      backgroundColor: 'rgba(34, 197, 94, 0.7)',
      borderWidth: 1,
    }]
  };

  // Tutor Demand Chart
  const tutorDemandData = {
    labels: tutorAnalytics.demand.map(s => s.skill),
    datasets: [{
      label: 'Session Requests',
      data: tutorAnalytics.demand.map(s => s.requestCount),
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderWidth: 1,
    }]
  };

  // Tutor Gap Chart
  const tutorGapData = {
    labels: tutorAnalytics.gap.undersupplied.map(s => s.skill),
    datasets: [
      {
        label: 'Demand (Requests)',
        data: tutorAnalytics.gap.undersupplied.map(s => s.demand),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
      },
      {
        label: 'Supply (Tutors)',
        data: tutorAnalytics.gap.undersupplied.map(s => s.supply),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      }
    ]
  };

  // Tutor Quality Chart
  const tutorQualityData = {
    labels: tutorAnalytics.quality.map(s => s.skill),
    datasets: [
      {
        label: 'Completed',
        data: tutorAnalytics.quality.map(s => s.completed),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      },
      {
        label: 'Cancelled',
        data: tutorAnalytics.quality.map(s => s.cancelled),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
      },
      {
        label: 'Pending',
        data: tutorAnalytics.quality.map(s => s.pending),
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
      }
    ]
  };

  // Interview Demand Chart
  const interviewDemandData = {
    labels: interviewAnalytics.demand.map(s => s.skill),
    datasets: [{
      label: 'Interview Requests',
      data: interviewAnalytics.demand.map(s => s.requestCount),
      backgroundColor: 'rgba(139, 92, 246, 0.7)',
      borderWidth: 1,
    }]
  };

  // Interview Gap Chart
  const interviewGapData = {
    labels: interviewAnalytics.gap.undersupplied.map(s => s.skill),
    datasets: [
      {
        label: 'Demand (Requests)',
        data: interviewAnalytics.gap.undersupplied.map(s => s.demand),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
      },
      {
        label: 'Supply (Interviewers)',
        data: interviewAnalytics.gap.undersupplied.map(s => s.supply),
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
      }
    ]
  };

  // Interview Quality Chart
  const interviewQualityData = {
    labels: interviewAnalytics.quality.map(s => s.skill),
    datasets: [
      {
        label: 'Completed',
        data: interviewAnalytics.quality.map(s => s.completed),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      },
      {
        label: 'Expired',
        data: interviewAnalytics.quality.map(s => s.expired),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
      },
      {
        label: 'Pending',
        data: interviewAnalytics.quality.map(s => s.pending),
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' }
    },
    scales: {
      x: { beginAtZero: true },
      y: { beginAtZero: true }
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Tutors</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{summary.totalTutors}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Tutor Skills</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{summary.totalTutorSkills}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Interviewers</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{summary.totalInterviewers}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Interview Skills</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{summary.totalInterviewSkills}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Active Tutor Skills</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{summary.activeTutorSkills}</div>
        </div>
      </div>

      {/* Action Insights */}
      {insights && insights.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">🔍 Action Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {insights.filter(i => i.category === 'tutor').map((insight, idx) => (
              <div 
                key={`tutor-${idx}`} 
                className={`p-3 rounded-lg border-l-4 ${
                  insight.type === 'warning' ? 'bg-red-50 border-red-500' :
                  insight.type === 'success' ? 'bg-green-50 border-green-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="text-xs font-semibold text-blue-600 mb-1">TUTOR</div>
                <div className="text-sm font-semibold text-gray-800">{insight.message}</div>
                <div className="text-xs text-gray-600 mt-1">→ {insight.action}</div>
              </div>
            ))}
            {insights.filter(i => i.category === 'interview').map((insight, idx) => (
              <div 
                key={`interview-${idx}`} 
                className={`p-3 rounded-lg border-l-4 ${
                  insight.type === 'warning' ? 'bg-red-50 border-red-500' :
                  insight.type === 'success' ? 'bg-green-50 border-green-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="text-xs font-semibold text-purple-600 mb-1">INTERVIEW</div>
                <div className="text-sm font-semibold text-gray-800">{insight.message}</div>
                <div className="text-xs text-gray-600 mt-1">→ {insight.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 1: TUTOR SKILLS ANALYTICS */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📚 TUTOR SKILLS ANALYTICS</h2>

        {/* Tutor Supply & Demand */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Tutor Availability by Skill</h3>
            <div className="h-64">
              <Bar 
                data={tutorSupplyData} 
                options={{ 
                  ...chartOptions, 
                  indexAxis: 'y',
                  scales: { x: { beginAtZero: true } }
                }} 
              />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              ✓ Counts all tutors with skills in their profile (even if no sessions yet)
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Session Request Demand</h3>
            <div className="h-64">
              <Bar 
                data={tutorDemandData} 
                options={{ 
                  ...chartOptions,
                  indexAxis: 'y',
                  scales: { x: { beginAtZero: true } }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Tutor Gap Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Tutor Demand vs Supply Gap</h3>
            <div className="h-64">
              <Bar 
                data={tutorGapData} 
                options={{ 
                  ...chartOptions,
                  plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                      callbacks: {
                        afterLabel: (context) => {
                          const idx = context.dataIndex;
                          const gap = tutorAnalytics.gap.undersupplied[idx];
                          return `Gap Ratio: ${gap.gapRatio.toFixed(1)}`;
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-semibold text-red-600">{tutorAnalytics.gap.undersupplied.length}</span> undersupplied skills | 
              <span className="font-semibold text-green-600 ml-2">{tutorAnalytics.gap.balanced}</span> balanced
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Tutor Skill Quality</h3>
            <div className="h-64">
              <Bar 
                data={tutorQualityData} 
                options={{ 
                  ...chartOptions,
                  scales: { 
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Tutor Activity Status */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Tutor Skill Activity Status</h3>
          <div className="overflow-x-auto max-h-80">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-gray-500">Skill</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500">Tutors</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500">Last Used</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tutorAnalytics.activityStatus.map((skill, idx) => (
                  <tr key={idx} className={skill.status === 'dormant' ? 'bg-red-50' : 'bg-green-50'}>
                    <td className="px-2 py-2 truncate max-w-[150px]" title={skill.skill}>{skill.skill}</td>
                    <td className="px-2 py-2 font-semibold">{skill.tutorCount}</td>
                    <td className="px-2 py-2 text-gray-600">{skill.lastUsed}</td>
                    <td className="px-2 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        skill.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {skill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: INTERVIEW SKILLS ANALYTICS */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 INTERVIEW SKILLS ANALYTICS</h2>

        {/* Interview Supply & Demand */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Interviewer Availability by Skill</h3>
            <div className="overflow-x-auto max-h-80">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Skill</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Interviewers</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Demand</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {interviewAnalytics.supply.map((skill, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-2 truncate max-w-[150px]" title={skill.skill}>{skill.skill}</td>
                      <td className="px-2 py-2 font-bold text-purple-600">{skill.interviewerCount}</td>
                      <td className="px-2 py-2 text-gray-600">{skill.demand}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              ✓ Counts approved interviewers only
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Interview Request Demand</h3>
            <div className="h-64">
              <Bar 
                data={interviewDemandData} 
                options={{ 
                  ...chartOptions,
                  indexAxis: 'y',
                  scales: { x: { beginAtZero: true } }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Interview Gap & Quality */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Interview Demand vs Supply Gap</h3>
            <div className="h-64">
              <Bar 
                data={interviewGapData} 
                options={{ 
                  ...chartOptions,
                  plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                      callbacks: {
                        afterLabel: (context) => {
                          const idx = context.dataIndex;
                          const gap = interviewAnalytics.gap.undersupplied[idx];
                          return `Gap Ratio: ${gap.gapRatio.toFixed(1)}`;
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-semibold text-red-600">{interviewAnalytics.gap.undersupplied.length}</span> undersupplied skills | 
              <span className="font-semibold text-green-600 ml-2">{interviewAnalytics.gap.balanced}</span> balanced
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Interview Quality & Ratings</h3>
            <div className="overflow-x-auto max-h-64">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Skill</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Completion</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Avg Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {interviewAnalytics.quality.map((skill, idx) => (
                    <tr key={idx} className={skill.completionRate < 50 ? 'bg-red-50' : ''}>
                      <td className="px-2 py-2 truncate max-w-[120px]" title={skill.skill}>{skill.skill}</td>
                      <td className="px-2 py-2 font-bold">{skill.completionRate}%</td>
                      <td className="px-2 py-2 text-yellow-600 font-semibold">
                        {skill.avgRating > 0 ? `⭐ ${skill.avgRating}` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: CROSS-SKILL INTELLIGENCE */}
      {crossSkillIntelligence && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-yellow-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔗 CROSS-SKILL INTELLIGENCE</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3 text-green-700">Strong in Tutoring Only</h3>
              {crossSkillIntelligence.overlap.strongInTutoringOnly.length > 0 ? (
                <div className="space-y-2">
                  {crossSkillIntelligence.overlap.strongInTutoringOnly.map((skill, idx) => (
                    <div key={idx} className="p-2 bg-green-50 rounded border border-green-200">
                      <div className="text-sm font-semibold text-gray-800">{skill.skill}</div>
                      <div className="text-xs text-gray-600">
                        Tutors: {skill.tutorSupply} | Demand: {skill.tutorDemand} | 
                        <span className="text-red-600 ml-1">No interview coverage</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">No skills found</div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3 text-purple-700">Strong in Interviews Only</h3>
              {crossSkillIntelligence.overlap.strongInInterviewsOnly.length > 0 ? (
                <div className="space-y-2">
                  {crossSkillIntelligence.overlap.strongInInterviewsOnly.map((skill, idx) => (
                    <div key={idx} className="p-2 bg-purple-50 rounded border border-purple-200">
                      <div className="text-sm font-semibold text-gray-800">{skill.skill}</div>
                      <div className="text-xs text-gray-600">
                        Interviewers: {skill.interviewerSupply} | Demand: {skill.interviewDemand} | 
                        <span className="text-red-600 ml-1">No tutor coverage</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">No skills found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
