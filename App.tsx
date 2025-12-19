
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WorkEntry, CalendarData } from './types';
import { 
  getDaysInMonth, 
  getFirstDayOfMonth, 
  formatDateKey, 
  getDefaultTimes, 
  calculateDuration 
} from './utils/timeUtils';
import DayCell from './components/DayCell';
import Summary from './components/Summary';
import { analyzeMonthlyWork } from './services/gemini';

const App: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth());
  const [hourlyRate, setHourlyRate] = useState(190);
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [aiComment, setAiComment] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 靜態年份選單
  const yearOptions = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  }, [currentYear]);

  // 從 LocalStorage 載入資料 (純前端持久化)
  useEffect(() => {
    const saved = localStorage.getItem('salary-calculator-v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCalendarData(parsed.data || {});
        setHourlyRate(parsed.rate || 190);
      } catch (e) {
        console.error("Failed to parse saved data");
      }
    }
  }, []);

  // 當資料更動時儲存至 LocalStorage
  useEffect(() => {
    localStorage.setItem('salary-calculator-v2', JSON.stringify({
      data: calendarData,
      rate: hourlyRate
    }));
  }, [calendarData, hourlyRate]);

  const handleUpdateEntry = useCallback((dateKey: string, updates: Partial<WorkEntry>) => {
    setCalendarData(prev => {
      const existing = prev[dateKey];
      if (!existing) {
        const date = new Date(dateKey);
        const defaults = getDefaultTimes(date.getDay());
        const newEntry: WorkEntry = {
          dateKey,
          start: defaults.start,
          end: defaults.end,
          skipped: defaults.skipped,
          duration: 0,
          ...updates
        };
        newEntry.duration = calculateDuration(newEntry.start, newEntry.end);
        return { ...prev, [dateKey]: newEntry };
      }

      const updated = { ...existing, ...updates };
      updated.duration = calculateDuration(updated.start, updated.end);
      return { ...prev, [dateKey]: updated };
    });
  }, []);

  // 計算本月總工時
  const totalHours = useMemo(() => {
    const days = getDaysInMonth(year, month);
    let total = 0;
    for (let d = 1; d <= days; d++) {
      const key = formatDateKey(year, month, d);
      const entry = calendarData[key];
      if (entry) {
        if (!entry.skipped) total += entry.duration;
      } else {
        const date = new Date(year, month, d);
        const defaults = getDefaultTimes(date.getDay());
        if (!defaults.skipped) {
          total += calculateDuration(defaults.start, defaults.end);
        }
      }
    }
    return total;
  }, [year, month, calendarData]);

  // 生成日曆網格
  const daysGrid = useMemo(() => {
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInMonth = getDaysInMonth(year, month);
    const grid = [];

    for (let i = 0; i < firstDay; i++) {
      grid.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = formatDateKey(year, month, d);
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay();
      
      const entry = calendarData[dateKey] || {
        dateKey,
        ...getDefaultTimes(dayOfWeek),
        duration: 0
      };

      if (!calendarData[dateKey]) {
        entry.duration = calculateDuration(entry.start, entry.end);
      }

      grid.push({ day: d, dateKey, dayOfWeek, entry });
    }

    return grid;
  }, [year, month, calendarData]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    const monthData: CalendarData = {};
    daysGrid.forEach(item => {
      if (item) monthData[item.dateKey] = item.entry;
    });
    const result = await analyzeMonthlyWork(monthData, hourlyRate);
    setAiComment(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-screen">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:mb-4 print:border-b-2 print:border-black print:pb-2">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">時薪薪資計算系統</h1>
          <p className="text-slate-500 mt-1 no-print">純前端架構・自動同步・A4 列印</p>
        </div>
        
        <div className="flex items-center gap-4 no-print bg-white p-3 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold mb-1 ml-1 uppercase">年份設定</span>
            <select 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              className="appearance-none bg-slate-50 border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[120px]"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y} 年</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold mb-1 ml-1 uppercase">月份選擇</span>
            <select 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
              className="appearance-none bg-slate-50 border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[100px]"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{i + 1} 月</option>
              ))}
            </select>
          </div>
        </div>

        <div className="hidden print:block text-right">
          <div className="text-xl font-bold">{year} 年 {month + 1} 月 薪資報表</div>
          <div className="text-xs text-gray-500">系統產生日期: {new Date().toLocaleDateString()}</div>
        </div>
      </header>

      <main className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-2 print:border-black print:rounded-none print:shadow-none">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 print:bg-gray-100 print:border-black">
          {['週日', '週一', '週二', '週三', '週四', '週五', '週六'].map((d, i) => (
            <div key={d} className={`py-3 text-center text-xs font-bold ${i === 0 || i === 6 ? 'text-red-500' : 'text-slate-600'} print:text-black`}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-l border-slate-200 print:border-black">
          {daysGrid.map((item, index) => {
            if (!item) return <div key={`empty-${index}`} className="bg-slate-50 border-r border-b border-slate-200 print:border-black" />;
            return (
              <DayCell 
                key={item.dateKey}
                day={item.day}
                dateKey={item.dateKey}
                dayOfWeek={item.dayOfWeek}
                entry={item.entry}
                onUpdate={handleUpdateEntry}
                isWeekend={item.dayOfWeek === 0 || item.dayOfWeek === 6}
              />
            );
          })}
        </div>
      </main>

      <Summary 
        totalHours={totalHours}
        hourlyRate={hourlyRate}
        onRateChange={setHourlyRate}
        isAnalyzing={isAnalyzing}
        onAnalyze={runAnalysis}
        aiComment={aiComment}
      />

      <footer className="mt-8 text-center text-slate-400 text-xs no-print">
        此系統採用純前端模組化架構，所有資料儲存於您的瀏覽器中。
      </footer>
    </div>
  );
};

export default App;
