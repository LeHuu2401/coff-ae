import { InventoryItem, Role, Staff, Task, ShiftType, WeeklyRequirements } from "./types";

export const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

export const INITIAL_STAFF: Staff[] = [
  { id: '1', name: 'Nguyễn Văn A', role: Role.MANAGER, availability: ['Thứ 2 Sáng', 'Thứ 2 Chiều', 'Thứ 3 Sáng', 'Thứ 4 Sáng', 'Thứ 5 Sáng', 'Thứ 6 Sáng'], avatar: 'https://picsum.photos/100/100?random=1', phone: '0901234567', email: 'vana@coffeeos.vn' },
  { id: '2', name: 'Trần Thị B', role: Role.BARISTA, availability: ['Thứ 2 Sáng', 'Thứ 2 Tối', 'Thứ 4 Tối', 'Thứ 5 Tối', 'Thứ 6 Tối', 'Thứ 7 Sáng', 'Chủ Nhật Sáng'], avatar: 'https://picsum.photos/100/100?random=2', phone: '0909888777', email: 'thib@coffeeos.vn' },
  { id: '3', name: 'Lê Văn C', role: Role.BARISTA, availability: ['Thứ 3 Chiều', 'Thứ 4 Chiều', 'Thứ 5 Chiều', 'Thứ 6 Chiều', 'Thứ 7 Tối', 'Chủ Nhật Tối'], avatar: 'https://picsum.photos/100/100?random=3', phone: '0912345678', email: 'vanc@coffeeos.vn' },
  { id: '4', name: 'Phạm Thị D', role: Role.SERVER, availability: ['Thứ 2 Tối', 'Thứ 3 Tối', 'Thứ 4 Tối', 'Thứ 7 Chiều', 'Chủ Nhật Chiều'], avatar: 'https://picsum.photos/100/100?random=4', phone: '0933444555', email: 'thid@coffeeos.vn' },
  { id: '5', name: 'Hoàng Văn E', role: Role.SERVER, availability: ['Thứ 2 Sáng', 'Thứ 3 Sáng', 'Thứ 4 Sáng', 'Thứ 5 Sáng', 'Thứ 6 Sáng'], avatar: 'https://picsum.photos/100/100?random=5', phone: '0944555666', email: 'vane@coffeeos.vn' },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Hạt cà phê (Arabica)', category: 'Nguyên liệu', quantity: 15, unit: 'kg', price: 250000, minThreshold: 5, lastUpdated: new Date().toISOString() },
  { id: '2', name: 'Sữa tươi', category: 'Nguyên liệu', quantity: 8, unit: 'lít', price: 32000, minThreshold: 10, lastUpdated: new Date().toISOString() },
  { id: '3', name: 'Đường', category: 'Nguyên liệu', quantity: 20, unit: 'kg', price: 18000, minThreshold: 2, lastUpdated: new Date().toISOString() },
  { id: '4', name: 'Ly mang đi', category: 'Bao bì', quantity: 450, unit: 'cái', price: 1500, minThreshold: 100, lastUpdated: new Date().toISOString() },
  { id: '5', name: 'Khăn giấy', category: 'Bao bì', quantity: 1200, unit: 'cái', price: 200, minThreshold: 200, lastUpdated: new Date().toISOString() },
];

export const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Kiểm tra áp suất máy pha', description: 'Đảm bảo áp suất nồi hơi ở mức 1-1.5 bar và áp suất chiết xuất ở mức 9 bar. Xả hơi vòi đánh sữa.', category: 'Mở ca', isCompleted: false },
  { id: '2', title: 'Lau dọn bàn ghế', description: 'Sử dụng dung dịch sát khuẩn lau sạch toàn bộ mặt bàn và sắp xếp lại ghế ngay ngắn.', category: 'Dọn dẹp', isCompleted: false },
  { id: '3', title: 'Châm thêm sữa vào tủ lạnh', description: 'Kiểm tra hạn sử dụng sữa cũ, đưa ra ngoài, xếp sữa mới vào trong theo nguyên tắc FIFO.', category: 'Mở ca', isCompleted: true },
  { id: '4', title: 'Đếm tiền két', description: 'Tổng kết doanh thu ca, ghi vào sổ bàn giao và để lại tiền lẻ mệnh giá nhỏ cho ca sau.', category: 'Đóng ca', isCompleted: false },
  { id: '5', title: 'Đổ rác', description: 'Thu gom rác tại quầy bar và khu vực khách, thay bao rác mới.', category: 'Đóng ca', isCompleted: false },
];

export const SHIFT_SLOTS = [ShiftType.MORNING, ShiftType.AFTERNOON, ShiftType.EVENING];

export const DEFAULT_WEEKLY_REQUIREMENTS: WeeklyRequirements = DAYS_OF_WEEK.reduce((acc, day) => {
  // Mặc định cuối tuần đông hơn
  const isWeekend = day === 'Thứ 7' || day === 'Chủ Nhật';
  acc[day] = {
    morning: isWeekend ? 3 : 2,
    afternoon: isWeekend ? 3 : 2,
    evening: isWeekend ? 3 : 2
  };
  return acc;
}, {} as WeeklyRequirements);