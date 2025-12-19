
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
 * 預設時間與狀態邏輯：
 * 1. 星期二 (Day 2): 16:00 - 18:00，不跳過
 * 2. 星期六、日 (Day 0, 6): 空白時間，預設勾選「跳過」
 * 3. 其他日子: 11:30 - 18:30，不跳過
 */
export const getDefaultTimes = (dayOfWeek: number): { start: string; end: string; skipped: boolean } => {
  if (dayOfWeek === 2) {
    return { start: '16:00', end: '18:00', skipped: false };
  }
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { start: '', end: '', skipped: true };
  }
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
