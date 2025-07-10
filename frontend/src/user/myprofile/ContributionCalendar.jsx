import React from 'react';

const ContributionCalendar = ({ contributions, months, currentDate, getContributionColor }) => {
  const totalContributions = Object.values(contributions).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-blue-900">Contribution Activity</h3>
        <select
          className="bg-transparent border border-blue-600 text-gray-700 text-sm px-3 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition"
          value={`${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`}
          onChange={e => e.preventDefault()}
        >
          <option>{`${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`}</option>
        </select>
      </div>
      <p className="text-sm text-gray-700 mb-4">
        {totalContributions} Contributions in the last year
      </p>
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-4">
          {months.map((month, idx) => {
            const { name, year, days } = month;
            const firstDay = new Date(year, months.findIndex(m => m.name === name && m.year === year), 1).getDay();
            const weeks = Math.ceil((firstDay + days) / 7);
            const grid = Array(7)
              .fill()
              .map(() => Array(weeks).fill(null));
            for (let day = 1; day <= days; day++) {
              const dayIndex = (firstDay + day - 1) % 7;
              const weekIndex = Math.floor((firstDay + day - 1) / 7);
              grid[dayIndex][weekIndex] = day;
            }
            const boxClass = "w-3 h-2 rounded-none";
            return (
              <div key={idx} className="min-w-[60px]">
                <div className="text-[10px] text-blue-900 font-medium text-center mb-2">
                  {name} {year}
                </div>
                <div className="flex flex-col gap-1">
                  {grid.map((week, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1">
                      {week.map((day, colIndex) => {
                        if (day === null) {
                          return (
                            <div key={colIndex} className={`${boxClass} bg-transparent`} />
                          );
                        }
                        const dateStr = `${year}-${String(
                          months.findIndex(m => m.name === name && m.year === year) + 1
                        ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const count = contributions[dateStr] || 0;
                        return (
                          <div
                            key={colIndex}
                            className={`${boxClass} ${getContributionColor(count)} hover:border hover:border-blue-300 transition cursor-pointer`}
                            title={`${name} ${day}, ${year} - ${count} contributions`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ContributionCalendar;
