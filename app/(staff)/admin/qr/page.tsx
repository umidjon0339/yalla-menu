"use client";

import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Link as LinkIcon, Hash, FileDown, ScanLine, CheckCircle2 } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { jsPDF } from "jspdf"; 

// ==============================
// LUG'AT (Tarjimalar)
// ==============================
const T = {
  uz: {
    title: "QR Kod Generator", desc: "Stollar uchun PDF formatidagi QR kodlarni yarating.",
    domain: "Asosiy havola (Domen)", tableCount: "Stollar soni",
    generate: "Yaratish", downloadPdf: "PDF Yuklash",
    table: "STOL", generated: "QR kodlar yaratildi!", 
    scanToOrder: "BUYURTMA BERISH UCHUN SKANER QILING",
    downloading: "PDF tayyorlanmoqda..."
  },
  ru: {
    title: "Генератор QR Кодов", desc: "Создавайте QR-коды в формате PDF для столов.",
    domain: "Основная ссылка (Домен)", tableCount: "Количество столов",
    generate: "Создать", downloadPdf: "Скачать PDF",
    table: "СТОЛ", generated: "QR коды созданы!",
    scanToOrder: "ОТСКАНИРУЙТЕ ДЛЯ ЗАКАЗА",
    downloading: "Создание PDF..."
  },
  en: {
    title: "QR Code Generator", desc: "Generate PDF format QR codes for tables.",
    domain: "Base URL (Domain)", tableCount: "Number of Tables",
    generate: "Generate", downloadPdf: "Download PDF",
    table: "TABLE", generated: "QR codes generated!", 
    scanToOrder: "SCAN TO PLACE YOUR ORDER",
    downloading: "Generating PDF..."
  }
};

type LangType = 'uz' | 'ru' | 'en';

export default function QRCodeGeneratorPage() {
  const [lang, setLang] = useState<LangType>('uz');
  const [isMounted, setIsMounted] = useState(false);
  
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000/menu");
  const [tableCount, setTableCount] = useState<number>(12); 
  const [generatedTables, setGeneratedTables] = useState<number[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const savedLang = localStorage.getItem("admin_lang") as LangType;
    if (savedLang && T[savedLang]) setLang(savedLang);

    const handleStorageChange = () => {
      const currentLang = localStorage.getItem("admin_lang") as LangType;
      if (currentLang && T[currentLang]) setLang(currentLang);
    };

    window.addEventListener('storage', handleStorageChange);
    handleGenerate();

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Admin paneli qaysi tilda ekanligini belgilovchi lug'at (tugmalar, sarlavhalar uchun)
  const t = T[lang] || T.uz;

  const handleGenerate = () => {
    const count = Math.max(1, Math.min(100, tableCount));
    const tables = Array.from({ length: count }, (_, i) => i + 1);
    setGeneratedTables(tables);
    if (isMounted) toast.success(t.generated);
  };

  // ==========================================
  // PREMIUM MODERN PDF GENERATOR FUNCTION
  // ==========================================
  const downloadSinglePDF = (tableNum: number) => {
    const loadingToast = toast.loading(`${t.table} ${tableNum} - ${t.downloading}`);

    try {
      const doc = new jsPDF({ orientation: "portrait", format: "a4", unit: "mm" });

      const canvas = document.getElementById(`qr-canvas-${tableNum}`) as HTMLCanvasElement;
      if (!canvas) throw new Error("Canvas topilmadi");
      const qrImage = canvas.toDataURL("image/png", 1.0);

      const cx = 105; // A4 markazi (210/2)

      // 1. Tepadagi Brend Dekoratsiyasi (Sariq qator)
      doc.setFillColor(255, 193, 7); // YALLA Sariq
      doc.rect(0, 0, 210, 15, "F");

      // 2. YALLA Logotipi (Katta o'lchamda)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(60);
      doc.setTextColor(15, 15, 15); // Qora
      doc.text("YALLA", cx, 50, { align: "center" });

      // Logotip ostidagi sariq chiziq
      doc.setFillColor(255, 193, 7);
      doc.roundedRect(cx - 25, 58, 50, 5, 2.5, 2.5, "F");

      // 3. O'RTASI: QR Kod (Gigant o'lcham, sariq ramka bilan)
      const qrSize = 130; 
      const qrY = 80;
      
      doc.setFillColor(250, 250, 250); 
      doc.roundedRect(cx - (qrSize / 2) - 8, qrY - 8, qrSize + 16, qrSize + 16, 8, 8, "F");
      
      doc.setDrawColor(255, 193, 7); 
      doc.setLineWidth(3);
      doc.roundedRect(cx - (qrSize / 2) - 8, qrY - 8, qrSize + 16, qrSize + 16, 8, 8, "S");

      doc.addImage(qrImage, "PNG", cx - (qrSize / 2), qrY, qrSize, qrSize);

      // 4. PASTKI QISM: Chaqiriq yozuvi
      // DIQQAT: Admin xohlagan tilda bo'lsa ham PDF qat'iy ravishda O'zbek tilida chiqadi (T.uz ishlatiladi)
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 0); 
      doc.text(T.uz.scanToOrder, cx, 235, { align: "center" });

      // 5. PASTKI QISM: Gigant Stol Raqami (Sariq Quti)
      const boxW = 150;
      const boxH = 50;
      const boxY = 245;

      doc.setFillColor(255, 193, 7); 
      doc.roundedRect(cx - (boxW / 2), boxY, boxW, boxH, 10, 10, "F");
      
      // DIQQAT: T.uz.table ishlatilmoqda
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0); 
      doc.text(T.uz.table, cx, boxY + 14, { align: "center" }); 
      
      doc.setFontSize(75); 
      doc.text(tableNum.toString(), cx, boxY + 42, { align: "center" });

      // Faylni kompyuterga saqlash
      doc.save(`YALLA_${T.uz.table}_${tableNum}.pdf`);
      toast.success("PDF muvaffaqiyatli yuklandi!", { id: loadingToast });

    } catch (error) {
      toast.error("Xatolik yuz berdi", { id: loadingToast });
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] p-4 md:p-10 font-sans transition-colors duration-300">
      <Toaster position="top-center" />

      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{t.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{t.desc}</p>
        </header>

        {/* Sozlamalar Paneli */}
        <div className="bg-white dark:bg-[#111] rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-white/5 shadow-sm mb-10 flex flex-col md:flex-row gap-6 items-end">
          <div className="w-full md:w-1/2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">
              <LinkIcon className="w-4 h-4 text-[#FFC107]" /> {t.domain}
            </label>
            <input 
              type="text" 
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3.5 outline-none focus:border-[#FFC107]/50 focus:ring-2 focus:ring-[#FFC107]/20 transition-all font-medium"
            />
            <p className="text-xs text-gray-500 mt-2 ml-1 font-mono">{baseUrl}/[stol_raqami]?tab=menu</p>
          </div>

          <div className="w-full md:w-1/4">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">
              <Hash className="w-4 h-4 text-[#FFC107]" /> {t.tableCount}
            </label>
            <input 
              type="number" 
              min="1" max="100"
              value={tableCount}
              onChange={(e) => setTableCount(Number(e.target.value))}
              className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3.5 outline-none focus:border-[#FFC107]/50 focus:ring-2 focus:ring-[#FFC107]/20 transition-all font-black text-lg"
            />
          </div>

          <div className="w-full md:w-auto flex gap-3">
            <button onClick={handleGenerate} className="flex-1 md:flex-none bg-[#FFC107] text-black px-8 py-3.5 rounded-xl font-black hover:bg-[#e0a800] transition-colors shadow-lg shadow-[#FFC107]/20 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> {t.generate}
            </button>
          </div>
        </div>

        {/* Ekranda Ko'rinadigan Preview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {generatedTables.map((tableNum) => {
            const qrLink = `${baseUrl}/${tableNum}?tab=menu`;

            return (
              <div key={tableNum} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center relative shadow-sm group hover:shadow-xl transition-all duration-300 overflow-hidden">
                 
                 {/* Kichik UI Preview */}
                 <div className="w-full h-2 bg-[#FFC107] absolute top-0 left-0"></div>
                 
                 <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-widest mt-2 mb-4">
                   YALLA<span className="text-[#FFC107]">.</span>
                 </h3>

                 {/* Asosiy Canvas */}
                 <div className="bg-white p-3 rounded-2xl border-4 border-[#FFC107] shadow-md mb-5 relative">
                   <QRCodeCanvas 
                     id={`qr-canvas-${tableNum}`}
                     value={qrLink} 
                     size={160} 
                     bgColor={"#ffffff"}
                     fgColor={"#000000"} 
                     level={"H"} 
                     includeMargin={false}
                   />
                 </div>

                 <div className="text-center mb-6 w-full flex flex-col items-center">
                    {/* Ekranda ham faqat O'zbek tilida ko'rinadi */}
                    <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase flex items-center justify-center gap-1.5 mb-2 leading-tight max-w-[150px]">
                      <ScanLine className="w-4 h-4 text-[#FFC107] shrink-0"/> {T.uz.scanToOrder}
                    </p>
                    <div className="bg-[#FFC107] text-black rounded-2xl w-full py-2 shadow-inner">
                      <p className="text-[10px] font-bold uppercase tracking-widest">{T.uz.table}</p>
                      <p className="text-3xl font-black leading-none">{tableNum}</p>
                    </div>
                 </div>

                 {/* Alohida PDF Yuklab olish Tugmasi (Tugma yozuvi admin tiliga qarab o'zgaradi) */}
                 <button 
                   onClick={() => downloadSinglePDF(tableNum)}
                   className="w-full bg-gray-100 dark:bg-[#1A1A1A] text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-[#222] hover:text-[#FFC107] border border-gray-200 dark:border-white/5 py-3 rounded-xl flex items-center justify-center gap-2 font-black text-sm transition-all"
                 >
                   <FileDown className="w-4 h-4" /> {t.downloadPdf}
                 </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}