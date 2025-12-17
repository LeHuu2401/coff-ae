import { GoogleGenAI, Type } from "@google/genai";
import { Staff, Shift, ShiftType, WeeklyRequirements } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateSmartSchedule = async (staffList: Staff[], currentShifts: Shift[], requirements: WeeklyRequirements): Promise<Shift[]> => {
  const modelId = "gemini-2.5-flash";
  
  const staffData = JSON.stringify(staffList.map(s => ({
    id: s.id,
    name: s.name,
    role: s.role,
    availability: s.availability
  })));

  // Chuyển requirements thành chuỗi dễ đọc cho AI
  const reqsString = Object.entries(requirements).map(([day, req]) => 
    `- ${day}: Sáng ${req.morning} người, Chiều ${req.afternoon} người, Tối ${req.evening} người.`
  ).join('\n    ');

  const prompt = `
    Bạn là một AI quản lý quán cà phê chuyên nghiệp.
    Hãy tạo lịch làm việc hàng tuần cho nhân viên dựa trên sự rảnh rỗi của họ.
    
    Dữ liệu nhân viên:
    ${staffData}

    Yêu cầu nhân sự cụ thể cho từng ngày (BẮT BUỘC TUÂN THỦ):
    ${reqsString}

    Quy tắc:
    1. Tạo lịch cho các ngày từ Thứ 2 đến Chủ Nhật.
    2. Có 3 ca mỗi ngày: Sáng, Chiều, Tối.
    3. Cố gắng đáp ứng CHÍNH XÁC số lượng người yêu cầu ở trên cho mỗi ca của từng ngày. Nếu không đủ người rảnh, hãy xếp tối đa số người có thể.
    4. Ưu tiên Barista (Pha chế) cho các ca Sáng và Tối nếu có thể.
    5. Chỉ trả về một mảng JSON hợp lệ chứa các đối tượng Shift.
    6. Không thêm markdown formatting như \`\`\`json. Chỉ trả về mảng JSON thô.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              day: { type: Type.STRING },
              shiftType: { type: Type.STRING, enum: [ShiftType.MORNING, ShiftType.AFTERNOON, ShiftType.EVENING] },
              staffIds: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["id", "day", "shiftType", "staffIds"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const generatedShifts: Shift[] = JSON.parse(jsonText);
    return generatedShifts;

  } catch (error) {
    console.error("Error generating schedule:", error);
    throw new Error("Không thể tạo lịch tự động bằng AI.");
  }
};

export const analyzeStockAction = async (item: string, currentQty: number, action: 'check' | 'recipe'): Promise<string> => {
  const modelId = "gemini-2.5-flash";
  const prompt = action === 'check' 
    ? `Tôi có ${currentQty} ${item} trong quán. Số lượng này có ít không? Cho tôi lời khuyên ngắn gọn bằng tiếng Việt (1 câu).`
    : `Cho tôi 3 ý tưởng món đồ uống sáng tạo sử dụng ${item} làm nguyên liệu chính. Trả lời bằng tiếng Việt dưới dạng gạch đầu dòng.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text || "Không thể phân tích.";
  } catch (e) {
    return "Dịch vụ AI đang bận";
  }
}