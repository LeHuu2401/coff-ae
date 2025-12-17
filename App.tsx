import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Calendar, 
  ClipboardList, 
  Package, 
  LayoutDashboard, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Circle, 
  AlertTriangle, 
  Sparkles,
  Search,
  RefreshCw,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  X,
  Info,
  ChevronDown,
  ChevronUp,
  Settings,
  DollarSign,
  FileDown,
  FileUp,
  Edit,
  Phone,
  Mail,
  MoreVertical,
  LogOut,
  UserCircle,
  Save,
  Database,
  ShoppingCart,
  History,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Code
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Imports
import { INITIAL_STAFF, INITIAL_INVENTORY, INITIAL_TASKS, DAYS_OF_WEEK, SHIFT_SLOTS, DEFAULT_WEEKLY_REQUIREMENTS } from './constants';
import { Staff, InventoryItem, Task, Shift, Role, ShiftType, WeeklyRequirements, PurchaseLog, SystemSettings } from './types';
import { generateSmartSchedule, analyzeStockAction } from './services/geminiService';
import { readExcelFile, exportToExcel, parseStaffFromExcel, parseInventoryFromExcel, parseTasksFromExcel } from './services/excelService';

// --- Sub-Components ---

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 transition hover:shadow-md">
    <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

// --- Google Apps Script Content Generator ---
const getAppsScriptCode = () => {
  return `
/* 
   COPY TOÀN BỘ ĐOẠN MÃ NÀY VÀO GOOGLE APPS SCRIPT
   1. Vào script.google.com -> New Project
   2. Dán code này vào file Code.gs
   3. Nhấn Deploy (Triển khai) -> New Deployment
   4. Chọn type: "Web App"
   5. Description: "CoffeeOS API"
   6. Who has access: "Anyone" (Quan trọng!)
   7. Copy URL (bắt đầu bằng https://script.google.com/macros/s/...) và dán vào App
*/

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = JSON.parse(e.postData.contents);
    var fileName = "CoffeeOS_Database";
    
    // Tìm file tồn tại hoặc tạo mới
    var files = DriveApp.getFilesByName(fileName);
    var ss;
    if (files.hasNext()) {
      var file = files.next();
      ss = SpreadsheetApp.open(file);
    } else {
      ss = SpreadsheetApp.create(fileName);
    }
    
    // 1. Cập nhật Sheet KHO
    updateSheet(ss, "Kho_Hang", data.inventory, ["id", "name", "category", "quantity", "unit", "price", "minThreshold", "lastUpdated"]);
    
    // 2. Cập nhật Sheet NHÂN VIÊN
    updateSheet(ss, "Nhan_Vien", data.staff, ["id", "name", "role", "phone", "email"]);
    
    // 3. Cập nhật Sheet CÔNG VIỆC
    updateSheet(ss, "Cong_Viec", data.tasks, ["id", "title", "category", "isCompleted", "description"]);
    
    // 4. Cập nhật Sheet LỊCH SỬ MUA
    updateSheet(ss, "Lich_Su_Mua", data.purchaseLogs, ["timestamp", "staffName", "itemName", "quantity", "totalCost", "note"]);

    return ContentService.createTextOutput(JSON.stringify({ "result": "success", "fileId": ss.getId() })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": e })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function updateSheet(ss, sheetName, dataList, headers) {
  if (!dataList) return;
  
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  sheet.clear(); // Xóa dữ liệu cũ để cập nhật mới
  
  // Ghi header
  if (headers && headers.length > 0) {
    sheet.appendRow(headers);
  }
  
  // Ghi data
  var rows = dataList.map(function(item) {
    return headers.map(function(header) {
      return item[header] || "";
    });
  });
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}
  `.trim();
};

// --- Login Component ---
interface LoginProps {
  onLogin: (user: Staff | 'admin') => void;
  staffList: Staff[];
}

const LoginScreen = ({ onLogin, staffList }: LoginProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Admin Check
    if (name.toLowerCase() === 'admin' && phone === 'admin') {
      onLogin('admin');
      return;
    }

    // Staff Check
    const staffMember = staffList.find(s => 
      s.name.trim().toLowerCase() === name.trim().toLowerCase() && 
      s.phone?.trim() === phone.trim()
    );

    if (staffMember) {
      onLogin(staffMember);
    } else {
      setError('Thông tin đăng nhập không chính xác. Vui lòng kiểm tra Tên và Số điện thoại.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col md:flex-row">
        <div className="w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coffee-100 text-coffee-600 mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">CoffeeOS Login</h2>
            <p className="text-gray-500 text-sm mt-1">Đăng nhập để vào hệ thống quản lý</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhân viên / Tài khoản</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none transition"
                placeholder="Nhập tên của bạn"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại / Mật khẩu</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none transition"
                placeholder="Nhập số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-coffee-600 hover:bg-coffee-700 text-white font-bold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg transform active:scale-95"
            >
              Đăng nhập
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>Admin Login: admin / admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<Staff | 'admin' | null>(null);

  // Data State with LocalStorage Persistence
  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('coffee_staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });
  
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('coffee_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [purchaseLogs, setPurchaseLogs] = useState<PurchaseLog[]>(() => {
    const saved = localStorage.getItem('coffee_purchase_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('coffee_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [schedule, setSchedule] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('coffee_schedule');
    return saved ? JSON.parse(saved) : [];
  });

  const [weeklyRequirements, setWeeklyRequirements] = useState<WeeklyRequirements>(() => {
    const saved = localStorage.getItem('coffee_requirements');
    return saved ? JSON.parse(saved) : DEFAULT_WEEKLY_REQUIREMENTS;
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
      const saved = localStorage.getItem('coffee_settings');
      return saved ? JSON.parse(saved) : { googleSheetUrl: '' };
  });

  // UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'schedule' | 'inventory' | 'tasks'>('dashboard');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{itemId: string, text: string} | null>(null);
  const [selectedConfigDay, setSelectedConfigDay] = useState<string>(DAYS_OF_WEEK[0]); 
  
  // Modals State
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false); // Toggle for code view

  const [newStockItem, setNewStockItem] = useState<Partial<InventoryItem>>({ category: 'Nguyên liệu', unit: 'kg', minThreshold: 5, quantity: 0, price: 0 });
  const [purchaseForm, setPurchaseForm] = useState<{itemId: string, quantity: number, cost: number, note: string}>({ itemId: '', quantity: 0, cost: 0, note: '' });

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<Staff>>({});
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task>>({});
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Refs
  const staffFileInputRef = useRef<HTMLInputElement>(null);
  const inventoryFileInputRef = useRef<HTMLInputElement>(null);
  const taskFileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects for Persistence ---
  useEffect(() => localStorage.setItem('coffee_staff', JSON.stringify(staff)), [staff]);
  useEffect(() => localStorage.setItem('coffee_inventory', JSON.stringify(inventory)), [inventory]);
  useEffect(() => localStorage.setItem('coffee_purchase_logs', JSON.stringify(purchaseLogs)), [purchaseLogs]);
  useEffect(() => localStorage.setItem('coffee_tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('coffee_schedule', JSON.stringify(schedule)), [schedule]);
  useEffect(() => localStorage.setItem('coffee_requirements', JSON.stringify(weeklyRequirements)), [weeklyRequirements]);
  useEffect(() => localStorage.setItem('coffee_settings', JSON.stringify(systemSettings)), [systemSettings]);

  // --- Computed Roles ---
  const isAdmin = currentUser === 'admin';
  const isManager = isAdmin || (typeof currentUser === 'object' && currentUser?.role === Role.MANAGER);
  // Current User ID (if staff)
  const currentStaffId = typeof currentUser === 'object' ? currentUser?.id : null;
  const currentStaffName = typeof currentUser === 'object' ? currentUser?.name : 'Quản lý';

  // --- Handlers: Auth ---
  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // --- Global Data Export (Google Sheets Sync) ---
  const handleSyncToDrive = async () => {
    // 1. Luôn tạo file Excel backup để an toàn
    const combinedData = [
        ...staff.map(s => ({ Type: 'STAFF', Name: s.name, Info: s.role })),
        ...inventory.map(i => ({ Type: 'INVENTORY', Name: i.name, Info: `${i.quantity} ${i.unit}` })),
        ...purchaseLogs.map(p => ({ Type: 'PURCHASE', Name: p.itemName, Info: `-${p.totalCost} VND (${p.staffName})` })),
        ...tasks.map(t => ({ Type: 'TASK', Name: t.title, Info: t.isCompleted ? 'Done' : 'Pending' }))
    ];
    exportToExcel(combinedData, `CoffeeOS_Backup_${new Date().toISOString().split('T')[0]}`);
    
    // 2. Gửi đến Google Sheet (nếu có cấu hình Webhook)
    if (systemSettings.googleSheetUrl) {
        if (systemSettings.googleSheetUrl.includes('script.google.com')) {
            // Đây là Webhook (Apps Script Web App)
            try {
                // Sử dụng mode 'no-cors' để gửi dữ liệu đi 
                // Lưu ý: no-cors không trả về response body, nhưng request vẫn được gửi đi
                await fetch(systemSettings.googleSheetUrl, {
                    method: 'POST',
                    mode: 'no-cors', 
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inventory: inventory,
                        tasks: tasks,
                        purchaseLogs: purchaseLogs,
                        staff: staff,
                        timestamp: new Date().toISOString()
                    })
                });
                alert("Đang đồng bộ... Dữ liệu đã được gửi đến Google Drive của bạn.");
            } catch (error) {
                console.error("Lỗi gửi Webhook:", error);
                alert("Lỗi kết nối đến Google Script. Vui lòng kiểm tra lại URL.");
            }
        } else {
             // Link thường
             window.open(systemSettings.googleSheetUrl, '_blank');
             alert("Đã mở Google Sheet. Vui lòng copy dữ liệu từ file Excel vừa tải xuống.");
        }
    } else {
        alert("Đã tải file Backup. Hãy cấu hình Google Script để tự động lưu vào Drive.");
    }
  };

  // --- Handlers: Staff ---
  const handleOpenAddStaffModal = () => {
    if (!isAdmin) return alert("Chỉ Quản lý mới được thêm nhân viên.");
    setEditingStaff({
      role: Role.SERVER,
      avatar: `https://picsum.photos/100/100?random=${Math.random()}`,
      availability: []
    });
    setIsStaffModalOpen(true);
  };

  const handleEditStaff = (member: Staff) => {
    // Admin can edit anyone. Staff can only edit themselves (and limited fields ideally, but here we allow profile edit)
    if (!isAdmin && member.id !== currentStaffId) {
        return alert("Bạn chỉ có thể chỉnh sửa thông tin của chính mình.");
    }
    setEditingStaff({ ...member });
    setIsStaffModalOpen(true);
  };

  const handleDeleteStaff = (id: string) => {
    if (!isAdmin) return alert("Chỉ Quản lý mới được xóa nhân viên.");
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
      setStaff(prev => prev.filter(s => s.id !== id));
      setSchedule(prev => prev.map(s => ({
        ...s,
        staffIds: s.staffIds.filter(sid => sid !== id)
      })));
    }
  };

  const handleSaveStaff = () => {
    if (!editingStaff.name) {
      alert("Vui lòng nhập tên nhân viên");
      return;
    }
    // Update Password/Phone check
    if (!editingStaff.phone) {
        alert("Bắt buộc phải có Số điện thoại để đăng nhập.");
        return;
    }

    if (editingStaff.id) {
      setStaff(prev => prev.map(s => s.id === editingStaff.id ? { ...s, ...editingStaff } as Staff : s));
      // Update current user session if editing self
      if (typeof currentUser === 'object' && currentUser.id === editingStaff.id) {
          setCurrentUser({ ...currentUser, ...editingStaff } as Staff);
      }
    } else {
      const newMember: Staff = {
        ...editingStaff,
        id: Math.random().toString(36).substr(2, 9),
        availability: editingStaff.availability || [],
      } as Staff;
      setStaff(prev => [...prev, newMember]);
    }
    setIsStaffModalOpen(false);
  };

  const toggleAvailability = (staffId: string, day: string, time: string) => {
    // Permission check: Admin can change anyone. Staff can only change THEMSELVES.
    if (!isAdmin && staffId !== currentStaffId) {
        return alert("Bạn chỉ có thể đăng ký lịch cho chính mình.");
    }

    const slot = `${day} ${time}`;
    setStaff(prev => prev.map(s => {
      if (s.id !== staffId) return s;
      const hasSlot = s.availability.includes(slot);
      return {
        ...s,
        availability: hasSlot 
          ? s.availability.filter(t => t !== slot)
          : [...s.availability, slot]
      };
    }));
  };

  const handleImportStaff = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return alert("Chỉ quản lý được nhập file.");
    if (e.target.files && e.target.files[0]) {
      try {
        const rawData = await readExcelFile(e.target.files[0]);
        const newStaffList = parseStaffFromExcel(rawData);
        if (newStaffList.length > 0) {
            setStaff(prev => [...prev, ...newStaffList]);
            alert(`Đã nhập thành công ${newStaffList.length} nhân viên.`);
        }
      } catch (error) {
        alert("Lỗi khi đọc file Excel.");
      }
      e.target.value = '';
    }
  };

  const handleExportStaff = () => {
    const exportData = staff.map(s => ({
      'Họ tên': s.name,
      'Chức vụ': s.role,
      'Avatar': s.avatar,
      'Điện thoại': s.phone || '',
      'Email': s.email || ''
    }));
    exportToExcel(exportData, 'Danh_Sach_Nhan_Vien');
  };

  // --- Handlers: Inventory (Open to Staff & Admin) ---
  const updateStock = (id: string, amount: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, quantity: Math.max(0, item.quantity + amount), lastUpdated: new Date().toISOString() };
    }));
  };

  const handleOpenInventoryModal = (item?: InventoryItem) => {
    if (item) {
      setNewStockItem({ ...item });
    } else {
      setNewStockItem({ category: 'Nguyên liệu', unit: 'kg', minThreshold: 5, quantity: 0, name: '', price: 0 });
    }
    setIsAddStockModalOpen(true);
  };

  const handleOpenPurchaseModal = () => {
    setPurchaseForm({ itemId: inventory[0]?.id || '', quantity: 1, cost: 0, note: '' });
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseSubmit = () => {
      const item = inventory.find(i => i.id === purchaseForm.itemId);
      if (!item) return;

      // 1. Update Inventory Quantity
      updateStock(item.id, purchaseForm.quantity);

      // 2. Create Purchase Log
      const newLog: PurchaseLog = {
          id: Math.random().toString(36).substr(2, 9),
          itemId: item.id,
          itemName: item.name,
          staffName: currentStaffName,
          quantity: purchaseForm.quantity,
          totalCost: purchaseForm.cost,
          timestamp: new Date().toISOString(),
          note: purchaseForm.note
      };
      setPurchaseLogs(prev => [newLog, ...prev]);
      
      setIsPurchaseModalOpen(false);
  };

  const handleDeleteInventoryItem = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mặt hàng này khỏi kho? Hành động này không thể hoàn tác.")) {
      setInventory(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSaveStockItem = () => {
    if (!newStockItem.name) return;
    if (newStockItem.id) {
      setInventory(prev => prev.map(item => item.id === newStockItem.id ? { ...item, ...newStockItem } as InventoryItem : item));
    } else {
      const newItem: InventoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: newStockItem.name,
        category: newStockItem.category as any,
        quantity: Number(newStockItem.quantity),
        unit: newStockItem.unit || 'kg',
        price: Number(newStockItem.price) || 0,
        minThreshold: Number(newStockItem.minThreshold),
        lastUpdated: new Date().toISOString()
      };
      setInventory([...inventory, newItem]);
    }
    setIsAddStockModalOpen(false);
  };

  const handleAiStockAnalysis = async (item: InventoryItem) => {
    setAiAnalysis({ itemId: item.id, text: "Đang phân tích..." });
    const result = await analyzeStockAction(item.name, item.quantity, 'check');
    setAiAnalysis({ itemId: item.id, text: result });
  };

  const handleImportInventory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const rawData = await readExcelFile(e.target.files[0]);
        const newItems = parseInventoryFromExcel(rawData);
        if (newItems.length > 0) {
            setInventory(prev => [...prev, ...newItems]);
            alert(`Đã nhập thành công ${newItems.length} mặt hàng.`);
        }
      } catch (error) {
        console.error(error);
      }
      e.target.value = '';
    }
  };

  const handleExportInventory = () => {
    const exportData = inventory.map(i => ({
      'Tên hàng': i.name,
      'Danh mục': i.category,
      'Số lượng': i.quantity,
      'Đơn vị': i.unit,
      'Đơn giá': i.price,
      'Định mức': i.minThreshold
    }));
    exportToExcel(exportData, 'Danh_Sach_Kho_Hang');
  };

  // --- Handlers: Tasks (Open to Staff & Admin) ---
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  const handleOpenTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask({ ...task });
    } else {
      setEditingTask({ category: 'Dọn dẹp', title: '', description: '' });
    }
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm("Xóa công việc này khỏi danh sách?")) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSaveTask = () => {
    if (!editingTask.title?.trim()) return;
    if (editingTask.id) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...editingTask } as Task : t));
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: editingTask.title,
        category: editingTask.category as any,
        isCompleted: false,
        description: editingTask.description || ''
      };
      setTasks([...tasks, newTask]);
    }
    setIsTaskModalOpen(false);
  };

  const addTaskQuick = (title: string) => {
     if (!title.trim()) return;
     const newTask: Task = {
       id: Math.random().toString(36).substr(2, 9),
       title,
       category: 'Dọn dẹp',
       isCompleted: false,
       description: ''
     };
     setTasks([...tasks, newTask]);
  }

  const handleImportTasks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const rawData = await readExcelFile(e.target.files[0]);
        const newTasks = parseTasksFromExcel(rawData);
        if (newTasks.length > 0) {
            setTasks(prev => [...prev, ...newTasks]);
            alert(`Đã nhập thành công ${newTasks.length} công việc.`);
        }
      } catch (error) {
        console.error(error);
        alert("Lỗi khi đọc file Excel.");
      }
      e.target.value = '';
    }
  };

  const handleExportTasks = () => {
    const exportData = tasks.map(t => ({
      'Tên công việc': t.title,
      'Danh mục': t.category,
      'Mô tả': t.description,
      'Trạng thái': t.isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành'
    }));
    exportToExcel(exportData, 'Danh_Sach_Cong_Viec');
  };

  // --- Handlers: Schedule (Only Admin runs AI) ---
  const updateDailyRequirement = (shift: 'morning' | 'afternoon' | 'evening', value: number) => {
    if (!isAdmin) return;
    setWeeklyRequirements(prev => ({
      ...prev,
      [selectedConfigDay]: {
        ...prev[selectedConfigDay],
        [shift]: Math.max(1, value)
      }
    }));
  };

  const handleGenerateSchedule = async () => {
    if (!isAdmin) return alert("Chỉ quản lý mới có thể tạo lịch.");
    setLoadingAI(true);
    try {
      const newSchedule = await generateSmartSchedule(staff, schedule, weeklyRequirements);
      setSchedule(newSchedule);
    } catch (error) {
      alert("Tạo lịch thất bại. Vui lòng kiểm tra API Key.");
    } finally {
      setLoadingAI(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // --- Render Condition ---
  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} staffList={staff} />;
  }

  // --- VIEWS ---

  const renderDashboard = () => {
    const lowStockCount = inventory.filter(i => i.quantity <= i.minThreshold).length;
    const tasksPending = tasks.filter(t => !t.isCompleted).length;
    const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    const chartData = inventory.slice(0, 5).map(i => ({
      name: i.name.split(' ')[0], 
      Stock: i.quantity,
      Threshold: i.minThreshold
    }));

    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-3xl font-bold text-coffee-800">Tổng quan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Nhân viên" value={staff.length} icon={Users} color="bg-blue-500" />
          <StatCard title="Sắp hết hàng" value={lowStockCount} icon={AlertTriangle} color="bg-red-500" />
          <StatCard title="Việc cần làm" value={tasksPending} icon={ClipboardList} color="bg-amber-500" />
          <StatCard title="Tổng giá trị kho" value={formatCurrency(totalInventoryValue)} icon={DollarSign} color="bg-emerald-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Mức tồn kho</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Stock" name="Tồn kho" fill="#a07f72" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Threshold" name="Định mức tối thiểu" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-y-auto max-h-80">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Công việc ưu tiên hôm nay</h3>
            <div className="space-y-3">
              {tasks.filter(t => !t.isCompleted).slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-gray-700">{task.title}</span>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-white border rounded text-gray-500">{task.category}</span>
                </div>
              ))}
              {tasks.filter(t => !t.isCompleted).length === 0 && (
                <p className="text-center text-gray-400 py-4">Đã hoàn thành mọi công việc ưu tiên!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStaff = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold text-coffee-800">Quản lý nhân sự</h2>
           <p className="text-sm text-gray-500 mt-1">
             {isAdmin ? 'Bạn có quyền quản lý toàn bộ nhân viên.' : 'Bạn có thể xem danh sách và cập nhật lịch của chính mình.'}
           </p>
        </div>
        
        <div className="flex items-center gap-2">
            {isAdmin && (
                <>
                <input 
                    type="file" 
                    ref={staffFileInputRef} 
                    onChange={handleImportStaff} 
                    accept=".xlsx, .xls" 
                    className="hidden" 
                />
                <button 
                    onClick={() => staffFileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                    <FileUp className="w-4 h-4" /> Nhập Excel
                </button>
                <button 
                    onClick={handleExportStaff}
                    className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                    <FileDown className="w-4 h-4" /> Xuất Excel
                </button>
                <button onClick={handleOpenAddStaffModal} className="flex items-center gap-2 bg-coffee-600 text-white px-4 py-2 rounded-lg hover:bg-coffee-700 transition">
                <Plus className="w-4 h-4" /> Thêm nhân viên
                </button>
                </>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(member => {
            const isMe = member.id === currentStaffId;
            const canEdit = isAdmin || isMe;
            
            return (
          <div key={member.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col group transition-all ${isMe ? 'ring-2 ring-coffee-400 border-coffee-400' : 'border-gray-100'}`}>
             {/* Card Header */}
            <div className="p-6 flex items-center gap-4 border-b border-gray-50 relative">
               {isMe && <div className="absolute top-0 right-0 bg-coffee-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">Tôi</div>}
              
              <div className={`absolute top-4 right-4 flex gap-2 ${canEdit ? 'opacity-0 group-hover:opacity-100' : 'hidden'} transition-opacity`}>
                <button 
                  onClick={() => handleEditStaff(member)}
                  className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                  title="Sửa thông tin"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {isAdmin && (
                    <button 
                    onClick={() => handleDeleteStaff(member.id)}
                    className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"
                    title="Xóa nhân viên"
                    >
                    <Trash2 className="w-4 h-4" />
                    </button>
                )}
              </div>
              
              <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-coffee-100" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 truncate" title={member.name}>{member.name}</h3>
                <span className="text-xs uppercase font-semibold text-coffee-600 bg-coffee-50 px-2 py-1 rounded-full">{member.role}</span>
              </div>
            </div>
            
             {/* Contact Info Section */}
            {(member.phone || member.email) && (
              <div className="px-6 py-3 bg-white border-b border-gray-50 space-y-1">
                {member.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="w-3 h-3" /> {member.phone}
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail className="w-3 h-3" /> <span className="truncate">{member.email}</span>
                  </div>
                )}
              </div>
            )}

            <div className={`p-6 bg-gray-50 flex-grow ${!canEdit ? 'opacity-70 grayscale-[0.5]' : ''}`}>
              <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide flex justify-between">
                  <span>Đăng ký lịch làm</span>
                  {!canEdit && <span className="text-[10px] font-normal italic">Chỉ xem</span>}
              </p>
              <div className="space-y-2 h-32 overflow-y-auto custom-scrollbar">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="text-sm">
                    <span className="font-medium text-gray-700 block mb-1">{day}</span>
                    <div className="flex flex-wrap gap-1">
                      {['Sáng', 'Chiều', 'Tối'].map(time => {
                        const isAvailable = member.availability.includes(`${day} ${time}`);
                        return (
                          <button
                            key={time}
                            disabled={!canEdit}
                            onClick={() => toggleAvailability(member.id, day, time)}
                            className={`text-xs px-2 py-1 rounded border transition ${
                              isAvailable 
                                ? 'bg-green-100 border-green-200 text-green-700' 
                                : 'bg-white border-gray-200 text-gray-400'
                            } ${canEdit ? 'hover:border-gray-300 cursor-pointer' : 'cursor-not-allowed'}`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );})}
      </div>

      {/* STAFF MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingStaff.id ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên mới'}
              </h3>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 mb-4">
                <img 
                  src={editingStaff.avatar || 'https://via.placeholder.com/100'} 
                  alt="Avatar Preview" 
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-coffee-50"
                />
                <input 
                  type="text" 
                  placeholder="URL Ảnh đại diện"
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 text-center text-gray-500"
                  value={editingStaff.avatar || ''}
                  onChange={e => setEditingStaff({...editingStaff, avatar: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                  value={editingStaff.name || ''}
                  onChange={e => setEditingStaff({...editingStaff, name: e.target.value})}
                  placeholder="Nhập tên nhân viên"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                  value={editingStaff.role}
                  onChange={e => setEditingStaff({...editingStaff, role: e.target.value as Role})}
                  disabled={!isAdmin && editingStaff.id === currentStaffId} 
                >
                  {Object.values(Role).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {!isAdmin && <p className="text-xs text-gray-400 mt-1">Liên hệ quản lý để thay đổi chức vụ.</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={editingStaff.phone || ''}
                      onChange={e => setEditingStaff({...editingStaff, phone: e.target.value})}
                      placeholder="Dùng để đăng nhập"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={editingStaff.email || ''}
                      onChange={e => setEditingStaff({...editingStaff, email: e.target.value})}
                      placeholder="example@..."
                    />
                 </div>
              </div>

              <button 
                onClick={handleSaveStaff}
                className="w-full bg-coffee-600 text-white py-3 rounded-lg font-semibold hover:bg-coffee-700 transition mt-4"
              >
                {editingStaff.id ? 'Lưu thay đổi' : 'Thêm nhân viên'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSchedule = () => {
    const getShiftTime = (type: string) => {
      switch(type) {
        case ShiftType.MORNING: return '6:00 - 14:00';
        case ShiftType.AFTERNOON: return '12:00 - 20:00';
        case ShiftType.EVENING: return '18:00 - 23:00';
        default: return '';
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-coffee-800">Lịch làm việc</h2>
            <p className="text-gray-500 text-sm">{isAdmin ? 'Cấu hình và tạo lịch tự động' : 'Xem lịch làm việc tuần này'}</p>
          </div>
          {isAdmin && (
            <button 
                onClick={handleGenerateSchedule}
                disabled={loadingAI}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
                {loadingAI ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                <Sparkles className="w-5 h-5" />
                )}
                {loadingAI ? 'AI đang tính toán...' : 'Tự động xếp lịch'}
            </button>
          )}
        </div>

        {/* Staff Config Controls (Admin Only) */}
        {isAdmin && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 text-indigo-800 font-bold">
                    <Settings className="w-5 h-5" />
                    <span>Cấu hình nhân sự theo ngày (Admin)</span>
                </div>
                
                <div className="relative">
                    <select 
                    value={selectedConfigDay}
                    onChange={(e) => setSelectedConfigDay(e.target.value)}
                    className="appearance-none bg-indigo-50 border border-indigo-200 text-indigo-900 py-2 pl-4 pr-8 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                    {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-indigo-500 absolute right-2 top-3 pointer-events-none" />
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-around gap-4 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">Ca Sáng</span>
                    <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
                        <button onClick={() => updateDailyRequirement('morning', weeklyRequirements[selectedConfigDay].morning - 1)} className="px-3 py-1 hover:bg-gray-100 text-gray-500 border-r">-</button>
                        <span className="px-4 font-mono font-bold text-indigo-600 w-12 text-center">{weeklyRequirements[selectedConfigDay].morning}</span>
                        <button onClick={() => updateDailyRequirement('morning', weeklyRequirements[selectedConfigDay].morning + 1)} className="px-3 py-1 hover:bg-gray-100 text-gray-500 border-l">+</button>
                    </div>
                </div>

                <div className="w-px h-10 bg-gray-300 hidden md:block"></div>
                <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">Ca Chiều</span>
                    <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
                        <button onClick={() => updateDailyRequirement('afternoon', weeklyRequirements[selectedConfigDay].afternoon - 1)} className="px-3 py-1 hover:bg-gray-100 text-gray-500 border-r">-</button>
                        <span className="px-4 font-mono font-bold text-indigo-600 w-12 text-center">{weeklyRequirements[selectedConfigDay].afternoon}</span>
                        <button onClick={() => updateDailyRequirement('afternoon', weeklyRequirements[selectedConfigDay].afternoon + 1)} className="px-3 py-1 hover:bg-gray-100 text-gray-500 border-l">+</button>
                    </div>
                </div>

                <div className="w-px h-10 bg-gray-300 hidden md:block"></div>
                <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">Ca Tối</span>
                    <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
                        <button onClick={() => updateDailyRequirement('evening', weeklyRequirements[selectedConfigDay].evening - 1)} className="px-3 py-1 hover:bg-gray-100 text-gray-500 border-r">-</button>
                        <span className="px-4 font-mono font-bold text-indigo-600 w-12 text-center">{weeklyRequirements[selectedConfigDay].evening}</span>
                        <button onClick={() => updateDailyRequirement('evening', weeklyRequirements[selectedConfigDay].evening + 1)} className="px-3 py-1 hover:bg-gray-100 text-gray-500 border-l">+</button>
                    </div>
                </div>
            </div>
            </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          {schedule.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Chưa có lịch làm việc.</p>
              {isAdmin ? <p className="text-sm">Nhấn nút AI để tạo lịch dựa trên đăng ký của nhân viên.</p> : <p className="text-sm">Vui lòng chờ quản lý cập nhật lịch.</p>}
            </div>
          ) : (
            <table className="w-full min-w-[1000px]">
              <thead className="bg-coffee-50">
                <tr>
                  <th className="p-4 text-left font-semibold text-coffee-800">Ca làm việc</th>
                  {DAYS_OF_WEEK.map(day => (
                    <th key={day} className="p-4 text-left font-semibold text-coffee-800">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {SHIFT_SLOTS.map(slot => (
                  <tr key={slot} className="hover:bg-gray-50/50">
                    <td className="p-4 font-medium text-gray-600 bg-gray-50/30 whitespace-nowrap">
                      <div className="font-bold text-coffee-700">{slot}</div>
                      <div className="text-xs text-gray-400 font-normal">{getShiftTime(slot)}</div>
                    </td>
                    {DAYS_OF_WEEK.map(day => {
                      const shift = schedule.find(s => s.day === day && s.shiftType === slot);
                      const reqKey = slot === ShiftType.MORNING ? 'morning' : slot === ShiftType.AFTERNOON ? 'afternoon' : 'evening';
                      const requiredStaff = weeklyRequirements[day]?.[reqKey] || 0;
                      const currentStaff = shift ? shift.staffIds.length : 0;
                      const isShortStaffed = currentStaff < requiredStaff;
                      const isMeWorking = shift && currentStaffId && shift.staffIds.includes(currentStaffId);

                      return (
                        <td key={`${day}-${slot}`} className={`p-4 align-top border-l border-gray-100 ${isShortStaffed && shift ? 'bg-red-50/30' : ''} ${isMeWorking ? 'bg-indigo-50/50' : ''}`}>
                          <div className="flex justify-between items-start mb-2">
                             {shift && <span className={`text-[10px] px-1.5 rounded ${isShortStaffed ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {currentStaff}/{requiredStaff}
                             </span>}
                          </div>
                          {shift && shift.staffIds.length > 0 ? (
                            <div className="space-y-1">
                              {shift.staffIds.map(sid => {
                                const s = staff.find(st => st.id === sid);
                                return s ? (
                                  <div key={sid} className={`flex items-center gap-2 text-sm border rounded p-1 shadow-sm ${s.id === currentStaffId ? 'bg-indigo-100 border-indigo-200 font-bold text-indigo-700' : 'bg-white border-gray-200'}`}>
                                    <div className={`w-2 h-2 rounded-full ${s.id === currentStaffId ? 'bg-indigo-500' : 'bg-coffee-500'}`}></div>
                                    <span className="truncate max-w-[80px]">{s.name.split(' ').pop()}</span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300 italic">Trống</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderInventory = () => {
    const lowStockItems = inventory.filter(item => item.quantity <= item.minThreshold);
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-3xl font-bold text-coffee-800">Kho & Nguyên vật liệu</h2>
           <div className="flex items-center gap-2">
                <button 
                  onClick={handleOpenPurchaseModal}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md"
                >
                  <ShoppingCart className="w-4 h-4" /> Ghi nhận mua hàng
                </button>
                <div className="w-px h-8 bg-gray-300 mx-1"></div>
                <input 
                    type="file" 
                    ref={inventoryFileInputRef} 
                    onChange={handleImportInventory} 
                    accept=".xlsx, .xls" 
                    className="hidden" 
                />
                <button 
                    onClick={() => inventoryFileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                    <FileUp className="w-4 h-4" /> Nhập Excel
                </button>
                <button 
                    onClick={handleExportInventory}
                    className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                    <FileDown className="w-4 h-4" /> Xuất Excel
                </button>
              <button 
                onClick={() => handleOpenInventoryModal()}
                className="flex items-center gap-2 bg-coffee-600 text-white px-4 py-2 rounded-lg hover:bg-coffee-700 transition"
              >
                <Plus className="w-4 h-4" /> Thêm nguyên liệu
              </button>
           </div>
        </div>

        {/* Cảnh báo tồn kho */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-pulse">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
            <div>
              <h3 className="font-bold text-red-800">Cảnh báo: Sắp hết nguyên liệu!</h3>
              <p className="text-sm text-red-700 mt-1">
                Các mặt hàng sau đang dưới định mức an toàn: {lowStockItems.map(i => i.name).join(', ')}.
              </p>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Tên hàng</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Danh mục</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Số lượng</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Đơn giá</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 text-right text-sm font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.map(item => {
                const isLow = item.quantity <= item.minThreshold;
                return (
                  <tr key={item.id} className={`group hover:bg-gray-50 transition ${isLow ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                    <td className="p-4 font-medium text-gray-800">{item.name}</td>
                    <td className="p-4 text-sm text-gray-500">{item.category}</td>
                    <td className="p-4 text-sm font-mono">
                      {item.quantity} <span className="text-gray-400 text-xs">{item.unit}</span>
                    </td>
                    <td className="p-4 text-sm font-medium text-coffee-700">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="p-4">
                      {isLow ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          Sắp hết
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ổn định
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-1">
                      <button 
                        onClick={() => handleOpenInventoryModal(item)}
                        className="p-1 rounded hover:bg-blue-200 text-blue-600 transition"
                        title="Sửa"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteInventoryItem(item.id)}
                        className="p-1 rounded bg-red-50 hover:bg-red-200 text-red-600 border border-red-100 transition shadow-sm"
                        title="Xóa mặt hàng này"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => updateStock(item.id, -1)}
                        className="p-1 rounded hover:bg-orange-200 text-orange-600 transition"
                        title="Xuất kho"
                      >
                        <ArrowDownCircle className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => updateStock(item.id, 1)}
                        className="p-1 rounded hover:bg-green-200 text-green-600 transition"
                        title="Nhập kho"
                      >
                        <ArrowUpCircle className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleAiStockAnalysis(item)}
                        className="p-1 rounded hover:bg-purple-200 text-purple-600 transition"
                        title="AI Phân tích"
                      >
                        <Sparkles className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Bảng lịch sử mua hàng */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Lịch sử nhập hàng / Mua thêm (Real-time)</h3>
            </div>
            <div className="max-h-60 overflow-y-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100 text-xs">
                        <tr>
                            <th className="p-3 text-left font-medium text-gray-500">Thời gian</th>
                            <th className="p-3 text-left font-medium text-gray-500">Người mua</th>
                            <th className="p-3 text-left font-medium text-gray-500">Mặt hàng</th>
                            <th className="p-3 text-left font-medium text-gray-500">Số lượng</th>
                            <th className="p-3 text-left font-medium text-gray-500">Chi phí</th>
                            <th className="p-3 text-left font-medium text-gray-500">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {purchaseLogs.length === 0 ? (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-400">Chưa có lịch sử mua hàng</td></tr>
                        ) : (
                            purchaseLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="p-3 text-gray-600">{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                                    <td className="p-3 font-medium text-coffee-700">{log.staffName}</td>
                                    <td className="p-3">{log.itemName}</td>
                                    <td className="p-3 font-mono text-green-600">+{log.quantity}</td>
                                    <td className="p-3 font-medium">{formatCurrency(log.totalCost)}</td>
                                    <td className="p-3 text-gray-500 italic text-xs">{log.note || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Modal Thêm/Sửa nguyên liệu */}
        {isAddStockModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {newStockItem.id ? 'Sửa thông tin hàng hóa' : 'Thêm nguyên liệu mới'}
                </h3>
                <button onClick={() => setIsAddStockModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên nguyên liệu</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                    value={newStockItem.name || ''}
                    onChange={e => setNewStockItem({...newStockItem, name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={newStockItem.category}
                      onChange={e => setNewStockItem({...newStockItem, category: e.target.value as any})}
                    >
                      <option value="Nguyên liệu">Nguyên liệu</option>
                      <option value="Bao bì">Bao bì</option>
                      <option value="Hàng hóa">Hàng hóa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={newStockItem.unit || ''}
                      onChange={e => setNewStockItem({...newStockItem, unit: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                    <input 
                      type="number" 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={newStockItem.quantity}
                      onChange={e => setNewStockItem({...newStockItem, quantity: Number(e.target.value)})}
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá</label>
                    <input 
                      type="number" 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={newStockItem.price}
                      onChange={e => setNewStockItem({...newStockItem, price: Number(e.target.value)})}
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Định mức</label>
                    <input 
                      type="number" 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={newStockItem.minThreshold}
                      onChange={e => setNewStockItem({...newStockItem, minThreshold: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSaveStockItem}
                  className="w-full bg-coffee-600 text-white py-3 rounded-lg font-semibold hover:bg-coffee-700 transition mt-4"
                >
                  {newStockItem.id ? 'Lưu thay đổi' : 'Thêm vào kho'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ghi nhận mua hàng (Purchase Modal) */}
        {isPurchaseModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                    <h3 className="text-xl font-bold text-gray-800">Ghi nhận mua hàng</h3>
                </div>
                <button onClick={() => setIsPurchaseModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chọn mặt hàng</label>
                  <select 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={purchaseForm.itemId}
                      onChange={e => setPurchaseForm({...purchaseForm, itemId: e.target.value})}
                  >
                      {inventory.map(item => (
                          <option key={item.id} value={item.id}>{item.name} (Hiện có: {item.quantity} {item.unit})</option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng mua thêm</label>
                    <input 
                      type="number" 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={purchaseForm.quantity}
                      onChange={e => setPurchaseForm({...purchaseForm, quantity: Number(e.target.value)})}
                      min="1"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tổng chi phí (VND)</label>
                    <input 
                      type="number" 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={purchaseForm.cost}
                      onChange={e => setPurchaseForm({...purchaseForm, cost: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (Nơi mua, hóa đơn...)</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={purchaseForm.note}
                      onChange={e => setPurchaseForm({...purchaseForm, note: e.target.value})}
                      placeholder="Ví dụ: Mua ở WinMart, Siêu thị..."
                    />
                </div>

                <div className="p-3 bg-gray-50 rounded text-sm text-gray-600">
                    <p>Người thực hiện: <span className="font-bold">{currentStaffName}</span></p>
                    <p>Thời gian: <span className="font-bold">{new Date().toLocaleString('vi-VN')}</span></p>
                </div>

                <button 
                  onClick={handlePurchaseSubmit}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition mt-4"
                >
                  Xác nhận nhập kho
                </button>
              </div>
            </div>
          </div>
        )}

        {aiAnalysis && (
          <div className="fixed bottom-6 right-6 bg-white p-4 rounded-xl shadow-xl border border-purple-100 max-w-sm animate-fade-in-up z-50">
            <div className="flex justify-between items-start mb-2">
               <div className="flex items-center gap-2 text-purple-600 font-semibold">
                 <Sparkles className="w-4 h-4" /> AI Gợi ý
               </div>
               <button onClick={() => setAiAnalysis(null)} className="text-gray-400 hover:text-gray-600"><Trash2 className="w-4 h-4"/></button>
            </div>
            <p className="text-sm text-gray-700">{aiAnalysis.text}</p>
          </div>
        )}
      </div>
    );
  };

  const renderTasks = () => (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-coffee-800">Quản lý công việc</h2>
        <div className="flex items-center gap-2">
            <input 
                type="file" 
                ref={taskFileInputRef} 
                onChange={handleImportTasks} 
                accept=".xlsx, .xls" 
                className="hidden" 
            />
            <button 
                onClick={() => taskFileInputRef.current?.click()}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
            >
                <FileUp className="w-4 h-4" /> Nhập Excel
            </button>
            <button 
                onClick={handleExportTasks}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
            >
                <FileDown className="w-4 h-4" /> Xuất Excel
            </button>
            <button 
              onClick={() => handleOpenTaskModal()}
              className="flex items-center gap-2 bg-coffee-600 text-white px-4 py-2 rounded-lg hover:bg-coffee-700 transition"
            >
              <Plus className="w-4 h-4" /> Thêm công việc
            </button>
        </div>
      </div>
      
      <div className="flex gap-4">
        <input 
          id="newTaskInput"
          type="text" 
          placeholder="Thêm nhanh công việc dọn dẹp..." 
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addTaskQuick(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Mở ca', 'Dọn dẹp', 'Đóng ca'].map(category => (
          <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">{category}</h3>
              <span className="text-xs text-gray-400 font-mono">
                {tasks.filter(t => t.category === category).length} việc
              </span>
            </div>
            <div className="p-4 space-y-3">
              {tasks.filter(t => t.category === category).map(task => (
                <div 
                  key={task.id} 
                  className={`flex flex-col p-3 rounded-lg border transition group ${
                    task.isCompleted ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 hover:border-coffee-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 cursor-pointer flex-1" onClick={() => toggleTask(task.id)}>
                       <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        task.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}>
                        {task.isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {task.title}
                      </span>
                    </div>
                    
                    {/* Action buttons for task */}
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => handleOpenTaskModal(task)} className="p-1 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4"/></button>
                      <button 
                        onClick={() => handleDeleteTask(task.id)} 
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition"
                        title="Xóa công việc này"
                      >
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>

                  {/* Task Details Expander */}
                  {task.description && (
                     <div className="ml-8 mt-2">
                       <button 
                        onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                        className="text-xs text-blue-500 flex items-center gap-1 hover:text-blue-700"
                       >
                         {expandedTaskId === task.id ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                         {expandedTaskId === task.id ? 'Ẩn chi tiết' : 'Chi tiết công việc'}
                       </button>
                       {expandedTaskId === task.id && (
                         <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-100">
                           {task.description}
                         </div>
                       )}
                     </div>
                  )}
                </div>
              ))}
              {tasks.filter(t => t.category === category).length === 0 && (
                <div className="text-center text-gray-300 py-4 text-sm">Không có việc</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL Task */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingTask.id ? 'Sửa công việc' : 'Thêm công việc mới'}
              </h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên công việc <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                  value={editingTask.title || ''}
                  onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                  placeholder="Ví dụ: Kiểm tra máy pha..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                  value={editingTask.category}
                  onChange={e => setEditingTask({...editingTask, category: e.target.value as any})}
                >
                  <option value="Mở ca">Mở ca</option>
                  <option value="Dọn dẹp">Dọn dẹp</option>
                  <option value="Đóng ca">Đóng ca</option>
                  <option value="Bảo trì">Bảo trì</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none h-24"
                  value={editingTask.description || ''}
                  onChange={e => setEditingTask({...editingTask, description: e.target.value})}
                  placeholder="Hướng dẫn thực hiện..."
                />
              </div>

              <button 
                onClick={handleSaveTask}
                className="w-full bg-coffee-600 text-white py-3 rounded-lg font-semibold hover:bg-coffee-700 transition mt-4"
              >
                {editingTask.id ? 'Lưu thay đổi' : 'Tạo công việc'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // --- Main Layout Render ---
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-100">
            <div className="bg-coffee-600 text-white p-2 rounded-lg">
              <Users className="w-6 h-6" /> 
            </div>
            <h1 className="hidden lg:block ml-3 font-bold text-xl text-coffee-800">CoffeeOS</h1>
          </div>
          
          <nav className="p-4 space-y-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
              { id: 'staff', icon: Users, label: 'Nhân sự' },
              { id: 'schedule', icon: Calendar, label: 'Lịch làm việc' },
              { id: 'inventory', icon: Package, label: 'Kho hàng' },
              { id: 'tasks', icon: ClipboardList, label: 'Công việc' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-center lg:justify-start p-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-coffee-50 text-coffee-700 shadow-sm font-medium' 
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                }`}
              >
                <item.icon className="w-6 h-6 lg:w-5 lg:h-5" />
                <span className="hidden lg:block ml-3">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-coffee-200 flex items-center justify-center text-coffee-700 font-bold">
                    {isAdmin ? 'A' : (typeof currentUser === 'object' ? currentUser.name.charAt(0) : 'U')}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-gray-800 truncate">{isAdmin ? 'Admin' : (typeof currentUser === 'object' ? currentUser.name : '')}</p>
                    <p className="text-xs text-gray-500 truncate">{isAdmin ? 'Quản lý cấp cao' : (typeof currentUser === 'object' ? currentUser.role : '')}</p>
                </div>
            </div>
            
            {isAdmin && (
                <button 
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 mb-2 p-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs hover:bg-indigo-100 transition font-medium"
                >
                    <Settings className="w-4 h-4" /> Cấu hình hệ thống
                </button>
            )}

            <button 
                onClick={handleSyncToDrive}
                className="w-full flex items-center justify-center gap-2 mb-2 p-2 rounded-lg bg-green-50 text-green-700 text-xs hover:bg-green-100 transition font-medium"
            >
                <Database className="w-4 h-4" /> Đồng bộ Drive
            </button>

            <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-red-50 text-red-600 text-xs hover:bg-red-100 transition font-medium"
            >
                <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'staff' && renderStaff()}
          {activeTab === 'schedule' && renderSchedule()}
          {activeTab === 'inventory' && renderInventory()}
          {activeTab === 'tasks' && renderTasks()}
        </div>
      </main>

       {/* Settings Modal (Admin Only) */}
       {isSettingsModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-gray-500"/>
                  Cấu hình hệ thống
              </h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="font-semibold text-blue-800 text-sm mb-2 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4"/> Kết nối Google Sheet (Tự động lưu Drive)
                  </h4>
                  <p className="text-xs text-blue-700 mb-2 leading-relaxed">
                      Để dữ liệu tự động lưu thành file Google Sheet trên Drive của bạn, bạn cần tạo một Google Apps Script.
                  </p>
                  
                  <div className="mt-3">
                      <button 
                        onClick={() => setShowScriptCode(!showScriptCode)}
                        className="flex items-center gap-2 text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded hover:bg-blue-700 transition"
                      >
                         <Code className="w-4 h-4"/> 
                         {showScriptCode ? 'Ẩn mã Script' : 'Lấy mã Script để tạo Webhook'}
                      </button>
                  </div>
                  
                  {showScriptCode && (
                      <div className="mt-3 bg-gray-900 text-gray-300 p-3 rounded-lg text-[10px] font-mono overflow-x-auto relative group">
                          <button 
                             onClick={() => {
                                 navigator.clipboard.writeText(getAppsScriptCode());
                                 alert("Đã copy mã vào clipboard!");
                             }}
                             className="absolute top-2 right-2 bg-white/10 p-1.5 rounded hover:bg-white/20 transition"
                             title="Copy Code"
                          >
                              <Copy className="w-4 h-4 text-white"/>
                          </button>
                          <pre className="whitespace-pre-wrap">{getAppsScriptCode()}</pre>
                      </div>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn Google Sheet / Webhook URL</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none text-sm"
                  value={systemSettings.googleSheetUrl}
                  onChange={e => setSystemSettings({...systemSettings, googleSheetUrl: e.target.value})}
                  placeholder="https://script.google.com/macros/s/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                    Dán URL Web App bạn vừa tạo ở trên vào đây.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button 
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="bg-coffee-600 text-white px-4 py-2 rounded-lg hover:bg-coffee-700 transition"
                >
                    Lưu cấu hình
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}