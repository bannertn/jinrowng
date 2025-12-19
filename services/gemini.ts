
import { GoogleGenAI } from "@google/genai";
import { CalendarData } from "../types";

export const analyzeMonthlyWork = async (data: CalendarData, hourlyRate: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const entries = Object.values(data).filter(e => !e.skipped && e.duration > 0);
  const totalHours = entries.reduce((acc, curr) => acc + curr.duration, 0);
  const totalSalary = totalHours * hourlyRate;
  
  const prompt = `
    請分析以下月份的工時數據並給予簡短建議。
    時薪：${hourlyRate} 元
    總天數：${entries.length} 天
    總工時：${totalHours.toFixed(2)} 小時
    總薪資：${totalSalary.toFixed(0)} 元
    
    詳細數據：
    ${entries.map(e => `${e.dateKey}: ${e.start}-${e.end} (${e.duration.toFixed(1)}小時)`).join('\n')}
    
    請以專業主管的角度，用繁體中文回應，包含對工作規律性的評價及可能的薪資增長建議。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "無法獲取分析結果。";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "分析過程中發生錯誤。";
  }
};
