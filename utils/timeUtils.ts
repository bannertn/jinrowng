
import { WorkEntry } from '../types';

export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

export const calculateDuration = (start: string, end: string): number => {
  const startMins = timeToMinutes(start);
  const endMins = timeToMinutes(end);
  if (endMins > startMins) {
    return (endMins - startMins) / 60;
  }
  return 0;
};

/**
 * 預設時間邏輯：
 * 1. 星期二 (Day index 2): 保持原樣 (16:00 - 18:00)，不跳過
 * 2. 星期六、日 (Day index 0, 6): 不設預設值 (空白)，預設「跳過」
 * 3. 其他日子 (週一、三、四、五): 11:30 - 18:30，不跳過
 */
export const getDefaultTimes = (dayOfWeek: number): { start: string; end: string; skipped: boolean } => {
  // 星期二不修改，維持特定預設
  if (dayOfWeek === 2) {
    return { start: '16:00', end: '18:00', skipped: false };
  }
  
  // 星期六與星期日不設定預設工時，且預設勾選「跳過」
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { start: '', end: '', skipped: true };
  }
  
  // 其餘日子預設為 11:30 - 18:30，不跳過
  return { start: '11:30', end: '18:30', skipped: false };
};

export const formatDateKey = (year: number, month: number, day: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};
