import React, { useMemo } from 'react';
import Flatpickr from 'react-flatpickr';

const DateTimePicker = ({ date, time, onChange, placeholder = 'Select date & time', className = '' }) => {
  const value = useMemo(() => {
    if (date && time) return `${date} ${time}`;
    if (date) return `${date} 00:00`;
    return '';
  }, [date, time]);

  const handleChange = (selectedDates, dateStr, instance) => {
    if (!dateStr) {
      onChange('', '');
      return;
    }

    // Enforce dynamic minTime based on today
    const now = new Date();
    const selected = selectedDates[0];
    if (selected) {
      const isToday =
        selected.getFullYear() === now.getFullYear() &&
        selected.getMonth() === now.getMonth() &&
        selected.getDate() === now.getDate();

      if (isToday) {
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        instance.set('minTime', `${hh}:${mm}`);
      } else {
        instance.set('minTime', '00:00');
      }
    }

    const [d, t] = dateStr.split(' ');
    if (onChange) onChange(d || '', t || '');
  };

  const handleReady = (selectedDates, dateStr, instance) => {
    // Ensure we never allow picking a past date
    instance.set('minDate', 'today');

    const now = new Date();
    const selected = selectedDates[0] || now;
    const isToday =
      selected.getFullYear() === now.getFullYear() &&
      selected.getMonth() === now.getMonth() &&
      selected.getDate() === now.getDate();

    if (isToday) {
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      instance.set('minTime', `${hh}:${mm}`);
    } else {
      instance.set('minTime', '00:00');
    }
  };

  return (
    <div className={className}>
      <Flatpickr
        value={value}
        options={{
          enableTime: true,
          dateFormat: 'Y-m-d H:i',
          altInput: true,
          altFormat: 'M j, Y h:i K',
          minuteIncrement: 1,
        }}
        onChange={handleChange}
        onReady={handleReady}
        placeholder={placeholder}
        className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 bg-white/80 font-nunito"
      />
    </div>
  );
};

export default DateTimePicker;
