"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Pizza, Receipt, Sun, Moon, Globe } from "lucide-react";

// ==============================
// LAYOUT UCHUN TARJIMALAR
// ==============================
const T = {
  uz: { menu: "Menyu", orders: "Buyurtmalarim", table: "Stol" },
  ru: { menu: "Меню", orders: "Мои заказы", table: "Стол" },
  en: { menu: "Menu", orders: "My Orders", table: "Table" }
};

type LangType = 'uz' | 'ru' | 'en';
type ThemeType = 'light' | 'dark';

export default function CustomerMenuLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const tableId = params.tableId as string;
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "menu";

  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [lang, setLang] = useState<LangType>('uz');
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [isMounted, setIsMounted] = useState(false);

  // 1. INITIALIZER: Mavzu va Tilni keshdan o'qish va qo'llash
  useEffect(() => {
    setIsMounted(true);
    
    // Tilni o'qish
    const savedLang = localStorage.getItem("customer_lang") as LangType;
    if (savedLang && T[savedLang]) setLang(savedLang);

    // Mavzuni o'qish va HTML ga class qo'shish
    const savedTheme = localStorage.getItem("customer_theme") as ThemeType;
    if (savedTheme === 'light') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem("customer_theme", "dark");
    }

    // Sahifalar aro (Live) o'zgarishlarni sezish (Endi setInterval shart emas!)
    const handleStorageChange = () => {
      const currentLang = localStorage.getItem("customer_lang") as LangType;
      if (currentLang && T[currentLang]) setLang(currentLang);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 2. JONLI BADGE (Faqat shu qurilmadagi aktiv buyurtmalar soni)
  useEffect(() => {
    if (!tableId) return;
    
    // OPTIMIZATSIYA: Firebase'dan faqat aktiv statusdagi buyurtmalarni chaqiramiz (O'qish limitini tejaydi)
    const qOrders = query(
      collection(db, "orders"), 
      where("tableId", "==", tableId),
      where("status", "in", ["yangi", "tayyorlanmoqda", "tayyor"])
    );

    const unsubscribe = onSnapshot(qOrders, (snapshot) => {
      const count = snapshot.docs.length;
      setActiveOrdersCount(count);
    });

    return () => unsubscribe();
  }, [tableId]);

  const vibrate = (ms = 15) => {
    if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(ms);
  };

  const cycleLanguage = () => {
    const langs: LangType[] = ['uz', 'ru', 'en'];
    const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length];
    setLang(nextLang);
    localStorage.setItem("customer_lang", nextLang);
    window.dispatchEvent(new Event("storage"));
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem("customer_theme", newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    window.dispatchEvent(new Event("storage"));
  };

  if (!isMounted) return null;

  const t = T[lang] || T.uz;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] text-gray-900 dark:text-white transition-colors duration-300">

      {/* TOP BAR */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[64px] bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 transition-colors duration-300">
        <div className="h-full px-4 flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFC107]/15 dark:bg-[#FFC107]/10 flex items-center justify-center shrink-0 border border-[#FFC107]/20">
              <Pizza className="w-5 h-5 text-[#FFC107]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] sm:text-lg font-black tracking-tight text-gray-900 dark:text-white truncate">
                {activeTab === "menu" ? <><span className="hidden sm:inline">YALLA</span><span className="sm:hidden">Menyu</span><span className="text-[#FFC107]">.</span></> : t.orders}
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                {t.menu} • {t.orders}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={cycleLanguage}
              className="bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-white border border-gray-200 dark:border-white/5 px-2.5 py-1.5 rounded-full hover:text-[#FFC107] transition-all flex items-center justify-center shadow-sm text-[11px] font-black uppercase gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" /> {lang}
            </button>
            <button 
              onClick={toggleTheme}
              className="bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-white border border-gray-200 dark:border-white/5 p-1.5 rounded-full hover:text-[#FFC107] transition-all flex items-center justify-center shadow-sm"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm max-w-[45vw]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-300 truncate">{t.table} {tableId}</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Asosiy Sahifa */}
      <main className="pt-[64px] pb-[80px] transition-colors duration-300">
        {children}
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 h-[80px] bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/5 z-50 flex items-center justify-around px-2 pb-2 transition-colors duration-300">
        
        {/* Menyu Tugmasi */}
        <Link 
          href={`/menu/${tableId}?tab=menu`}
          onClick={() => vibrate()}
          className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-all duration-300 ${activeTab === "menu" ? "text-[#FFC107]" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"}`}
        >
          <div className={`p-2 rounded-full transition-colors ${activeTab === "menu" ? "bg-yellow-50 dark:bg-[#FFC107]/10" : ""}`}>
            <Pizza className={`w-6 h-6 ${activeTab === "menu" ? "text-[#FFC107] scale-110" : "text-gray-400"}`} />
          </div>
          <span className={`text-[10px] font-bold ${activeTab === "menu" ? "text-[#FFC107]" : "text-gray-500"}`}>{t.menu}</span>
        </Link>

        {/* Buyurtmalarim Tugmasi */}
        <Link 
          href={`/menu/${tableId}?tab=orders`}
          onClick={() => vibrate()}
          className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-all duration-300 relative ${activeTab === "orders" ? "text-[#FFC107]" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"}`}
        >
          <div className={`p-2 rounded-full transition-colors ${activeTab === "orders" ? "bg-yellow-50 dark:bg-[#FFC107]/10" : ""}`}>
            <Receipt className={`w-6 h-6 ${activeTab === "orders" ? "text-[#FFC107] scale-110" : "text-gray-400"}`} />
            
            {/* Qizil nuqta faqat shu telefondan qilingan buyurtma uchun yonadi */}
            {activeOrdersCount > 0 && (
              <span className="absolute top-2 right-1/3 translate-x-2 w-4 h-4 bg-red-500 border-2 border-white dark:border-[#0A0A0A] rounded-full text-[8px] font-black text-white flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">
                {activeOrdersCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-bold ${activeTab === "orders" ? "text-[#FFC107]" : "text-gray-500"}`}>{t.orders}</span>
        </Link>

      </nav>
    </div>
  );
}