import React, { useEffect, useState } from "react";

const daysInWeek = 7;
const weeksInYear = 53; 
const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Month label
function getMonthLabels() {
  const labels = [];
  let date = new Date(new Date().getFullYear(), 0, 1); 
  for (let w = 0; w < weeksInYear; w++) {
    labels.push(months[date.getMonth()]);
    date.setDate(date.getDate() + 7);
  }
  return labels;
}

function getMonthBoundaries(monthLabels) {
  let boundaries = [];
  for (let i = 0; i < monthLabels.length; i++) {
    if (i === 0 || monthLabels[i] !== monthLabels[i - 1]) boundaries.push(i);
  }
  return boundaries;
}

// Fake data: random contributions for each day
const getRandom = () => Math.floor(Math.random() * 5);
const contributionData = Array.from({ length: weeksInYear }, () => Array.from({ length: daysInWeek }, getRandom));

const getColor = (val) => {
  if (val === 0) return "bg-gray-200";
  if (val === 1) return "bg-blue-200";
  if (val === 2) return "bg-blue-500";
  if (val === 3) return "bg-blue-900";
  return "bg-blue-700";
};

const ContributionCalendar = () => {
  const [contributionData, setContributionData] = useState([]);

  useEffect(() => {
    // Update every 24 hours
    const fetchData = async () => {
      try {
        const res = await fetch('/api/user/contributions');
        const result = await res.json();
        if (Array.isArray(result) && result.length === weeksInYear) {
          setContributionData(result);
        }
      } catch (e) {
        
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const monthLabels = getMonthLabels();
  const monthBoundaries = getMonthBoundaries(monthLabels);
  const monthSpans = [];
  for (let i = 0; i < monthBoundaries.length; i++) {
    const start = monthBoundaries[i];
    const end = monthBoundaries[i + 1] || weeksInYear;
    monthSpans.push(end - start);
  }

  // If no data
  const emptyData = Array.from({ length: weeksInYear }, () => Array.from({ length: daysInWeek }, () => 0));
  const displayData = (contributionData.length === weeksInYear) ? contributionData : emptyData;

  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-blue-100 mb-8">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">Contribution Calendar</h3>
      <div className="flex flex-row items-start gap-2 relative">
        {/* Day labels*/}
        <div className="flex flex-col gap-0.5 mr-2 mt-[26px] min-w-[32px]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
            <span
              key={day}
              className="text-xs text-gray-400 h-4 flex items-center justify-end pr-1"
              style={{ minHeight: '1rem', height: '1rem', lineHeight: '1rem' }}
            >
              {day}
            </span>
          ))}
        </div>
        {/* Calendar grid*/}
        <div className="rounded-xl pb-2 bg-white w-full" style={{ minWidth: 0, maxWidth: '100%' }}>
          {/* Month labels*/}
          <div className="flex flex-row gap-0.5 mb-1 ml-0.5 justify-between">
            {monthSpans.map((span, i) => (
              <span
                key={i}
                className="text-xs text-gray-500 text-center font-medium flex-1"
                style={{ minWidth: 0 }}
              >
                {months[i]}
              </span>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="flex flex-row gap-0.5 w-full justify-between">
            {displayData.map((week, wIdx) => (
              <React.Fragment key={wIdx}>
                {monthBoundaries.includes(wIdx) && wIdx !== 0 && (
                  <div className="w-2" />
                )}
                <div className="flex flex-col gap-0.5 flex-1">
                  {week.map((val, dIdx) => (
                    <div
                      key={dIdx}
                      className={`w-4 h-4 rounded ${getColor(val)} border border-white`}
                      title={`Contributions: ${val}`}
                    />
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionCalendar;
