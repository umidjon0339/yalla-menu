"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Pizza, QrCode, LogOut, LayoutDashboard, ChefHat, Sun, Moon, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

// ==========================================
// LUG'AT (Tarjimalar)
// ==========================================
const TRANSLATIONS = {
  uz: { dashboard: "Asosiy", menu: "Menyu", qr: "QR Kod", kitchen: "Oshxona", settings: "Sozlamalar", logout: "Chiqish", confirmLogout: "Tizimdan chiqmoqchimisiz?" },
  ru: { dashboard: "Главная", menu: "Меню", qr: "QR Код", kitchen: "Кухня", settings: "Настройки", logout: "Выйти", confirmLogout: "Выйти из системы?" },
  en: { dashboard: "Dashboard", menu: "Menu", qr: "QR Code", kitchen: "Kitchen", settings: "Settings", logout: "Logout", confirmLogout: "Are you sure you want to logout?" }
};

type LangType = 'uz' | 'ru' | 'en';
type ThemeType = 'dark' | 'light';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // ==========================================
  // STATELAR (Xotira va UI holati)
  // ==========================================
  const [isMounted, setIsMounted] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lang, setLang] = useState<LangType>('uz');
  const [theme, setTheme] = useState<ThemeType>('dark');

  // Keshdan (LocalStorage) ma'lumotlarni o'qish
  useEffect(() => {
    setIsMounted(true);
    
    // 1. Sidebar holati
    const savedSidebar = localStorage.getItem("admin_sidebar_collapsed");
    if (savedSidebar) setIsCollapsed(JSON.parse(savedSidebar));

    // 2. Til holati
    const savedLang = localStorage.getItem("admin_lang") as LangType;
    if (savedLang && TRANSLATIONS[savedLang]) setLang(savedLang);

    // 3. Mavzu holati (Theme)
    const savedTheme = localStorage.getItem("admin_theme") as ThemeType;
    if (savedTheme === 'light') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }

    // 4. Oshxonadagi yangi buyurtmalarni sanash
    const q = query(collection(db, "orders"), where("status", "==", "yangi"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNewOrdersCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, []);

  // ==========================================
  // FUNKSIYALAR
  // ==========================================
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem("admin_theme", newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const cycleLanguage = () => {
    const langs: LangType[] = ['uz', 'ru', 'en'];
    const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length];
    setLang(nextLang);
    localStorage.setItem("admin_lang", nextLang);
  };

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("admin_sidebar_collapsed", JSON.stringify(newState));
  };

  const handleLogout = async () => {
    if (window.confirm(TRANSLATIONS[lang].confirmLogout)) {
      try {
        await signOut(auth);
        document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        toast.success(TRANSLATIONS[lang].logout);
        router.push("/login");
      } catch (error) {
        toast.error("Error");
      }
    }
  };

  // Dinamik Linklar (Tilga qarab o'zgaradi)
  const navLinks = [
    { id: "dashboard", href: "/admin", icon: LayoutDashboard },
    { id: "menu", href: "/admin/menu", icon: Pizza },
    { id: "qr", href: "/admin/qr", icon: QrCode },
    { id: "kitchen", href: "/admin/orders", icon: ChefHat },
  ];

  // Hydration xatosini oldini olish
  if (!isMounted) return <div className="h-screen bg-[#0A0A0A]"></div>;

  const t = TRANSLATIONS[lang];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0A0A0A] overflow-hidden transition-colors duration-300">
      
      {/* =========================================
          1. MOBIL TOP BAR (Oq/Qora moslashgan)
      ========================================= */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white/90 dark:bg-[#111]/90 backdrop-blur-md border-b border-gray-200 dark:border-[#222] px-4 flex items-center justify-between z-40 transition-colors">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-widest">
          YALLA<span className="text-[#FFC107]">.</span>
        </h1>
        <div className="flex items-center gap-2">
          {/* Mobil Til va Mavzu almashtirish */}
          <button onClick={cycleLanguage} className="p-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#1A1A1A] rounded-full border border-gray-200 dark:border-[#333]">
            {lang}
          </button>
          <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#1A1A1A] rounded-full border border-gray-200 dark:border-[#333]">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* =========================================
          2. DESKTOP SIDEBAR (Kengayib/Yig'iladigan)
      ========================================= */}
      <aside className={`hidden md:flex flex-col bg-white dark:bg-[#111] border-r border-gray-200 dark:border-[#222] shrink-0 h-screen transition-all duration-300 relative z-50 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        
        {/* Toggle Button (Suzib turuvchi o'q tugma) */}
        <button 
          onClick={toggleSidebar} 
          className="absolute top-7 -right-3.5 w-7 h-7 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow-md transition-all z-50"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <div className={`h-20 flex items-center border-b border-gray-200 dark:border-[#222] shrink-0 transition-all overflow-hidden ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-widest whitespace-nowrap">
            {isCollapsed ? <span className="text-[#FFC107]">Y.</span> : <>YALLA<span className="text-[#FFC107]">.</span></>}
          </h1>
        </div>

        {/* Nav Linklar */}
        <nav className="flex-1 py-6 flex flex-col gap-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.id} 
                href={link.href}
                className={`flex items-center gap-3 py-3.5 rounded-xl font-semibold transition-all duration-200 group relative ${
                  isCollapsed ? "justify-center px-0 mx-3" : "px-4 mx-4"
                } ${
                  isActive 
                    ? "bg-[#FFC107]/10 text-[#FFC107]" 
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222] hover:text-gray-900 dark:hover:text-white"
                }`}
                title={isCollapsed ? t[link.id as keyof typeof t] : ""}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-[#FFC107]" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`} />
                
                {!isCollapsed && <span className="whitespace-nowrap">{t[link.id as keyof typeof t]}</span>}
                
                {/* Buyurtmalar soni Badgelari */}
                {link.id === "kitchen" && newOrdersCount > 0 && (
                  isCollapsed ? (
                    <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)] border border-white dark:border-[#111]" />
                  ) : (
                    <span className="ml-auto bg-red-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse shrink-0">
                      {newOrdersCount}
                    </span>
                  )
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer (Sozlamalar va Chiqish) */}
        <div className={`p-4 border-t border-gray-200 dark:border-[#222] flex flex-col gap-3 transition-all ${isCollapsed ? 'items-center' : ''}`}>
          
          {/* Til va Mavzu */}
          <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : 'justify-between'}`}>
            <button 
              onClick={cycleLanguage} 
              title="Tilni o'zgartirish"
              className={`flex items-center gap-2 p-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#222] font-bold uppercase text-[11px] transition-all ${isCollapsed ? 'justify-center w-full' : 'flex-1'}`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>{lang}</span>}
            </button>

            <button 
              onClick={toggleTheme} 
              title="Mavzuni o'zgartirish"
              className={`flex items-center gap-2 p-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#222] font-bold text-[11px] transition-all ${isCollapsed ? 'justify-center w-full' : 'flex-1'}`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
              {!isCollapsed && <span>Mode</span>}
            </button>
          </div>

          {/* Chiqish */}
          <button 
            onClick={handleLogout}
            title={isCollapsed ? t.logout : ""}
            className={`flex items-center gap-3 p-3.5 rounded-xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all ${isCollapsed ? 'justify-center w-full' : 'w-full'}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">{t.logout}</span>}
          </button>
        </div>
      </aside>

      {/* =========================================
          3. ASOSIY KONTENT (Oq/Qora moslashgan)
      ========================================= */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative pt-[60px] pb-[70px] md:pt-0 md:pb-0 transition-colors duration-300">
        {children}
      </main>

      {/* =========================================
          4. MOBILE BOTTOM NAV
      ========================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] bg-white/90 dark:bg-[#111]/90 backdrop-blur-md border-t border-gray-200 dark:border-[#222] z-50 flex items-center justify-around px-1 pb-1 transition-colors">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.id} 
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 ${
                isActive ? "text-[#FFC107]" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
            >
              <div className={`relative p-1.5 rounded-full transition-colors ${isActive ? "bg-[#FFC107]/10" : ""}`}>
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#FFC107]" : "text-gray-400"}`} />
                
                {link.id === "kitchen" && newOrdersCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-[#111] rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                )}
              </div>
              <span className={`text-[10px] font-bold ${isActive ? "text-[#FFC107]" : "text-gray-500"}`}>
                {t[link.id as keyof typeof t]}
              </span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}