// src/utils/geminiExtractor.util.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';

if (!config.google.apiKey) {
  throw new Error('Google API key is not configured');
}
const genAI = new GoogleGenerativeAI(config.google.apiKey);

interface ExtractedPage {
  loaiTrang: 'NOI_DUNG' | 'CAU_HOI';
  tieuDe: string;
  noiDung?: string;
  loaiCauTraLoi?: 'SINGLE_SELECT' | 'MULTI_SELECT' | 'TRUE_FALSE';
  danhSachLuaChon?: Array<{
    noiDung: string;
    ketQua: boolean;
  }>;
}

interface ExtractedRoomData {
  tenPhong: string;
  moTa: string;
  danhSachTrang: ExtractedPage[];
}

const systemPrompt = `
Bạn là một AI chuyên gia trong việc tạo nội dung học tập từ tài liệu. 
Nhiệm vụ của bạn là phân tích nội dung được cung cấp và tạo ra một cấu trúc phòng học bao gồm:

1. Các slide kiến thức (loaiTrang: "NOI_DUNG")
2. Các câu hỏi kiểm tra (loaiTrang: "CAU_HOI") với các lựa chọn

Hãy chia nội dung thành các slide ngắn gọn, dễ hiểu. Mỗi slide nên tập trung vào một ý chính.
Tạo ít nhất 3-5 câu hỏi kiểm tra dựa trên nội dung đã học(số lượng có thể nhiều hơn nếu cần thiết, hãy ưu tiên User Prompt để tạo ra các nội dung và câu hỏi phù hợp).

Trả về kết quả dưới dạng JSON với cấu trúc sau:
{
  "moTa": "Mô tả ngắn về nội dung phòng học",
  "danhSachTrang": [
    {
      "loaiTrang": "NOI_DUNG",
      "tieuDe": "Tiêu đề slide",
      "noiDung": "Nội dung chi tiết"
    },
    {
      "loaiTrang": "CAU_HOI",
      "tieuDe": "Câu hỏi",
      "loaiCauTraLoi": "SINGLE_SELECT", // Hoặc "MULTI_SELECT", "TRUE_FALSE"
      "danhSachLuaChon": [
        {"noiDung": "Lựa chọn A", "ketQua": false},
        {"noiDung": "Lựa chọn B", "ketQua": true},
        {"noiDung": "Lựa chọn C", "ketQua": false},
        {"noiDung": "Lựa chọn D", "ketQua": false}
      ]
    }
  ]
}

Lưu ý:
- Mỗi câu hỏi PHẢI có ít nhất một đáp án đúng (ketQua: true)
- Nội dung phải súc tích, dễ hiểu
- Câu hỏi phải liên quan trực tiếp đến nội dung đã học
- Sử dụng tiếng Việt
- Tránh lặp lại nội dung trong các slide
- Đảm bảo mỗi slide có tiêu đề rõ ràng
- Mỗi nội dung nên có câu hỏi kiểm tra tương ứng
- Nên kết hợp MULTI_SELECT, TRUE_FALSE để tạo sự đa dạng trong câu hỏi
`;

export const generateRoomDataFromContent = async (
  content: string,
  roomName: string,
  userPrompt: string
): Promise<ExtractedRoomData | null> => {
  try {
    console.log('Starting room data generation with Gemini...');
    console.log('Content length:', content.length);
    console.log('Room name:', roomName);

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json'
      }
    });

    const prompt = `
${systemPrompt}

User Prompt:
${userPrompt}

Tên phòng học: ${roomName}

Nội dung tài liệu:
${content}

Hãy tạo cấu trúc phòng học từ nội dung trên.
`;
    console.log('Prompt length:', prompt.length);
    console.log('Prompt:', prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const parsedData = JSON.parse(text);

      // Validate và clean data
      const roomData: ExtractedRoomData = {
        tenPhong: roomName,
        moTa: parsedData.moTa || 'Phòng học được tạo từ tài liệu',
        danhSachTrang: parsedData.danhSachTrang.map((trang: any, index: number) => ({
          ...trang,
          thuTu: index + 1,
          // Set default values cho các trường optional
          diem: 'BINH_THUONG',
          thoiGianGioiHan: trang.loaiTrang === 'CAU_HOI' ? 30 : null,
          // Ensure all required fields are present
          tieuDe: trang.tieuDe || '',
          noiDung: trang.noiDung || '',
          loaiCauTraLoi:
            trang.loaiCauTraLoi || (trang.loaiTrang === 'CAU_HOI' ? 'SINGLE_SELECT' : undefined)
        }))
      };

      return roomData;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', text);
      return null;
    }
  } catch (error) {
    console.error('Error generating room data with Gemini:', error);
    return null;
  }
};
