"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Clock, ChefHat, CheckCircle2, MessageSquare, Volume2, VolumeX, ArrowRight, Maximize, Minimize, Info, X, Banknote } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

// ==============================
// LUG'AT (Tarjimalar)
// ==============================
const T = {
  uz: {
    new: "YANGI", prep: "JARAYONDA", ready: "TAYYOR", table: "Stol",
    justNow: "Hozirgina", minAgo: "daqiqa oldin",
    start: "Boshlash", readyBtn: "Tayyor", deliver: "Mijozga berildi",
    wait: "Buyurtma kutilyapti...", noPrep: "Jarayonda yo'q", noReady: "Tayyor taom yo'q",
    undo: "Bekor qilish", changed: "Holat o'zgartirildi",
    info: "Batafsil", close: "Yopish", total: "Jami", comment: "Izoh",
    items: "Taomlar ro'yxati", time: "Vaqti", newOrder: "Yangi buyurtma!"
  },
  ru: {
    new: "НОВЫЕ", prep: "ГОТОВИТСЯ", ready: "ГОТОВО", table: "Стол",
    justNow: "Только что", minAgo: "мин назад",
    start: "Начать", readyBtn: "Готово", deliver: "Выдано",
    wait: "Ожидание...", noPrep: "Нет готовящихся", noReady: "Нет готовых",
    undo: "Отменить", changed: "Статус изменен",
    info: "Подробнее", close: "Закрыть", total: "Итого", comment: "Коммент",
    items: "Список блюд", time: "Время", newOrder: "Новый заказ!"
  },
  en: {
    new: "NEW", prep: "PREPARING", ready: "READY", table: "Table",
    justNow: "Just now", minAgo: "mins ago",
    start: "Start", readyBtn: "Ready", deliver: "Delivered",
    wait: "Waiting...", noPrep: "None preparing", noReady: "None ready",
    undo: "Undo", changed: "Status changed",
    info: "Details", close: "Close", total: "Total", comment: "Comment",
    items: "Items list", time: "Time", newOrder: "New order!"
  }
};

type LangType = 'uz' | 'ru' | 'en';
type ThemeType = 'light' | 'dark';

export default function OrdersDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [lang, setLang] = useState<LangType>('uz');
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const previousOrdersCount = useRef(0);
  const [isMounted, setIsMounted] = useState(false);

  // ==============================
  // JONLI TIL VA MAVZU ALMASHTIRISH
  // ==============================
  useEffect(() => {
    setIsMounted(true);
    
    const savedLang = localStorage.getItem("admin_lang") as LangType;
    if (savedLang && T[savedLang]) setLang(savedLang);
    
    const savedTheme = localStorage.getItem("admin_theme") as ThemeType;
    if (savedTheme) setTheme(savedTheme);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "admin_lang" && e.newValue) setLang(e.newValue as LangType);
      if (e.key === "admin_theme" && e.newValue) setTheme(e.newValue as ThemeType);
    };

    const interval = setInterval(() => {
      const currentLang = localStorage.getItem("admin_lang") as LangType;
      if (currentLang && currentLang !== lang && T[currentLang]) setLang(currentLang);
      
      const currentTheme = localStorage.getItem("admin_theme") as ThemeType;
      if (currentTheme && currentTheme !== theme) setTheme(currentTheme);
    }, 500);

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [lang, theme]);

  const t = T[lang] || T.uz;

  // Web Audio API
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (error) { console.error(error); }
  };

  // ==========================================
  // ECONOMY STYLE FIREBASE FETCH
  // ==========================================
  useEffect(() => {
    if (!isMounted) return;
    setIsLoading(true);

    // DAHSHATLI OPTIMIZATSIYA:
    // Faqatgina 3 ta "Aktiv" statusdagi buyurtmalarni chaqiramiz. 
    // 100k "yakunlangan" buyurtmalar umuman o'qilmaydi va pulingiz tejaladi!
    const q = query(
      collection(db, "orders"), 
      where("status", "in", ["yangi", "tayyorlanmoqda", "tayyor"]),
      orderBy("createdAt", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeOrders: Array<{
        id: string;
        status?: string;
        [key: string]: unknown;
      }> = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }));
      
      setOrders(activeOrders);
      setIsLoading(false);

      const newOrdersCount = activeOrders.filter((o) => o.status === "yangi").length;
      if (newOrdersCount > previousOrdersCount.current && isSoundEnabled && !isLoading) {
        playNotificationSound();
        toast.success(t.newOrder, { style: { background: '#ef4444', color: '#fff', borderRadius: '12px', fontWeight: 'bold' }});
      }
      previousOrdersCount.current = newOrdersCount;
    });

    return () => unsubscribe();
  }, [isSoundEnabled, isMounted, t.newOrder]);

  const updateOrderStatus = async (orderId: string, oldStatus: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      toast.dismiss();
      toast((to) => (
        <div className="flex items-center justify-between w-full gap-4">
          <span className="text-sm font-semibold">{t.changed}</span>
          <button
            onClick={async () => {
              toast.dismiss(to.id);
              await updateDoc(doc(db, "orders", orderId), { status: oldStatus });
            }}
            className="bg-black/20 hover:bg-black/30 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          >
            {t.undo}
          </button>
        </div>
      ), { duration: 5000, style: { background: theme === 'dark' ? '#111' : '#3b82f6', color: '#fff' }});
    } catch (error) { toast.error("Error"); }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
      localStorage.setItem("admin_sidebar_collapsed", "true");
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return t.justNow;
    return timestamp.toDate().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  };

  // ==========================================
  // FRONTEND KESHLASH (USEMEMO)
  // ==========================================
  // Har doim React render qilganda minglab obyektlarni filter qilavermasligi uchun useMemo qo'shildi.
  const newOrders = useMemo(() => orders.filter(o => o.status === "yangi"), [orders]);
  const preparingOrders = useMemo(() => orders.filter(o => o.status === "tayyorlanmoqda"), [orders]);
  const readyOrders = useMemo(() => orders.filter(o => o.status === "tayyor"), [orders]);

  if (!isMounted) return null;

  const getZoomClasses = () => {
    switch(zoomLevel) {
      case 0: return { title: 'text-lg', item: 'text-[13px]', detail: 'text-[11px]', comment: 'text-[12px]', btn: 'text-xs h-10', padding: 'p-3.5' };
      case 1: return { title: 'text-xl', item: 'text-[15px]', detail: 'text-[12px]', comment: 'text-[13px]', btn: 'text-[14px] h-12', padding: 'p-5' };
      case 2: return { title: 'text-2xl', item: 'text-[17px]', detail: 'text-[13px]', comment: 'text-[15px]', btn: 'text-base h-14', padding: 'p-6' };
      default: return { title: 'text-xl', item: 'text-[15px]', detail: 'text-[12px]', comment: 'text-[13px]', btn: 'text-[14px] h-12', padding: 'p-5' };
    }
  };
  const z = getZoomClasses();

  const SkeletonCard = () => (
    <div className="bg-white dark:bg-[#171717] rounded-2xl p-5 flex flex-col gap-4 border border-gray-200 dark:border-white/5 relative overflow-hidden">
      <div className="animate-pulse flex justify-between items-center">
        <div>
          <div className="h-6 w-24 bg-gray-200 dark:bg-white/10 rounded-md mb-2"></div>
          <div className="h-4 w-16 bg-gray-200 dark:bg-white/10 rounded-md"></div>
        </div>
        <div className="h-8 w-20 bg-gray-200 dark:bg-white/10 rounded-lg"></div>
      </div>
      <div className="flex-1 flex flex-col gap-3 mt-2">
        <div className="flex gap-3"><div className="h-4 w-4 bg-gray-200 dark:bg-white/10 rounded-full shrink-0"></div><div className="h-4 w-full bg-gray-200 dark:bg-white/10 rounded-md"></div></div>
        <div className="flex gap-3"><div className="h-4 w-4 bg-gray-200 dark:bg-white/10 rounded-full shrink-0"></div><div className="h-4 w-3/4 bg-gray-200 dark:bg-white/10 rounded-md"></div></div>
      </div>
      <div className="h-12 w-full bg-gray-200 dark:bg-white/10 rounded-xl mt-4"></div>
    </div>
  );

  const OrderTimer = ({ createdAt }: { createdAt: any }) => {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
      if (!createdAt) return;
      const updateTimer = () => {
        const diffMins = Math.floor((new Date().getTime() - createdAt.toDate().getTime()) / 60000);
        setElapsed(Math.max(0, diffMins));
      };
      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
    }, [createdAt]);

    let colorClass = "text-gray-500 dark:text-neutral-400";
    let bgClass = "bg-gray-100 dark:bg-[#1A1A1A]";
    
    if (elapsed >= 25) { 
      colorClass = "text-red-600 dark:text-red-500 font-black animate-pulse"; 
      bgClass = "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 border"; 
    } else if (elapsed >= 15) { 
      colorClass = "text-yellow-600 dark:text-yellow-400 font-bold"; 
      bgClass = "bg-yellow-50 dark:bg-yellow-400/10 border-yellow-200 dark:border-yellow-400/20 border"; 
    }

    return (
      <div className={`flex items-center gap-1.5 ${z.detail} font-semibold px-2.5 py-1 rounded-lg transition-all ${bgClass} ${colorClass}`}>
        <Clock className="w-3.5 h-3.5 shrink-0" />
        {elapsed === 0 ? t.justNow : `${elapsed} ${t.minAgo}`}
      </div>
    );
  };

  const OrderCard = ({ order, status }: { order: any, status: string }) => {
    const statusColors = {
      yangi: "border-l-red-500 bg-white dark:bg-[#171717]",
      tayyorlanmoqda: "border-l-yellow-400 bg-white dark:bg-[#171717]",
      tayyor: "border-l-green-500 bg-white dark:bg-[#171717]"
    };

    return (
      <div className={`rounded-2xl ${z.padding} flex flex-col gap-4 border border-gray-200 dark:border-white/5 border-l-[4px] shadow-sm relative overflow-hidden transition-all duration-300 ${statusColors[status as keyof typeof statusColors]}`}>
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-3">
          <h2 className={`${z.title} font-black text-gray-900 dark:text-white tracking-tight leading-none`}>
            {t.table} {order.tableId}
          </h2>
          <button onClick={() => setSelectedOrder(order)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider">
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.info}</span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <OrderTimer createdAt={order.createdAt} />
          <div className={`flex items-center gap-1.5 bg-green-50 dark:bg-[#262626] text-green-700 dark:text-white px-2.5 py-1 rounded-lg ${z.detail} font-bold border border-green-200 dark:border-white/5`}>
            <Banknote className="w-3.5 h-3.5 hidden sm:block" />
            {order.totalAmount?.toLocaleString()}
          </div>
        </div>

        <div className="flex-1 flex flex-col mt-2">
          {order.items?.map((item: any, i: number) => (
            <div key={i} className={`flex items-start gap-3 py-2 ${i !== order.items.length - 1 ? 'border-b border-dashed border-gray-200 dark:border-white/10' : ''}`}>
              <span className="bg-amber-100 text-amber-800 dark:bg-[#FFC107]/20 dark:text-[#FFC107] font-black text-xs px-2 py-1 rounded-md min-w-[24px] text-center shrink-0">
                {item.quantity}x
              </span>
              <div className="flex flex-col">
                <span className={`text-gray-900 dark:text-white ${z.item} font-bold leading-tight`}>{item.name}</span>
                {(item.selectedSize || item.selectedCrust || item.selectedExtras?.length > 0) && (
                  <span className={`text-gray-500 dark:text-neutral-400 ${z.detail} font-medium leading-snug mt-1`}>
                    {[item.selectedSize?.name, item.selectedCrust?.name, ...(item.selectedExtras?.map((e:any) => `+${e.name}`) || [])].filter(Boolean).join(' • ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {order.comment && (
          <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3 flex items-start gap-2.5 mt-2 border border-red-100 dark:border-red-500/20">
            <MessageSquare className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
            <p className={`text-red-700 dark:text-red-200 ${z.comment} font-semibold leading-snug`}>{order.comment}</p>
          </div>
        )}

        <div className="pt-3 mt-auto">
          {status === "yangi" && (
            <button onClick={() => updateOrderStatus(order.id, "yangi", "tayyorlanmoqda")} className={`w-full bg-gray-900 dark:bg-[#262626] hover:bg-gray-800 dark:hover:bg-[#333] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${z.btn}`}>
              <ChefHat className="w-4 h-4 text-yellow-400" /> {t.start}
            </button>
          )}
          {status === "tayyorlanmoqda" && (
            <button onClick={() => updateOrderStatus(order.id, "tayyorlanmoqda", "tayyor")} className={`w-full bg-[#FFC107] text-black rounded-xl font-black flex items-center justify-center gap-2 hover:bg-[#e0a800] transition-all shadow-lg shadow-[#FFC107]/20 ${z.btn}`}>
              <CheckCircle2 className="w-5 h-5" /> {t.readyBtn}
            </button>
          )}
          {status === "tayyor" && (
            <button onClick={() => updateOrderStatus(order.id, "tayyor", "yakunlangan")} className={`w-full bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500 hover:bg-green-200 dark:hover:bg-green-500 dark:hover:text-white border border-green-200 dark:border-green-500/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${z.btn}`}>
              <ArrowRight className="w-4 h-4" /> {t.deliver}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-100 dark:bg-[#0a0a0a] flex flex-col font-sans overflow-hidden relative transition-colors duration-300">
      <Toaster position="bottom-center" />

      {/* ASOSIY DOSKA */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-4 md:p-5 custom-scrollbar snap-x snap-mandatory">
        <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-5 h-full items-start w-max md:w-full min-w-full">
          
          {/* 1. YANGI */}
          <div className="w-[85vw] sm:w-[340px] md:w-auto h-full flex flex-col bg-white dark:bg-[#121212] rounded-[24px] border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden snap-center shrink-0">
            <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5 bg-gradient-to-b from-red-500/5 dark:from-red-500/10 to-transparent">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> 
                {t.new}
              </h3>
              {!isLoading && <span className="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 px-3 py-1 rounded-full text-[13px] font-black">{newOrders.length}</span>}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              {isLoading ? (
                <><SkeletonCard /><SkeletonCard /></>
              ) : (
                <>
                  {newOrders.map(order => <OrderCard key={order.id} order={order} status="yangi" />)}
                  {newOrders.length === 0 && <p className="text-center text-gray-500 dark:text-neutral-600 mt-10 font-medium text-sm">{t.wait}</p>}
                </>
              )}
            </div>
          </div>

          {/* 2. JARAYONDA */}
          <div className="w-[85vw] sm:w-[340px] md:w-auto h-full flex flex-col bg-white dark:bg-[#121212] rounded-[24px] border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden snap-center shrink-0">
            <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5 bg-gradient-to-b from-yellow-400/5 dark:from-yellow-400/10 to-transparent">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]" /> 
                {t.prep}
              </h3>
              {!isLoading && <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-400 px-3 py-1 rounded-full text-[13px] font-black">{preparingOrders.length}</span>}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              {isLoading ? (
                <><SkeletonCard /></>
              ) : (
                <>
                  {preparingOrders.map(order => <OrderCard key={order.id} order={order} status="tayyorlanmoqda" />)}
                  {preparingOrders.length === 0 && <p className="text-center text-gray-500 dark:text-neutral-600 mt-10 font-medium text-sm">{t.noPrep}</p>}
                </>
              )}
            </div>
          </div>

          {/* 3. TAYYOR */}
          <div className="w-[85vw] sm:w-[340px] md:w-auto h-full flex flex-col bg-white dark:bg-[#121212] rounded-[24px] border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden snap-center shrink-0">
            <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5 bg-gradient-to-b from-green-500/5 dark:from-green-500/10 to-transparent">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> 
                {t.ready}
              </h3>
              {!isLoading && <span className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 px-3 py-1 rounded-full text-[13px] font-black">{readyOrders.length}</span>}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              {isLoading ? (
                <></>
              ) : (
                <>
                  {readyOrders.map(order => <OrderCard key={order.id} order={order} status="tayyor" />)}
                  {readyOrders.length === 0 && <p className="text-center text-gray-500 dark:text-neutral-600 mt-10 font-medium text-sm">{t.noReady}</p>}
                </>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* INFO MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#171717]">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t.table} {selectedOrder.tableId}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mt-1">{t.time}: {formatTime(selectedOrder.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2.5 bg-gray-200 dark:bg-white/5 rounded-full hover:bg-gray-300 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <h3 className="text-[11px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest mb-4">{t.items}</h3>
              <div className="space-y-3">
                {selectedOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/5">
                    <div className="bg-[#FFC107] text-black font-black w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg shadow-sm">
                      {item.quantity}
                    </div>
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-bold text-[17px] mb-1">{item.name}</h4>
                      <div className="flex flex-col gap-1">
                        {item.selectedSize && <span className="text-gray-600 dark:text-gray-400 text-sm"><b className="text-gray-800 dark:text-gray-300">O'lcham:</b> {item.selectedSize.name}</span>}
                        {item.selectedCrust && <span className="text-gray-600 dark:text-gray-400 text-sm"><b className="text-gray-800 dark:text-gray-300">Xamir:</b> {item.selectedCrust.name}</span>}
                        {item.selectedExtras?.length > 0 && <span className="text-gray-600 dark:text-gray-400 text-sm"><b className="text-gray-800 dark:text-gray-300">Qo'sh:</b> {item.selectedExtras.map((e:any)=>e.name).join(', ')}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedOrder.comment && (
                <div className="mt-6">
                  <h3 className="text-[11px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest mb-2">{t.comment}</h3>
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl p-4">
                    <p className="text-red-700 dark:text-red-200 text-[15px] font-semibold leading-relaxed">{selectedOrder.comment}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#171717] flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-sm tracking-widest">{t.total}</span>
              <span className="text-gray-900 dark:text-[#FFC107] font-black text-2xl">{selectedOrder.totalAmount?.toLocaleString()} so'm</span>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTIONS */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button onClick={() => setZoomLevel(prev => Math.min(prev + 1, 2))} className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#262626] transition-all shadow-lg font-bold text-sm">A+</button>
        <button onClick={() => setZoomLevel(prev => Math.max(prev - 1, 0))} className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#262626] transition-all shadow-lg font-bold text-sm">A-</button>
        <button onClick={toggleFullscreen} className="w-14 h-14 flex items-center justify-center rounded-full bg-white dark:bg-[#262626] text-gray-700 dark:text-white shadow-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-all border border-gray-200 dark:border-white/10">
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
        <button onClick={() => { setIsSoundEnabled(!isSoundEnabled); if (!isSoundEnabled) { playNotificationSound(); toast.success("Ovoz yoqildi", { style: { background: '#22c55e', color: '#fff' }}); } }} className={`w-14 h-14 flex items-center justify-center rounded-full shadow-2xl transition-all ${isSoundEnabled ? 'bg-green-500 text-white' : 'bg-white dark:bg-[#262626] text-gray-500 dark:text-neutral-400 border border-gray-200 dark:border-white/10'}`}>
          {isSoundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>
      </div>

    </div>
  );
}