import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- 工具函數 ---
const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
};

const calculateDuration = (start: string, end: string) => {
    const startMins = timeToMinutes(start);
    const endMins = timeToMinutes(end);
    return endMins > startMins ? (endMins - startMins) / 60 : 0;
};

/**
 * 核心預設邏輯：
 * 1. 週六(6)、週日(0) -> 預設跳過
 * 2. 週二(2) -> 16:00 - 18:30
 * 3. 其他平日 -> 12:00 - 18:30
 */
const getDefaultTimes = (dayOfWeek: number) => {
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { start: '', end: '', skipped: true };
    }
    if (dayOfWeek === 2) {
        return { start: '16:00', end: '18:30', skipped: false };
    }
    return { start: '12:00', end: '18:30', skipped: false };
};

const formatDateKey = (year: number, month: number, day: number) => 
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

// --- 元件 ---

const DayCell = ({ day, dateKey, dayOfWeek, entry, onUpdate, isWeekend }: any) => {
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const duration = calculateDuration(entry.start, entry.end);

    return (
        <div className={`min-h-[110px] p-2 border-r border-b transition-all ${entry.skipped ? 'bg-slate-100/50' : isWeekend ? 'bg-indigo-50/30' : 'bg-white'} hover:bg-indigo-50/50 group`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-bold ${isWeekend ? 'text-rose-500' : 'text-slate-700'}`}>{day}</span>
                    <span className="text-[10px] text-slate-400 font-medium">週{dayNames[dayOfWeek]}</span>
                </div>
                <div className="flex items-center gap-1 no-print">
                    <input
                        type="checkbox"
                        id={`skip-${dateKey}`}
                        checked={entry.skipped}
                        onChange={(e) => onUpdate(dateKey, { skipped: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor={`skip-${dateKey}`} className="text-[10px] text-slate-400 cursor-pointer">休</label>
                </div>
                {!entry.skipped && duration > 0 && (
                    <div className="hidden print:block text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1 rounded">
                        {duration.toFixed(1)}h
                    </div>
                )}
            </div>
            
            {entry.skipped ? (
                <div className="flex items-center justify-center h-12">
                    <span className="text-xs font-bold text-slate-300 tracking-widest border border-dashed border-slate-200 px-2 py-0.5 rounded">SKIP</span>
                </div>
            ) : (
                <div className="space-y-1">
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-400 w-4 no-print">起</span>
                        <input
                            type="time"
                            value={entry.start}
                            onChange={(e) => onUpdate(dateKey, { start: e.target.value })}
                            className="w-full text-xs p-0.5 border-b border-transparent group-hover:border-slate-200 rounded-sm focus:outline-none focus:bg-indigo-50"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-400 w-4 no-print">訖</span>
                        <input
                            type="time"
                            value={entry.end}
                            onChange={(e) => onUpdate(dateKey, { end: e.target.value })}
                            className="w-full text-xs p-0.5 border-b border-transparent group-hover:border-slate-200 rounded-sm focus:outline-none focus:bg-indigo-50"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const Summary = ({ totalHours, hourlyRate, onRateChange }: any) => {
    const totalSalary = totalHours * hourlyRate;
    return (
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-8 print:border-t-2 print:border-slate-800 print:shadow-none print:rounded-none">
            <div className="flex justify-between items-center mb-6 no-print">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                    薪資結算統計
                </h2>
                <button 
                    onClick={() => window.print()} 
                    className="px-5 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                    列印 A4 報表
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 print:grid-cols-3 print:gap-4 print:mb-6">
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 print:bg-white print:border-slate-200">
                    <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">時薪 (TWD)</label>
                    <div className="flex items-center gap-1">
                        <span className="text-indigo-300 font-bold">$</span>
                        <input 
                            type="number" 
                            value={hourlyRate} 
                            onChange={e => onRateChange(Number(e.target.value))} 
                            className="w-full bg-transparent text-2xl font-black text-indigo-700 focus:outline-none print:text-black"
                        />
                    </div>
                </div>
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 print:bg-white print:border-slate-200">
                    <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">總計工時</label>
                    <div className="text-2xl font-black text-emerald-700 print:text-black">{totalHours.toFixed(2)} <span className="text-sm">小時</span></div>
                </div>
                <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 print:bg-white print:border-slate-200">
                    <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">本月薪資預估</label>
                    <div className="text-2xl font-black text-rose-700 print:text-black">${Math.round(totalSalary).toLocaleString()} <span className="text-sm">元</span></div>
                </div>
            </div>

            <div className="pt-10 border-t border-slate-100 grid grid-cols-3 gap-8 print:pt-6">
                {['員工本人簽章', '會計核派', '主管審核'].map(t => (
                    <div key={t} className="flex flex-col gap-8">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t}</span>
                        <div className="border-b border-slate-200 h-1"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const App = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth());
    const [hourlyRate, setHourlyRate] = useState(196);
    const [calendarData, setCalendarData] = useState<any>({});

    useEffect(() => {
        const saved = localStorage.getItem('salary-system-v5');
        if (saved) {
            const { data, rate } = JSON.parse(saved);
            setCalendarData(data || {});
            setHourlyRate(rate || 196);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('salary-system-v5', JSON.stringify({ data: calendarData, rate: hourlyRate }));
    }, [calendarData, hourlyRate]);

    const handleUpdateEntry = useCallback((dateKey: string, updates: any) => {
        setCalendarData((prev: any) => {
            const dayOfWeek = new Date(dateKey).getDay();
            const existing = prev[dateKey] || { dateKey, ...getDefaultTimes(dayOfWeek), duration: 0 };
            const updated = { ...existing, ...updates };
            updated.duration = calculateDuration(updated.start, updated.end);
            return { ...prev, [dateKey]: updated };
        });
    }, []);

    const totalHours = useMemo(() => {
        let total = 0;
        const days = getDaysInMonth(year, month);
        for (let d = 1; d <= days; d++) {
            const key = formatDateKey(year, month, d);
            const entry = calendarData[key] || { ...getDefaultTimes(new Date(year, month, d).getDay()) };
            if (!entry.skipped) total += calculateDuration(entry.start, entry.end);
        }
        return total;
    }, [year, month, calendarData]);

    const daysGrid = useMemo(() => {
        const grid = Array(getFirstDayOfMonth(year, month)).fill(null);
        for (let d = 1; d <= getDaysInMonth(year, month); d++) {
            const dateKey = formatDateKey(year, month, d);
            const dayOfWeek = new Date(year, month, d).getDay();
            grid.push({ 
                day: d, 
                dateKey, 
                dayOfWeek, 
                entry: calendarData[dateKey] || { dateKey, ...getDefaultTimes(dayOfWeek), duration: 0 } 
            });
        }
        return grid;
    }, [year, month, calendarData]);

    return (
        <div className="max-w-5xl mx-auto p-4 md:py-10 print:p-0">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-6 print:mb-4 print:items-start">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                        <span className="text-indigo-600">時薪</span>工時計算系統
                    </h1>
                    <p className="text-slate-400 font-medium text-sm mt-1 uppercase tracking-widest no-print">Payroll & Hours Tracking System</p>
                    <div className="hidden print:block text-lg font-bold text-slate-700 mt-2">
                        {year} 年 {month + 1} 月 薪資結算單
                    </div>
                </div>
                
                <div className="flex gap-4 no-print bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    {[
                        { label: '年份', val: year, set: setYear, opt: Array.from({length:5}, (_,i)=>new Date().getFullYear()-2+i) },
                        { label: '月份', val: month, set: setMonth, opt: Array.from({length:12}, (_,i)=>i) }
                    ].map(s => (
                        <div key={s.label} className="flex flex-col px-2">
                            <span className="text-[10px] font-black text-slate-300 mb-1 uppercase tracking-tighter">{s.label}</span>
                            <select 
                                value={s.val} 
                                onChange={e => s.set(Number(e.target.value))}
                                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                            >
                                {s.opt.map(o => (
                                    <option key={o} value={o}>{s.label === '月份' ? `${o+1}月` : `${o}年`}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            </header>

            <main className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:rounded-none print:border-slate-800">
                <div className="grid grid-cols-7 bg-slate-800 print:bg-slate-200">
                    {['日','一','二','三','四','五','六'].map((d,i) => (
                        <div key={d} className={`py-3 text-center text-xs font-black tracking-widest ${i===0||i===6 ? 'text-rose-400' : 'text-slate-100 print:text-slate-800'}`}>
                            週{d}
                        </div>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 border-l border-slate-100">
                    {daysGrid.map((item, i) => (
                        !item ? <div key={`empty-${i}`} className="bg-slate-50 border-r border-b border-slate-100"></div> :
                        <DayCell 
                            key={item.dateKey} 
                            {...item} 
                            onUpdate={handleUpdateEntry} 
                            isWeekend={item.dayOfWeek === 0 || item.dayOfWeek === 6} 
                        />
                    ))}
                </div>
            </main>

            <Summary totalHours={totalHours} hourlyRate={hourlyRate} onRateChange={setHourlyRate} />
            
            <footer className="mt-8 text-center text-slate-400 text-[10px] font-medium tracking-widest no-print">
                &copy; 2025 李金蓉-工時薪資系統 · 資料儲存於瀏覽器本地緩存
            </footer>
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);