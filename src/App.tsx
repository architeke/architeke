import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  FolderOpen, 
  Package, 
  Settings, 
  HelpCircle, 
  LogOut,
  Search,
  Bell,
  User,
  Save,
  FileText,
  Hammer,
  SquareDashedBottom,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Edit3,
  CloudDownload,
  History,
  TrendingUp,
  Info,
  Layers,
  DraftingCompass,
  Ruler,
  X,
  FileSpreadsheet,
  MessageSquare,
  Sparkles,
  Send,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableCell, 
  TableRow, 
  WidthType, 
  AlignmentType, 
  TextRun, 
  HeadingLevel, 
  BorderStyle,
  VerticalAlign,
} from 'docx';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

// --- Types ---
type Page = 'estimation' | 'projects' | 'settings';

interface Project {
  id: string;
  name: string;
  code: string;
  area: number;
  date: string;
  budget: number;
  status: 'Hoàn thiện' | 'Đang dự toán' | 'Nháp';
  image: string;
}

// --- Components ---

const Sidebar = ({ activePage, setActivePage }: { activePage: Page, setActivePage: (p: Page) => void }) => {
  const menuItems = [
    { id: 'estimation', label: 'Công cụ Dự toán', icon: Calculator },
    { id: 'projects', label: 'Dự án đã lưu', icon: FolderOpen },
    { id: 'settings', label: 'Cài đặt đơn giá', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#f4f2fc] flex flex-col py-8 z-30 pt-20 border-r border-[#eeedf7]">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#dde1ff] flex items-center justify-center rounded">
          <Hammer className="text-[#00288e] w-6 h-6" />
        </div>
        <div>
          <p className="font-headline font-bold text-sm text-[#00288e]">Kỹ sư Trưởng</p>
          <p className="text-xs text-[#444653]">Precision Build</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => ['estimation', 'projects', 'settings'].includes(item.id) && setActivePage(item.id as Page)}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-all duration-200 font-headline text-sm ${
              activePage === item.id 
                ? 'bg-[#dde1ff] text-[#00288e] font-bold rounded-r-full' 
                : 'text-[#444653] hover:bg-[#e3e1eb] font-medium'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto px-6 space-y-1">
        <button className="flex items-center gap-3 py-3 text-[#444653] hover:text-primary font-headline font-medium text-sm w-full text-left">
          <HelpCircle size={20} />
          <span>Trợ giúp</span>
        </button>
        <button className="flex items-center gap-3 py-3 text-red-600 hover:opacity-80 font-headline font-medium text-sm w-full text-left">
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

const Header = () => (
  <header className="fixed top-0 z-40 w-full bg-[#fbf8ff] flex justify-between items-center px-6 py-3 border-b border-[#eeedf7]">
    <div className="flex items-center gap-8">
      <span className="text-xl font-extrabold tracking-tighter text-[#00288e] font-headline">DỰ TOÁN AUFLOW AI</span>
      <div className="hidden md:flex items-center bg-[#eeedf7] px-4 py-1.5 gap-3 rounded">
        <Search className="text-[#444653] w-4 h-4" />
        <input 
          className="bg-transparent border-none focus:ring-0 text-sm w-64 font-body outline-none" 
          placeholder="Tìm kiếm dự án..." 
          type="text" 
        />
      </div>
    </div>
    <div className="flex items-center gap-4">
      <button className="p-2 hover:bg-[#f4f2fc] transition-colors duration-150 rounded-full text-[#444653]">
        <Bell size={20} />
      </button>
      <button className="p-2 hover:bg-[#f4f2fc] transition-colors duration-150 rounded-full text-[#444653]">
        <User size={20} />
      </button>
    </div>
  </header>
);

// --- Pages ---

import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const EstimationTool = ({ 
  buildingPrices, 
  materialCategories,
  onSaveProject
}: { 
  buildingPrices: any[], 
  materialCategories: any[],
  onSaveProject: (project: Omit<Project, 'id' | 'code' | 'date' | 'status'>) => void
}) => {
  const [buildingType, setBuildingType] = useState('Nhà phố');
  const [length, setLength] = useState(15);
  const [width, setWidth] = useState(5);
  const [floors, setFloors] = useState(3);
  const [foundationType, setFoundationType] = useState('Móng Đơn');
  const [roofType, setRoofType] = useState('Mái BTCT');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectImage, setNewProjectImage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  const [customerName, setCustomerName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, string>>({
    'Xi măng': 'Hà Tiên',
    'Thép': 'Hòa Phát',
    'Gạch': 'Tuynel Bình Dương',
    'Cát đá': 'Biên Hòa',
    'Bê tông': 'Bê tông tươi Holcim',
    'Điện nước': 'Sino & Bình Minh'
  });

  const buildingTypes = [
    { id: 'Nhà cấp 4', icon: Package },
    { id: 'Nhà phố', icon: LayoutDashboard },
    { id: 'Biệt thự', icon: DraftingCompass },
    { id: 'Văn phòng', icon: FolderOpen },
  ];

  const floorArea = length * width;
  const foundationFactor = foundationType === 'Móng Đơn' ? 0.3 : foundationType === 'Móng Băng' ? 0.5 : 0.4;
  const roofFactor = roofType === 'Mái Tôn' ? 0.3 : roofType === 'Mái BTCT' ? 0.5 : 0.7;
  
  const totalArea = (floorArea * floors) + (floorArea * foundationFactor) + (floorArea * roofFactor) + (floorArea * 0.35); // 0.35 for terrace
  
  const selectedBuilding = buildingPrices.find(t => t.type === buildingType);
  const rawPrice = selectedBuilding?.price || 4500000;
  const rawFactor = selectedBuilding?.factor || 1;
  const basePrice = (isNaN(Number(rawPrice)) ? 4500000 : Number(rawPrice)) * (isNaN(Number(rawFactor)) ? 1 : Number(rawFactor));
  
  const materialsPrice = materialCategories.reduce((sum, cat) => {
    const selected = cat.options.find(opt => opt.name === selectedMaterials[cat.name]);
    const price = selected?.price || 0;
    return sum + (isNaN(Number(price)) ? 0 : Number(price));
  }, 0);

  const unitPrice = basePrice + materialsPrice;
  const totalCost = totalArea * unitPrice;

  const exportToExcel = () => {
    const data = [
      ['THÔNG TIN DỰ TOÁN CÔNG TRÌNH'],
      ['Ngày xuất', new Date().toLocaleString()],
      [''],
      ['THÔNG SỐ KIẾN TRÚC'],
      ['Loại công trình', buildingType],
      ['Kích thước', `${length}m x ${width}m`],
      ['Số tầng', floors],
      ['Loại móng', foundationType],
      ['Loại mái', roofType],
      [''],
      ['DIỆN TÍCH XÂY DỰNG'],
      ['Diện tích sàn', `${floorArea} m2`],
      ['Tổng diện tích tính toán', `${totalArea.toFixed(2)} m2`],
      [''],
      ['VẬT TƯ LỰA CHỌN'],
      ...Object.entries(selectedMaterials).map(([cat, brand]) => [cat, brand]),
      [''],
      ['DỰ TOÁN CHI PHÍ'],
      ['Đơn giá trung bình', `${unitPrice.toLocaleString()} VNĐ/m2`],
      ['TỔNG CHI PHÍ DỰ KIẾN', `${totalCost.toLocaleString()} VNĐ`],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DuToan');
    XLSX.writeFile(wb, `DuToan_${buildingType}_${new Date().getTime()}.xlsx`);
    setIsExportModalOpen(false);
  };

  const analyzeWithAI = async () => {
    setIsChatOpen(true);
    if (chatMessages.length > 0) return;

    setIsTyping(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const prompt = `Bạn là một chuyên gia tư vấn thiết kế và xây dựng công trình chuyên nghiệp với hơn 20 năm kinh nghiệm. 
Hãy phân tích các thông số dự toán sau đây và đưa ra ưu điểm, nhược điểm cũng như lời khuyên chuyên môn.
YÊU CẦU: Phản hồi súc tích, đi thẳng vào vấn đề, không rườm rà nhưng phải đầy đủ các nội dung quan trọng.

THÔNG TIN CÔNG TRÌNH:
- Loại hình: ${buildingType}
- Kích thước: ${length}m x ${width}m (Diện tích sàn: ${floorArea}m2)
- Số tầng: ${floors}
- Loại móng: ${foundationType}
- Loại mái: ${roofType}
- Vật tư đã chọn: ${Object.entries(selectedMaterials).map(([cat, opt]) => `${cat}: ${opt}`).join(', ')}
- Tổng diện tích xây dựng tính toán: ${totalArea.toFixed(2)}m2
- Tổng chi phí dự kiến: ${totalCost.toLocaleString('vi-VN')} VNĐ

CẤU TRÚC PHẢN HỒI:
1. Ưu điểm (Tối đa 3 ý chính).
2. Rủi ro/Nhược điểm (Tối đa 3 ý chính).
3. 3 Lời khuyên tối ưu (Ngắn gọn, thực tế).
Giọng văn chuyên nghiệp, trình bày bằng markdown.`;

      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "Bạn là chuyên gia tư vấn xây dựng AUFLOW. Hãy phản hồi cực kỳ súc tích, tập trung vào số liệu và lời khuyên thực tế. Tránh các câu chào hỏi rườm rà hoặc giải thích quá dài dòng. Luôn cung cấp đủ thông tin quan trọng nhưng dưới dạng danh sách hoặc đoạn văn ngắn."
        }
      });

      const responseText = result.text || "Xin lỗi, tôi không thể phân tích lúc này. Vui lòng thử lại sau.";
      setChatMessages([{ role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setChatMessages([{ role: 'assistant', content: "Có lỗi xảy ra khi kết nối với chuyên gia ảo. Vui lòng kiểm tra lại kết nối mạng." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const result = await ai.models.generateContent({
        model,
        contents: [...chatMessages, { role: 'user', content: userMessage }].map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: "Bạn là chuyên gia tư vấn xây dựng AUFLOW. Trả lời các câu hỏi tiếp theo của người dùng một cách ngắn gọn, súc tích, tập trung vào giải pháp kỹ thuật và chi phí. Không lặp lại thông tin cũ trừ khi cần thiết."
        }
      });

      const responseText = result.text || "Xin lỗi, tôi không thể phản hồi lúc này.";
      setChatMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Xin lỗi, tôi gặp trục trặc kỹ thuật khi xử lý câu hỏi của bạn." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSave = () => {
    if (!newProjectName.trim()) return;
    onSaveProject({
      name: newProjectName,
      area: totalArea,
      budget: totalCost,
      image: newProjectImage || `https://picsum.photos/seed/${newProjectName}/400/300`
    });
    setIsSaveModalOpen(false);
    setNewProjectName('');
    setNewProjectImage('');
  };

  const exportToDoc = async () => {
    const sections = [];

    const boldPara = (text: string) => new Paragraph({ 
      children: [new TextRun({ text, bold: true })] 
    });

    const normalPara = (text: string) => new Paragraph({ 
      children: [new TextRun({ text })] 
    });

    // Header Section
    sections.push({
      properties: {},
      children: [
        new Paragraph({
          text: "DỰ TOÁN XÂY DỰNG AUFLOW AI",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: "Báo cáo dự toán tự động - Chính xác - Minh bạch",
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: "",
        }),
        new Paragraph({
          text: "BÁO CÁO CHI TIẾT DỰ TOÁN",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: `Ngày lập: ${new Date().toLocaleString('vi-VN')}`,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: "",
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "1. THÔNG TIN DỰ ÁN",
              bold: true,
              size: 24,
            }),
          ],
        }),
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [boldPara("Khách hàng")] }),
                new TableCell({ children: [normalPara(customerName || 'Chưa cập nhật')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [boldPara("Địa chỉ")] }),
                new TableCell({ children: [normalPara(projectAddress || 'Chưa cập nhật')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [boldPara("Loại công trình")] }),
                new TableCell({ children: [normalPara(buildingType)] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [boldPara("Quy mô")] }),
                new TableCell({ children: [normalPara(`${floors} tầng`)] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [boldPara("Kích thước")] }),
                new TableCell({ children: [normalPara(`${length}m x ${width}m`)] }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({
              text: "2. HẠNG MỤC THI CÔNG",
              bold: true,
              size: 24,
            }),
          ],
        }),
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [boldPara("Hạng mục")] }),
                new TableCell({ children: [boldPara("Diện tích (m2)")] }),
                new TableCell({ children: [boldPara("Hệ số")] }),
                new TableCell({ children: [boldPara("Thành tiền (m2)")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [normalPara("Phần móng")] }),
                new TableCell({ children: [normalPara(`${floorArea} m2`)] }),
                new TableCell({ children: [normalPara(`${(foundationFactor * 100).toFixed(0)}%`)] }),
                new TableCell({ children: [normalPara(`${(floorArea * foundationFactor).toFixed(2)} m2`)] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [normalPara("Các tầng lầu")] }),
                new TableCell({ children: [normalPara(`${floorArea} m2 x ${floors}`)] }),
                new TableCell({ children: [normalPara("100%")] }),
                new TableCell({ children: [normalPara(`${(floorArea * floors).toFixed(2)} m2`)] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [normalPara("Phần mái")] }),
                new TableCell({ children: [normalPara(`${floorArea} m2`)] }),
                new TableCell({ children: [normalPara(`${(roofFactor * 100).toFixed(0)}%`)] }),
                new TableCell({ children: [normalPara(`${(floorArea * roofFactor).toFixed(2)} m2`)] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [normalPara("Sân thượng/Ban công")] }),
                new TableCell({ children: [normalPara(`${floorArea} m2`)] }),
                new TableCell({ children: [normalPara("35%")] }),
                new TableCell({ children: [normalPara(`${(floorArea * 0.35).toFixed(2)} m2`)] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [boldPara("TỔNG DIỆN TÍCH XÂY DỰNG")] }),
                new TableCell({ children: [normalPara("")] }),
                new TableCell({ children: [normalPara("")] }),
                new TableCell({ children: [boldPara(`${totalArea.toFixed(2)} m2`)] }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({
              text: "3. VẬT TƯ XÂY DỰNG",
              bold: true,
              size: 24,
            }),
          ],
        }),
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [boldPara("Vật tư")] }),
                new TableCell({ children: [boldPara("Thương hiệu / Chủng loại")] }),
              ],
            }),
            ...Object.entries(selectedMaterials).map(([key, value]) => (
              new TableRow({
                children: [
                  new TableCell({ children: [normalPara(String(key))] }),
                  new TableCell({ children: [normalPara(String(value))] }),
                ],
              })
            )),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({
              text: "4. TỔNG HỢP KINH PHÍ",
              bold: true,
              size: 24,
            }),
          ],
        }),
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [boldPara("Hạng mục")] }),
                new TableCell({ children: [boldPara("Giá trị")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [normalPara("Đơn giá xây dựng dự kiến")] }),
                new TableCell({ children: [normalPara(`${unitPrice.toLocaleString('vi-VN')} VNĐ/m2`)] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [boldPara("TỔNG CHI PHÍ DỰ TOÁN")] }),
                new TableCell({ children: [boldPara(`${totalCost.toLocaleString('vi-VN')} VNĐ`)] }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Lưu ý: Báo cáo này chỉ mang tính chất tham khảo dựa trên các thông số đầu vào.",
          alignment: AlignmentType.CENTER,
        }),
      ],
    });

    const doc = new Document({
      sections: sections,
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `BaoCao_DuToan_${customerName || 'DuAn'}_${new Date().getTime()}.docx`);
    setIsExportModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-slate-900 mb-2 font-headline">Công cụ Dự toán</h1>
          <p className="text-[#444653] max-w-lg font-body">Phân tích diện tích và dự toán chi phí xây dựng chính xác dựa trên thông số kiến trúc thực tế.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#e3e1eb] text-slate-900 font-semibold hover:bg-[#d9d7e1] transition-colors rounded shadow-sm"
          >
            <Save size={18} /> Lưu dự án
          </button>
          <button 
            onClick={analyzeWithAI}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-all rounded shadow-sm"
          >
            <Sparkles size={18} /> Tư vấn chuyên gia AI
          </button>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold hover:opacity-90 transition-opacity rounded shadow-lg shadow-primary/20"
          >
            <FileText size={18} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* AI Consultant Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-[120] flex flex-col"
            >
              <div className="p-6 border-b border-[#eeedf7] flex items-center justify-between bg-[#fbf8ff]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-md">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 font-headline">Chuyên gia Tư vấn AUFLOW</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Đang trực tuyến</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 hover:bg-[#eeedf7] rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fbf8ff]/50">
                {chatMessages.length === 0 && !isTyping && (
                  <div className="text-center py-12">
                    <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 text-sm font-medium">Nhấn nút "Tư vấn" để bắt đầu phân tích dự án của bạn.</p>
                  </div>
                )}
                
                {chatMessages.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[90%] p-4 rounded-2xl shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white border border-[#eeedf7] text-slate-800 rounded-tl-none'
                    }`}>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap font-body">
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[#eeedf7] p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-primary" />
                      <span className="text-xs font-medium text-slate-500 italic">Chuyên gia đang phân tích dữ liệu...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 border-t border-[#eeedf7] bg-white">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Hỏi thêm về dự án này..."
                    className="flex-1 bg-[#fbf8ff] border border-[#eeedf7] px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 font-body"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isTyping || !chatInput.trim()}
                    className="bg-primary text-white p-3 rounded-xl hover:bg-blue-800 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 mt-4 uppercase font-bold tracking-widest">
                  AI Consultant Powered by Gemini
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Save Project Modal */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSaveModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md p-8 relative z-10 shadow-2xl rounded-xl"
            >
              <button 
                onClick={() => setIsSaveModalOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-[#eeedf7] rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#f4f2fc] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Save size={32} className="text-primary" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 font-headline mb-2">Lưu dự án</h3>
                <p className="text-sm text-[#444653]">Lưu lại kết quả tính toán vào thư viện dự án của bạn.</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#444653] uppercase tracking-wider">Tên dự án</label>
                  <input 
                    type="text" 
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Ví dụ: Biệt thự Anh Tuấn - Q2"
                    className="w-full bg-[#fbf8ff] border border-[#eeedf7] p-3 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#444653] uppercase tracking-wider">Link ảnh dự án (Tùy chọn)</label>
                  <input 
                    type="text" 
                    value={newProjectImage}
                    onChange={(e) => setNewProjectImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#fbf8ff] border border-[#eeedf7] p-3 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={!newProjectName.trim()}
                className="w-full bg-primary text-white py-4 font-bold rounded-xl hover:bg-blue-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
              >
                XÁC NHẬN LƯU
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExportModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl border border-[#eeedf7]"
            >
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#f4f2fc] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CloudDownload size={32} className="text-primary" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 font-headline mb-2">Xuất báo cáo</h3>
                <p className="text-sm text-[#444653]">Nhập thông tin dự án để báo cáo đầy đủ hơn.</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#444653] uppercase tracking-wider">Tên khách hàng</label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full bg-[#fbf8ff] border border-[#eeedf7] p-3 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#444653] uppercase tracking-wider">Địa chỉ công trình</label>
                  <input 
                    type="text" 
                    value={projectAddress}
                    onChange={(e) => setProjectAddress(e.target.value)}
                    placeholder="Ví dụ: Quận 1, TP. HCM"
                    className="w-full bg-[#fbf8ff] border border-[#eeedf7] p-3 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={exportToExcel}
                  className="group flex items-center gap-4 p-4 bg-[#fbf8ff] border border-[#eeedf7] hover:border-green-500 hover:bg-green-50 transition-all rounded-xl text-left"
                >
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Microsoft Excel (.xlsx)</p>
                    <p className="text-xs text-[#444653]">Bảng tính chi tiết, dễ dàng chỉnh sửa</p>
                  </div>
                </button>

                <button 
                  onClick={exportToDoc}
                  className="group flex items-center gap-4 p-4 bg-[#fbf8ff] border border-[#eeedf7] hover:border-blue-500 hover:bg-blue-50 transition-all rounded-xl text-left"
                >
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Microsoft Word (.docx)</p>
                    <p className="text-xs text-[#444653]">Định dạng văn bản, dễ dàng chỉnh sửa</p>
                  </div>
                </button>
              </div>

              <p className="mt-8 text-[10px] text-center text-[#444653] uppercase tracking-widest font-bold">
                DỰ TOÁN AUFLOW AI • PRECISION BUILD
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <section className="bg-[#eeedf7] p-8 rounded">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#00288e] mb-6 flex items-center gap-2 font-headline">
              <span className="w-8 h-[2px] bg-primary"></span> 00. Loại công trình
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {buildingTypes.map((type) => (
                <button 
                  key={type.id}
                  onClick={() => setBuildingType(type.id)}
                  className={`p-4 border-2 text-center rounded transition-all flex flex-col items-center gap-2 ${
                    buildingType === type.id 
                      ? 'border-primary bg-white' 
                      : 'border-transparent bg-[#e3e1eb] hover:border-slate-300'
                  }`}
                >
                  <type.icon size={20} className={buildingType === type.id ? 'text-primary' : 'opacity-60'} />
                  <span className="font-bold text-xs font-headline">{type.id}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-[#eeedf7] p-8 relative overflow-hidden rounded">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Ruler size={120} className="text-primary" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#00288e] mb-6 flex items-center gap-2 font-headline">
              <span className="w-8 h-[2px] bg-primary"></span> 01. Kích thước công trình
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#444653]">CHIỀU DÀI (M)</label>
                <input 
                  className="w-full bg-[#e3e1eb] border-0 border-b-2 border-slate-300 focus:border-primary focus:ring-0 p-3 font-headline font-bold text-xl rounded-t outline-none" 
                  type="number" 
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#444653]">CHIỀU RỘNG (M)</label>
                <input 
                  className="w-full bg-[#e3e1eb] border-0 border-b-2 border-slate-300 focus:border-primary focus:ring-0 p-3 font-headline font-bold text-xl rounded-t outline-none" 
                  type="number" 
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#444653]">SỐ TẦNG</label>
                <input 
                  className="w-full bg-[#e3e1eb] border-0 border-b-2 border-slate-300 focus:border-primary focus:ring-0 p-3 font-headline font-bold text-xl rounded-t outline-none" 
                  type="number" 
                  value={floors}
                  onChange={(e) => setFloors(Number(e.target.value))}
                />
              </div>
            </div>
          </section>

          <section className="bg-[#eeedf7] p-8 rounded">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#00288e] mb-8 flex items-center gap-2 font-headline">
              <span className="w-8 h-[2px] bg-primary"></span> 02. Thông số kỹ thuật
            </h2>
            <div className="space-y-8">
              <div>
                <label className="text-xs font-bold text-[#444653] block mb-4">LOẠI MÓNG</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'Móng Đơn', icon: Layers, factor: '30%' },
                    { id: 'Móng Băng', icon: Layers, factor: '50%' },
                    { id: 'Móng Cọc', icon: SquareDashedBottom, factor: '40%' }
                  ].map((type) => (
                    <button 
                      key={type.id}
                      onClick={() => setFoundationType(type.id)}
                      className={`p-4 border-2 text-left rounded transition-all ${
                        foundationType === type.id 
                          ? 'border-primary bg-white' 
                          : 'border-transparent bg-[#e3e1eb] hover:border-slate-300'
                      }`}
                    >
                      <type.icon size={24} className={`mb-2 ${foundationType === type.id ? 'text-primary' : 'opacity-60'}`} />
                      <span className="block font-bold text-sm font-headline">{type.id}</span>
                      <span className="text-[10px] text-[#444653]">Hệ số {type.factor}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-[#444653] block">TẦNG HẦM (ĐỘ SÂU)</label>
                  <select className="w-full bg-[#e3e1eb] border-0 border-b-2 border-slate-300 p-3 font-medium rounded-t focus:ring-0 focus:border-primary outline-none">
                    <option>Không có hầm</option>
                    <option>Hầm sâu 1.0m - 1.3m (150%)</option>
                    <option>Hầm sâu 1.3m - 1.7m (170%)</option>
                    <option>Hầm sâu 1.7m - 2.0m (200%)</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-[#444653] block">LOẠI MÁI</label>
                  <select 
                    value={roofType}
                    onChange={(e) => setRoofType(e.target.value)}
                    className="w-full bg-[#e3e1eb] border-0 border-b-2 border-slate-300 p-3 font-medium rounded-t focus:ring-0 focus:border-primary outline-none"
                  >
                    <option value="Mái Tôn">Mái Tôn (30%)</option>
                    <option value="Mái BTCT">Mái BTCT (50%)</option>
                    <option value="Mái Ngói">Mái Ngói (70%)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>
          
          <section className="bg-[#eeedf7] p-8 rounded">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#00288e] mb-8 flex items-center gap-2 font-headline">
              <span className="w-8 h-[2px] bg-primary"></span> 03. Chi tiết vật tư nhà cung cấp
            </h2>
            <div className="space-y-6">
              {materialCategories.map((category) => (
                <div key={category.name} className="space-y-3">
                  <label className="text-[10px] font-bold text-[#444653] uppercase tracking-wider">{category.name}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {category.options.map((opt) => (
                      <button
                        key={opt.name}
                        onClick={() => setSelectedMaterials(prev => ({ ...prev, [category.name]: opt.name }))}
                        className={`p-3 border-2 text-left rounded transition-all ${
                          selectedMaterials[category.name] === opt.name
                            ? 'border-primary bg-white shadow-sm'
                            : 'border-transparent bg-[#e3e1eb] hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-xs font-headline leading-tight">{opt.name}</span>
                          {selectedMaterials[category.name] === opt.name && (
                            <div className="w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] text-[#444653] leading-tight mb-1">{opt.desc}</p>
                        <p className="text-[10px] font-bold text-primary">+{opt.price.toLocaleString()} đ/m²</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-8">
          <div className="bg-primary p-8 text-white shadow-xl relative overflow-hidden rounded">
            <div className="absolute -right-8 -bottom-8 opacity-10 transform -rotate-12">
              <Calculator size={192} />
            </div>
            <p className="text-xs font-bold tracking-widest uppercase opacity-80 mb-1 font-headline">Tổng diện tích xây dựng (DTXD)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black font-headline tracking-tighter">{totalArea.toFixed(1)}</span>
              <span className="text-2xl font-bold opacity-80 font-headline">m²</span>
            </div>
            <div className="mt-6 pt-6 border-t border-white/20 flex justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold opacity-60">Suất đầu tư tạm tính</p>
                <p className="font-headline font-bold">~ {totalCost.toLocaleString()} VNĐ</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold opacity-60">Đơn giá m²</p>
                <p className="font-headline font-bold">{unitPrice.toLocaleString()} đ</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 border border-[#eeedf7] rounded">
            <h3 className="font-headline font-bold text-lg mb-6 flex justify-between items-center text-slate-900">
              Bảng tóm tắt diện tích
              <span className="text-xs font-normal text-[#444653]">(Tạm tính)</span>
            </h3>
            <div className="space-y-1">
              <div className="grid grid-cols-4 py-3 px-4 text-[10px] font-black uppercase text-[#444653] border-b border-[#eeedf7]">
                <div className="col-span-2">Hạng mục</div>
                <div className="text-center">Hệ số %</div>
                <div className="text-right">Diện tích (m²)</div>
              </div>
              {[
                { label: 'Diện tích móng', factor: foundationFactor * 100, area: floorArea * foundationFactor },
                { label: 'Diện tích Sàn (Trệt)', factor: 100, area: floorArea },
                { label: 'Diện tích Sàn Lầu', factor: 100 * (floors - 1), area: floorArea * (floors - 1) },
                { label: 'Sân thượng', factor: 35, area: floorArea * 0.35 },
                { label: 'Mái', factor: roofFactor * 100, area: floorArea * roofFactor },
              ].map((item, idx) => (
                <div key={idx} className={`grid grid-cols-4 py-4 px-4 items-center transition-colors hover:bg-[#f4f2fc] rounded ${idx % 2 === 0 ? 'bg-[#eeedf7]' : 'bg-white'}`}>
                  <div className="col-span-2 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    <span className="font-bold text-sm font-headline">{item.label}</span>
                  </div>
                  <div className="text-center font-body text-sm text-[#444653]">{item.factor}%</div>
                  <div className="text-right font-headline font-bold text-sm">{item.area.toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between p-4 bg-primary-container text-on-primary-container rounded">
              <span className="font-bold text-sm font-headline">Ghi chú kỹ thuật:</span>
              <span className="text-xs italic font-body">Dữ liệu tính theo tiêu chuẩn TCVN 2024</span>
            </div>
          </div>
        </div>

        <div className="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 border border-[#eeedf7] rounded shadow-sm">
            <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2 text-slate-900">
              <TrendingUp size={20} className="text-primary" />
              Phân tích cơ cấu diện tích
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Móng', value: floorArea * foundationFactor },
                    { name: 'Sàn Trệt', value: floorArea },
                    { name: 'Sàn Lầu', value: floorArea * (floors - 1) },
                    { name: 'Sân thượng', value: floorArea * 0.35 },
                    { name: 'Mái', value: floorArea * roofFactor },
                  ]}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f4f2fc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${value.toFixed(2)} m²`, 'Diện tích']}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 border border-[#eeedf7] rounded shadow-sm">
            <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2 text-slate-900">
              <Calculator size={20} className="text-primary" />
              Phân bổ chi phí tạm tính
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Vật tư thô', value: totalCost * 0.35 },
                    { name: 'Nhân công', value: totalCost * 0.25 },
                    { name: 'Hoàn thiện', value: totalCost * 0.30 },
                    { name: 'Quản lý', value: totalCost * 0.10 },
                  ]}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f4f2fc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${value.toLocaleString()} VNĐ`, 'Chi phí']}
                  />
                  <Bar dataKey="value" fill="#1e40af" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-[10px] text-[#444653] italic text-center">
              * Tỷ trọng chi phí mang tính chất tham khảo dựa trên mặt bằng chung thị trường.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SavedProjects = ({ projects }: { projects: Project[] }) => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2 font-headline">Thư viện Dự án</h1>
          <p className="text-[#444653] max-w-xl">Quản lý và theo dõi tất cả các bảng tính toán dự toán công trình. Dữ liệu được bảo mật và lưu trữ tập trung trên hệ thống.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#e3e1eb] text-slate-900 px-6 py-3 font-bold flex items-center gap-2 hover:bg-[#d9d7e1] transition-colors rounded">
            <History size={18} /> Sắp xếp
          </button>
          <button className="bg-primary text-white px-6 py-3 font-bold flex items-center gap-2 hover:shadow-lg transition-all active:scale-95 rounded">
            <Plus size={18} /> Dự án mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Tổng dự án', val: projects.length.toString() },
          { label: 'Giá trị ước tính', val: (projects.reduce((sum, p) => sum + p.budget, 0) / 1000000000).toFixed(1) + 'B' },
          { label: 'Diện tích triển khai', val: projects.reduce((sum, p) => sum + p.area, 0).toLocaleString() + 'm²' },
          { label: 'Đang dự toán', val: projects.filter(p => p.status === 'Đang dự toán').length.toString().padStart(2, '0'), highlight: true },
        ].map((stat, i) => (
          <div key={i} className={`p-6 flex flex-col justify-between min-h-[140px] rounded ${stat.highlight ? 'bg-primary-container border-l-4 border-primary' : 'bg-[#eeedf7]'}`}>
            <span className={`text-sm font-medium ${stat.highlight ? 'text-on-primary-container uppercase tracking-wider' : 'text-[#444653]'}`}>{stat.label}</span>
            <span className={`text-3xl font-bold font-headline ${stat.highlight ? 'text-on-primary-container' : 'text-slate-900'}`}>{stat.val}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {projects.map((p) => (
          <div key={p.id} className="group bg-white border border-[#eeedf7] overflow-hidden relative transition-all hover:-translate-y-1 hover:shadow-md rounded">
            <div className="flex flex-col md:flex-row h-full">
              <div className="md:w-1/3 relative h-48 md:h-auto">
                <img className="w-full h-full object-cover" src={p.image} alt={p.name} referrerPolicy="no-referrer" />
                <div className="absolute top-4 left-4">
                  <span className={`text-white text-[10px] font-bold px-2 py-1 tracking-widest uppercase ${p.status === 'Hoàn thiện' ? 'bg-primary' : 'bg-slate-500'}`}>{p.status}</span>
                </div>
              </div>
              <div className="md:w-2/3 p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors font-headline">{p.name}</h3>
                    <p className="text-[#444653] text-xs uppercase tracking-tighter">Mã dự án: {p.code}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-2 text-[#444653] hover:text-primary transition-colors"><Edit3 size={16} /></button>
                    <button className="p-2 text-[#444653] hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-[10px] text-[#444653] font-bold uppercase mb-1">Tổng DTXD</p>
                    <p className="text-lg font-bold tabular-nums">{p.area.toFixed(1)} m²</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#444653] font-bold uppercase mb-1">Ngày khởi tạo</p>
                    <p className="text-sm font-medium text-slate-900">{p.date}</p>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-[#eeedf7] flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#444653] font-bold uppercase">Tổng kinh phí dự kiến</p>
                    <p className="text-2xl font-black text-primary tabular-nums">{p.budget.toLocaleString()}đ</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-10 h-10 flex items-center justify-center border border-slate-200 hover:bg-[#f4f2fc] transition-colors rounded">
                      <FileText size={18} />
                    </button>
                    <button className="px-4 h-10 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-primary transition-colors rounded">Chi tiết</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PricingSettings = ({ 
  buildingPrices, 
  setBuildingPrices, 
  materialCategories, 
  setMaterialCategories 
}: { 
  buildingPrices: any[], 
  setBuildingPrices: any, 
  materialCategories: any[], 
  setMaterialCategories: any 
}) => {
  const handlePriceChange = (index: number, field: string, value: string) => {
    const newPrices = [...buildingPrices];
    let finalValue: any = value;
    
    if (field === 'price') {
      // Remove all non-digits for price
      const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
      finalValue = isNaN(numericValue) ? 0 : numericValue;
    } else if (field === 'factor') {
      // Allow decimals for factor, replace comma with dot for parsing
      const normalizedValue = value.replace(',', '.');
      // Regex to allow only numbers and at most one dot
      if (normalizedValue === '' || normalizedValue === '.') {
        finalValue = 0;
      } else {
        const numericValue = parseFloat(normalizedValue);
        finalValue = isNaN(numericValue) ? 0 : numericValue;
      }
    }
    
    newPrices[index] = { ...newPrices[index], [field]: finalValue };
    setBuildingPrices(newPrices);
  };

  const handleMaterialPriceChange = (catIndex: number, optIndex: number, value: string) => {
    const newCats = materialCategories.map((cat, i) => {
      if (i !== catIndex) return cat;
      return {
        ...cat,
        options: cat.options.map((opt, j) => {
          if (j !== optIndex) return opt;
          const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
          return { ...opt, price: isNaN(numericValue) ? 0 : numericValue };
        })
      };
    });
    setMaterialCategories(newCats);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#00288e] mb-2">Quản lý Đơn giá</h2>
          <p className="text-[#444653] max-w-2xl">Cấu hình các thông số đơn giá xây dựng cơ bản. Các thay đổi tại đây sẽ được áp dụng trực tiếp vào trình tính toán dự toán tự động.</p>
        </div>
        <button className="bg-primary hover:bg-blue-800 text-white px-6 py-3 font-bold flex items-center gap-2 shadow-lg shadow-primary/10 rounded transition-all active:scale-[0.98]">
          <Save size={18} /> LƯU TẤT CẢ THAY ĐỔI
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#eeedf7] p-8 shadow-sm rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-bold text-lg text-[#00288e] flex items-center gap-2">
                <DraftingCompass size={20} className="text-primary" /> Đơn giá theo loại hình
              </h3>
              <span className="text-xs font-bold px-2 py-1 bg-[#dde1ff] text-[#00288e] tracking-wider rounded">ĐƠN VỊ: VNĐ/M2</span>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f2fc] text-left">
                  <th className="py-3 px-4 font-bold text-xs uppercase tracking-widest text-[#444653]">Loại hình công trình</th>
                  <th className="py-3 px-4 font-bold text-xs uppercase tracking-widest text-[#444653] text-right">Đơn giá cơ sở</th>
                  <th className="py-3 px-4 font-bold text-xs uppercase tracking-widest text-[#444653] text-right">Hệ số</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeedf7]">
                {buildingPrices.map((row, i) => (
                  <tr key={i} className="hover:bg-[#f4f2fc] transition-colors">
                    <td className="py-4 px-4 font-medium text-slate-900">{row.type}</td>
                    <td className="py-4 px-4 text-right">
                      <input 
                        className="bg-[#eeedf7] border-0 border-b-2 border-transparent px-2 py-1 text-right font-body tabular-nums w-32 focus:bg-white focus:border-primary outline-none" 
                        type="text" 
                        value={row.price.toLocaleString('vi-VN')} 
                        onChange={(e) => handlePriceChange(i, 'price', e.target.value)}
                      />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <input 
                        className="bg-[#eeedf7] border-0 border-b-2 border-transparent px-2 py-1 text-right font-body tabular-nums w-20 focus:bg-white focus:border-primary outline-none" 
                        type="text" 
                        value={row.factor} 
                        onChange={(e) => handlePriceChange(i, 'factor', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-[#eeedf7] p-8 shadow-sm rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-bold text-lg text-[#00288e] flex items-center gap-2">
                <Package size={20} className="text-primary" /> Chi tiết đơn giá vật tư nhà cung cấp
              </h3>
              <span className="text-xs font-bold px-2 py-1 bg-[#dde1ff] text-[#00288e] tracking-wider rounded">CỘNG THÊM: VNĐ/M2</span>
            </div>
            <div className="space-y-8">
              {materialCategories.map((cat, catIdx) => (
                <div key={cat.name} className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-[#444653] border-b border-[#eeedf7] pb-2">{cat.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cat.options.map((opt, optIdx) => (
                      <div key={opt.name} className="flex items-center justify-between p-3 bg-[#fbf8ff] border border-[#eeedf7] rounded">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{opt.name}</p>
                          <p className="text-[10px] text-[#444653]">{opt.desc}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">₫</span>
                          <input 
                            className="bg-[#eeedf7] border-0 border-b-2 border-transparent px-2 py-1 text-right font-body tabular-nums w-28 focus:bg-white focus:border-primary outline-none text-sm font-bold" 
                            type="text" 
                            value={opt.price.toLocaleString('vi-VN')} 
                            onChange={(e) => handleMaterialPriceChange(catIdx, optIdx, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-[#eeedf7] p-8 shadow-sm rounded-lg">
            <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2 text-[#00288e]">
              <History size={20} className="text-primary" /> Lịch sử cập nhật
            </h3>
            <div className="space-y-6">
              {[
                { time: 'HÔM NAY, 14:30', title: 'Cập nhật đơn giá Nhà phố', user: 'Kỹ sư Trưởng', active: true },
                { time: '24 THÁNG 10, 2023', title: 'Điều chỉnh gói vật tư Cao cấp', user: 'Tăng 5% do biến động thị trường' },
              ].map((item, i) => (
                <div key={i} className={`relative pl-6 ${i === 0 ? "before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-[-24px] before:w-px before:bg-[#eeedf7]" : ""}`}>
                  <div className={`absolute left-[-4px] top-1.5 w-2.5 h-2.5 rounded-full ${item.active ? 'bg-primary' : 'bg-slate-300'}`}></div>
                  <p className={`text-xs font-bold mb-1 ${item.active ? 'text-primary' : 'text-[#444653]'}`}>{item.time}</p>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-[#444653] mt-1">{item.user}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 text-xs font-bold border border-[#eeedf7] hover:bg-[#f4f2fc] text-[#444653] transition-colors uppercase tracking-widest rounded">
              Xem tất cả lịch sử
            </button>
          </div>
          <div className="bg-[#f4f2fc] p-8 border border-[#eeedf7] rounded-lg">
            <h3 className="font-headline font-bold text-[#00288e] mb-4">Ghi chú thị trường</h3>
            <div className="p-4 bg-white/60 backdrop-blur-sm space-y-3 rounded">
              <div className="flex gap-3">
                <TrendingUp size={16} className="text-primary" />
                <p className="text-xs text-[#00288e] leading-relaxed">Giá xi măng dự kiến tăng 3-5% trong tháng tới tại khu vực miền Trung.</p>
              </div>
              <div className="flex gap-3">
                <Info size={16} className="text-primary" />
                <p className="text-xs text-[#00288e] leading-relaxed">Đơn giá nhân công đang ổn định ở mức 280.000 - 350.000 VNĐ/ngày.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- App Component ---

export default function App() {
  const [activePage, setActivePage] = useState<Page>('estimation');

  // Global Pricing State
  const [buildingPrices, setBuildingPrices] = useState([
    { type: 'Nhà cấp 4', price: 3200000, factor: 1.0 },
    { type: 'Nhà phố', price: 4500000, factor: 1.1 },
    { type: 'Biệt thự', price: 6500000, factor: 1.35 },
    { type: 'Văn phòng', price: 5500000, factor: 1.2 },
  ]);

  const [materialCategories, setMaterialCategories] = useState([
    {
      name: 'Xi măng',
      options: [
        { name: 'Hà Tiên', price: 420000, desc: 'Xi măng đa dụng Hà Tiên' },
        { name: 'Sông Gianh', price: 420000, desc: 'Xi măng đa dụng Sông Gianh' },
        { name: 'SCG', price: 420000, desc: 'Xi măng đa dụng SCG' },
        { name: 'Insee', price: 450000, desc: 'Xi măng Insee (Holcim) cao cấp' },
        { name: 'Nghi Sơn', price: 410000, desc: 'Xi măng Nghi Sơn bền sunfat' }
      ]
    },
    {
      name: 'Thép',
      options: [
        { name: 'Hòa Phát', price: 1150000, desc: 'Thép Hòa Phát (CB300/CB400)' },
        { name: 'Việt Nhật', price: 1250000, desc: 'Thép Việt Nhật (Vina Kyoei)' },
        { name: 'Pomina', price: 1180000, desc: 'Thép Pomina chất lượng cao' }
      ]
    },
    {
      name: 'Gạch',
      options: [
        { name: 'Tuynel Bình Dương', price: 380000, desc: 'Gạch ống 8x8x18' },
        { name: 'Gạch theo địa phương', price: 420000, desc: 'Gạch xây chất lượng cao' },
        { name: 'Gạch nhẹ', price: 550000, desc: 'Gạch bê tông khí chưng áp' },
        { name: 'Việt Hương hoặc khác', price: 650000, desc: 'Gạch ốp lát cao cấp Viet Ceramic' }
      ]
    },
    {
      name: 'Cát đá',
      options: [
        { name: 'Theo địa phương', price: 280000, desc: 'Cát vàng, đá 1x2 sạch' },
        { name: 'Theo địa phương', price: 250000, desc: 'Cát xây tô, đá xanh' }
      ]
    },
    {
      name: 'Bê tông',
      options: [
        { name: 'Bê tông tươi', price: 850000, desc: 'Mác 250 R7' },
        { name: 'Bê tông trộn tay', price: 750000, desc: 'Trộn tại công trình' }
      ]
    },
    {
      name: 'Điện nước',
      options: [
        { name: 'Sino & Bình Minh', price: 450000, desc: 'Ống nhựa Bình Minh, dây Sino' },
        { name: 'Panasonic & Vesbo', price: 650000, desc: 'Thiết bị Panasonic, ống Vesbo' }
      ]
    }
  ]);

  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Biệt thự Phố Đông - Căn 02', code: 'PJ-2023-0824', area: 450, date: '14 Th05, 2023', budget: 8450000000, status: 'Hoàn thiện', image: 'https://picsum.photos/seed/house1/400/300' },
    { id: '2', name: 'Tòa nhà VP Green Tech', code: 'PJ-2023-0912', area: 2800, date: '02 Th06, 2023', budget: 45120000000, status: 'Đang dự toán', image: 'https://picsum.photos/seed/office/400/300' },
    { id: '3', name: 'Chung cư Masteri T5', code: 'PJ-2023-1105', area: 120, date: '15 Th07, 2023', budget: 1250000000, status: 'Hoàn thiện', image: 'https://picsum.photos/seed/apartment/400/300' },
    { id: '4', name: 'Nhà xưởng KCN Amata', code: 'PJ-2023-1220', area: 5200, date: '20 Th08, 2023', budget: 120600000000, status: 'Nháp', image: 'https://picsum.photos/seed/factory/400/300' },
  ]);

  const handleSaveProject = (newProject: Omit<Project, 'id' | 'code' | 'date' | 'status'>) => {
    const project: Project = {
      ...newProject,
      id: Math.random().toString(36).substr(2, 9),
      code: `PJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Đang dự toán'
    };
    setProjects(prev => [project, ...prev]);
    setActivePage('projects');
  };

  return (
    <div className="min-h-screen bg-[#fbf8ff]">
      <Header />
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      
      <main className="ml-64 pt-20 p-8 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activePage === 'estimation' && (
              <EstimationTool 
                buildingPrices={buildingPrices} 
                materialCategories={materialCategories} 
                onSaveProject={handleSaveProject}
              />
            )}
            {activePage === 'projects' && <SavedProjects projects={projects} />}
            {activePage === 'settings' && (
              <PricingSettings 
                buildingPrices={buildingPrices} 
                setBuildingPrices={setBuildingPrices}
                materialCategories={materialCategories}
                setMaterialCategories={setMaterialCategories}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Footer (Quick Actions) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#f4f2fc]/90 backdrop-blur-xl md:hidden flex justify-around p-4 z-50 border-t border-[#eeedf7]">
        <button className="flex flex-col items-center gap-1 text-[#00288e]">
          <History size={20} />
          <span className="text-[10px] font-bold uppercase font-headline">Reset</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#00288e]">
          <Save size={20} />
          <span className="text-[10px] font-bold uppercase font-headline">Lưu</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#00288e]">
          <CloudDownload size={20} />
          <span className="text-[10px] font-bold uppercase font-headline">Chia sẻ</span>
        </button>
      </footer>
    </div>
  );
}
