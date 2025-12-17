import * as XLSX from 'xlsx';
import { InventoryItem, Staff, Role, Task } from '../types';

// Hàm đọc file Excel
export const readExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

// Hàm xuất file Excel
export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Hàm chuẩn hóa dữ liệu nhân viên từ Excel
export const parseStaffFromExcel = (data: any[]): Staff[] => {
  return data.map((row: any) => ({
    id: Math.random().toString(36).substr(2, 9),
    name: row['Họ tên'] || row['Name'] || 'Nhân viên mới',
    role: (row['Chức vụ'] || row['Role'] || Role.SERVER) as Role,
    availability: [], // Mặc định chưa có lịch
    avatar: row['Avatar'] || `https://picsum.photos/100/100?random=${Math.random()}`
  }));
};

// Hàm chuẩn hóa dữ liệu kho từ Excel
export const parseInventoryFromExcel = (data: any[]): InventoryItem[] => {
  return data.map((row: any) => ({
    id: Math.random().toString(36).substr(2, 9),
    name: row['Tên hàng'] || row['Name'] || 'Hàng mới',
    category: (row['Danh mục'] || row['Category'] || 'Nguyên liệu') as any,
    quantity: Number(row['Số lượng'] || row['Quantity'] || 0),
    unit: row['Đơn vị'] || row['Unit'] || 'kg',
    price: Number(row['Đơn giá'] || row['Price'] || 0),
    minThreshold: Number(row['Định mức'] || row['Threshold'] || 5),
    lastUpdated: new Date().toISOString()
  }));
};

// Hàm chuẩn hóa dữ liệu công việc từ Excel
export const parseTasksFromExcel = (data: any[]): Task[] => {
  return data.map((row: any) => ({
    id: Math.random().toString(36).substr(2, 9),
    title: row['Tên công việc'] || row['Title'] || 'Công việc mới',
    description: row['Mô tả'] || row['Description'] || '',
    category: (row['Danh mục'] || row['Category'] || 'Dọn dẹp') as any,
    isCompleted: (row['Trạng thái'] === 'Hoàn thành' || row['Status'] === 'Completed') ? true : false,
    assignedTo: undefined
  }));
};