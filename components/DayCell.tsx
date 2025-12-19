
import React from 'react';
import { WorkEntry } from '../types';
import { calculateDuration } from '../utils/timeUtils';

interface DayCellProps {
  day: number;
  dateKey: string;
  dayOfWeek: number;
  entry: WorkEntry;
  onUpdate: (dateKey: string, updates: Partial<WorkEntry>) => void;
  isWeekend: boolean;
}

const DayCell: React.FC<DayCellProps> = ({ day, dateKey, dayOfWeek, entry, onUpdate, isWeekend }) => {
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  const duration = calculateDuration(entry.start, entry.end);

  return (
    <div 
      className={`min-h-[110px] p-2 border-r border-b transition-colors ${
        entry.skipped ? 'bg-gray-100' : isWeekend ? 'bg-indigo-50/40' : 'bg-white'
      } hover:bg-slate-50 relative group`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-baseline gap-1">
          <span className={`text-lg font-bold ${isWeekend ? 'text-red-500' : 'text-indigo-700'}`}>
            {day}
          </span>
          <span className="text-xs text-gray-500 font-medium">週{dayNames[dayOfWeek]}</span>
        </div>
        
        <div className="flex items-center gap-1 no-print">
          <input 
            type="checkbox"
            id={`skip-${dateKey}`}
            checked={entry.skipped}
            onChange={(e) => onUpdate(dateKey, { skipped: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor={`skip-${dateKey}`} className="text-[10px] text-gray-400 cursor-pointer select-none">
            跳過
          </label>
        </div>

        {/* Print only hours display */}
        <div className="hidden print:block text-xs font-bold text-gray-700">
          {entry.skipped ? '0小時' : `${duration.toFixed(1)}h`}
        </div>
      </div>

      <div className={`space-y-1 ${entry.skipped ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
        <div className="flex items-center gap-1">
          <label className="text-[10px] text-gray-400 w-7 no-print">上班</label>
          <input 
            type="time"
            value={entry.start}
            onChange={(e) => onUpdate(dateKey, { start: e.target.value })}
            className="w-full text-xs p-1 border border-transparent group-hover:border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-300 print:border-none"
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[10px] text-gray-400 w-7 no-print">下班</label>
          <input 
            type="time"
            value={entry.end}
            onChange={(e) => onUpdate(dateKey, { end: e.target.value })}
            className="w-full text-xs p-1 border border-transparent group-hover:border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-300 print:border-none"
          />
        </div>
      </div>
    </div>
  );
};

export default DayCell;
