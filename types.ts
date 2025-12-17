export enum Role {
  MANAGER = 'Quản lý',
  BARISTA = 'Pha chế',
  SERVER = 'Phục vụ',
  CLEANER = 'Tạp vụ'
}

export interface Staff {
  id: string;
  name: string;
  role: Role;
  availability: string[]; // e.g., ["Thứ 2 Sáng", "Thứ 3 Tối"]
  avatar: string;
  phone?: string;
  email?: string;
}

export enum ShiftType {
  MORNING = 'Sáng',
  AFTERNOON = 'Chiều',
  EVENING = 'Tối'
}

export interface Shift {
  id: string;
  day: string; // Thứ 2, Thứ 3...
  shiftType: ShiftType;
  staffIds: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Nguyên liệu' | 'Bao bì' | 'Hàng hóa';
  quantity: number;
  unit: string;
  price: number; // Giá nhập/đơn vị
  minThreshold: number;
  lastUpdated: string;
}

export interface PurchaseLog {
  id: string;
  itemId: string;
  itemName: string;
  staffName: string; // Tên nhân viên mua
  quantity: number;
  totalCost: number; // Tổng chi phí mua
  timestamp: string; // Thời gian thực
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string; // Thêm mô tả chi tiết
  category: 'Mở ca' | 'Dọn dẹp' | 'Đóng ca' | 'Bảo trì';
  isCompleted: boolean;
  assignedTo?: string; // Staff ID
}

export interface ScheduleGenerationRequest {
  staff: Staff[];
  days: string[];
  shiftsPerDay: string[];
}

export interface DailyRequirement {
  morning: number;
  afternoon: number;
  evening: number;
}

export type WeeklyRequirements = Record<string, DailyRequirement>;

export interface SystemSettings {
  googleSheetUrl: string; // Đường dẫn Webhook hoặc Link trang tính
}