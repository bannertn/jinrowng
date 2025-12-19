
export interface WorkEntry {
  dateKey: string;
  start: string;
  end: string;
  skipped: boolean;
  duration: number;
}

export interface CalendarData {
  [key: string]: WorkEntry;
}

export interface DayInfo {
  day: number;
  dateKey: string;
  dayOfWeek: number;
  isCurrentMonth: boolean;
}
