import React, { useState } from 'react';

interface DateRangeFilterProps {
  onFilterChange: (startDate: Date | undefined, endDate: Date | undefined) => void;
}

export function DateRangeFilter({ onFilterChange }: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  function handlePreset(preset: string) {
    const now = new Date();
    let start: Date | undefined;

    if (preset === 'today') start = new Date(now.setHours(0, 0, 0, 0));
    else if (preset === 'last7days') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (preset === 'last30days') start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    setStartDate(start ? start.toISOString().split('T')[0] : '');
    setEndDate('');
    onFilterChange(start, undefined);
  }

  function handleApply() {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    if (end) end.setHours(23, 59, 59, 999);
    onFilterChange(start, end);
  }

  function handleClear() {
    setStartDate(''); setEndDate('');
    onFilterChange(undefined, undefined);
  }

  return (
    <div className="date-range-filter">
      <div className="filter-presets">
        <button onClick={() => handlePreset('today')} className="btn btn-filter">Today</button>
        <button onClick={() => handlePreset('last7days')} className="btn btn-filter">Last 7 Days</button>
        <button onClick={() => handlePreset('last30days')} className="btn btn-filter">Last 30 Days</button>
        <button onClick={() => handlePreset('all')} className="btn btn-filter">All Time</button>
      </div>

      <div className="filter-custom">
        <div className="date-inputs">
          <div className="date-input-group">
            <label htmlFor="startDate">From</label>
            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="date-input-group">
            <label htmlFor="endDate">To</label>
            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} />
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={handleApply} className="btn btn-primary" disabled={!startDate && !endDate}>
            Apply Filter
          </button>
          <button onClick={handleClear} className="btn btn-secondary">Clear</button>
        </div>
      </div>

      {(startDate || endDate) && (
        <div className="filter-active">
          <span>
            Showing data from {startDate ? new Date(startDate).toLocaleDateString() : 'beginning'} to{' '}
            {endDate ? new Date(endDate).toLocaleDateString() : 'now'}
          </span>
        </div>
      )}
    </div>
  );
}
