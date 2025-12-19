
import React from 'react';

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
    <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 print:border-2 print:border-black print:rounded-none print:shadow-none print:mt-4">
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

      <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-12 print:mt-4 print:pt-4 print:gap-4">
        <div className="flex flex-col gap-4">
          <span className="text-sm font-bold text-slate-600 print:text-black">員工姓名簽章</span>
          <div className="border-b-2 border-slate-300 h-10 print:border-black"></div>
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-sm font-bold text-slate-600 print:text-black">管理者審核</span>
          <div className="border-b-2 border-slate-300 h-10 print:border-black"></div>
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-sm font-bold text-slate-600 print:text-black">日期</span>
          <div className="border-b-2 border-slate-300 h-10 print:border-black"></div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
