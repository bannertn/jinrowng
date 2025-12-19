import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- 1. 型別定義 (Types) ---
interface WorkEntry {
  dateKey: string;
  start: string;
  end: string;
  skipped: boolean;
  duration: number;
}

interface CalendarData {
  [key: string]: WorkEntry;
}

// --- 2. 工具函式 (Utils) ---
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const calculateDuration = (start: string, end: string): number => {
  const startMins = timeToMinutes(start);
  const endMins = timeToMinutes(end);
  // 簡單計算，假設不跨日。如果結束時間小於開始時間，視為 0 或需另外處理跨日邏輯
  if (endMins > startMins) {
    return (endMins - startMins) / 60;
  }
  return 0;
};

/**
 * 預設時間與狀態邏輯：
 * 1. 星期二 (Day 2): 16:00 - 18:00，不跳過
 * 2. 星期六、日 (Day 0, 6): 空白時間，預設勾選「跳過」
 * 3. 其他日子: 11:30 - 18:30，不跳過
 */
const getDefaultTimes = (dayOfWeek: number): { start: string; end: string; skipped: boolean } => {
  if (dayOfWeek === 2) {
    return { start: '16:00', end: '18:00', skipped: false };
  }
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { start: '', end: '', skipped: true };
  }
  return { start: '11:30', end: '18:30', skipped: false };
};

const formatDateKey = (year: number, month: number, day: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

// --- 3. API 服務 (Services) ---
// 使用 fetch 直接呼叫 REST API，不依賴外部 SDK
const analyzeMonthlyWork = async (data: CalendarData, hourlyRate: number): Promise<string> => {
  const apiKey = ""; // 系統會自動注入 API Key，請勿手動填寫
  
  const entries = Object.values(data).filter(e => !e.skipped && e.duration > 0);
  const totalHours = entries.reduce((acc, curr) => acc + curr.duration, 0);
  const totalSalary = totalHours * hourlyRate;
  
  // 為節省 Token 與提高準確度，整理精簡的數據
  const formattedData = entries
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .map(e => `${e.dateKey}: ${e.start}-${e.end} (${e.duration.toFixed(1)}h)`)
    .join('\n');

  const prompt = `
    你是一位專業的人力資源顧問。請分析以下月份的工時數據並給予簡短建議。
    
    基本資訊：
    - 時薪：${hourlyRate} 元
    - 工作天數：${entries.length} 天
    - 總工時：${totalHours.toFixed(2)} 小時
    - 預估總薪資：${totalSalary.toFixed(0)} 元
    
    每日詳細數據：
    ${formattedData}
    
    請用繁體中文回應，包含：
    1. 對工作規律性的評價。
    2. 是否有過勞或時數過少的觀察。
    3. 針對薪資或工時的簡短建議。
    請保持語氣專業且友善。
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "無法獲取分析結果。";

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "分析過程中發生錯誤，請稍後再試。";
  }
};

// --- 4. 子組件 (Components) ---

// DayCell 組件
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

        {/* 列印時顯示的小時數 */}
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
            className="w-full text-xs p-1 border border-transparent group-hover:border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-300 print:border-none print:p-0 print:text-right"
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[10px] text-gray-400 w-7 no-print">下班</label>
          <input 
            type="time"
            value={entry.end}
            onChange={(e) => onUpdate(dateKey, { end: e.target.value })}
            className="w-full text-xs p-1 border border-transparent group-hover:border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-300 print:border-none print:p-0 print:text-right"
          />
        </div>
      </div>
    </div>
  );
};

// Summary 組件
interface SummaryProps {
  totalHours: number;
  hourlyRate: number;
  onRateChange: (rate: number) => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  aiComment: string;
}

const Summary: React.FC<SummaryProps> = ({ 
  totalHours, 
  hourlyRate, 
  onRateChange, 
  isAnalyzing, 
  onAnalyze,
  aiComment 
}) => {
  const totalSalary = totalHours * hourlyRate;

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 print:border-2 print:border-black print:rounded-none print:shadow-none print:mt-4 print:break-inside-avoid">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 border-slate-100 print:hidden">
        <h2 className="text-xl font-bold text-slate-800">薪資結算統計</h2>
        <div className="flex gap-2 mt-4 md:mt-0">
          <button 
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isAnalyzing ? (
              <span className="animate-spin">⌛</span>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            )}
            AI 智慧分析
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            列印 A4 報表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:grid-cols-3 print:gap-4 print:mb-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 print:bg-white print:border-black print:rounded-none">
          <label className="block text-sm font-medium text-slate-500 mb-1">時薪 (TWD)</label>
          <input 
            type="number" 
            value={hourlyRate}
            onChange={(e) => onRateChange(Number(e.target.value))}
            className="w-full bg-transparent text-2xl font-bold text-indigo-600 focus:outline-none print:text-black"
          />
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 print:bg-white print:border-black print:rounded-none">
          <label className="block text-sm font-medium text-slate-500 mb-1">總計工時</label>
          <div className="text-2xl font-bold text-emerald-600 print:text-black">
            {totalHours.toFixed(2)} <span className="text-sm">小時</span>
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 print:bg-white print:border-black print:rounded-none">
          <label className="block text-sm font-medium text-slate-500 mb-1">預計總薪資</label>
          <div className="text-2xl font-bold text-rose-600 print:text-black">
            ${totalSalary.toLocaleString()} <span className="text-sm">元</span>
          </div>
        </div>
      </div>

      {aiComment && !isAnalyzing && (
        <div className="mb-8 p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg print:hidden">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-indigo-600 font-bold">✨ Gemini AI 分析建議</span>
          </div>
          <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">{aiComment}</p>
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-12 print:mt-4 print:pt-4 print:gap-4 print:text-xs">
        <div className="flex flex-col gap-4">
          <span className="text-sm font-bold text-slate-600 print:text-black">員工姓名簽章</span>
          <div className="border-b-2 border-slate-300 h-10 print:border-black"></div>
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-sm font-bold text-slate-600 print:text-black">管理者簽名</span>
          <div className="border-b-2 border-slate-300 h-10 print:border-black"></div>
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-sm font-bold text-slate-600 print:text-black">主管簽名</span>
          <div className="border-b-2 border-slate-300 h-10 print:border-black"></div>
        </div>
      </div>
    </div>
  );
};

// --- 5. 主應用程式 (App) ---
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
    return Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);
  }, [currentYear]);

  // 從 LocalStorage 載入資料
  useEffect(() => {
    const saved = localStorage.getItem('salary-calculator-simple');
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
    localStorage.setItem('salary-calculator-simple', JSON.stringify({
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
      
      const existingEntry = calendarData[dateKey];
      
      // 如果沒有資料，使用預設值渲染，但不寫入 state (直到用戶修改)
      const entry = existingEntry || {
        dateKey,
        ...getDefaultTimes(dayOfWeek),
        duration: 0
      };
      
      if (!existingEntry) {
          entry.duration = calculateDuration(entry.start, entry.end);
      }

      grid.push({ day: d, dateKey, dayOfWeek, entry });
    }

    return grid;
  }, [year, month, calendarData]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    // 收集本月資料
    const monthData: CalendarData = {};
    const daysInMonth = getDaysInMonth(year, month);
    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = formatDateKey(year, month, d);
        // 優先使用已儲存的資料，否則使用預設值
        if (calendarData[dateKey]) {
            monthData[dateKey] = calendarData[dateKey];
        } else {
            const date = new Date(year, month, d);
            const defaults = getDefaultTimes(date.getDay());
            monthData[dateKey] = {
                dateKey,
                ...defaults,
                duration: calculateDuration(defaults.start, defaults.end)
            };
        }
    }

    const result = await analyzeMonthlyWork(monthData, hourlyRate);
    setAiComment(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-screen font-sans">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:mb-4 print:border-b-2 print:border-black print:pb-2">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">時薪工時薪資計算系統</h1>
          <p className="text-slate-500 mt-1 no-print">純前端架構・自動同步・A4 列印優化</p>
        </div>
        
        <div className="flex items-center gap-4 no-print bg-white p-3 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold mb-1 ml-1 uppercase">年份</span>
            <select 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              className="appearance-none bg-slate-50 border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[100px]"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y} 年</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold mb-1 ml-1 uppercase">月份</span>
            <select 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
              className="appearance-none bg-slate-50 border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[80px]"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{i + 1} 月</option>
              ))}
            </select>
          </div>
        </div>

        <div className="hidden print:block text-right">
          <div className="text-xl font-bold">{year} 年 {month + 1} 月 薪資報表</div>
          <div className="text-xs text-gray-500">列印日期: {new Date().toLocaleDateString()}</div>
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

      <footer className="mt-8 text-center text-slate-400 text-xs no-print pb-8">
        資料儲存於您的瀏覽器 LocalStorage 中・請勿清除瀏覽器快取以免資料遺失
      </footer>
    </div>
  );
};

export default App;