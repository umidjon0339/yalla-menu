"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, X, Plus, Minus, Check, Trash2, Pizza, Sparkles, Receipt, ChefHat, CheckCircle2, Clock, PartyPopper, Sun, Moon } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useCart } from "@/store/useCart";
import CartDrawer from "./_components/CartDrawer";

// ==============================
// SAHIFA UCHUN TARJIMALAR
// ==============================
const T = {
  uz: {
    menu: "Menyu", orders: "Buyurtmalarim", search: "Qidirish...", all: "Barchasi",
    table: "Stol", emptyOrders: "Buyurtmalar yo'q", emptyDesc: "Siz hali hech narsa buyurtma qilmadingiz. Menyudan o'zingizga yoqqan taomni tanlang!",
    orderTime: "Buyurtma vaqti", totalSum: "Jami summa", received: "Qabul qilindi",
    cooking: "Tayyorlanmoqda 🔥", ready: "Tayyor! 🎉", done: "Yakunlangan",
    descReceived: "Oshxona buyurtmangizni ko'rib chiqmoqda", descCooking: "Oshpazlarimiz taomingizni pishirishmoqda",
    descReady: "Ofitsiant taomingizni olib kelmoqda", descDone: "Buyurtma yopildi. Yana nima xohlaysiz?",
    contents: "Buyurtma tarkibi", openCart: "Savatchani ochish", size: "O'lcham", crust: "Xamir turi",
    extras: "Qo'shimchalar", save: "Saqlash", toCart: "Savatchaga", readyPopTitle: "Tayyor!",
    readyPopDesc: "dagi buyurtmangiz tayyor bo'ldi. Ofitsiant uni sizga olib kelmoqda!", readyPopBtn: "Tushunarli, kutyapman!",
    loading: "Taomlar yuklanmoqda"
  },
  ru: {
    menu: "Меню", orders: "Мои заказы", search: "Поиск...", all: "Все",
    table: "Стол", emptyOrders: "Нет заказов", emptyDesc: "Вы еще ничего не заказали. Выберите блюдо из меню!",
    orderTime: "Время заказа", totalSum: "Итого", received: "Принят",
    cooking: "Готовится 🔥", ready: "Готово! 🎉", done: "Завершен",
    descReceived: "Кухня рассматривает ваш заказ", descCooking: "Наши повара готовят ваше блюдо",
    descReady: "Официант несет ваше блюдо", descDone: "Заказ закрыт. Хотите что-то еще?",
    contents: "Состав заказа", openCart: "Открыть корзину", size: "Размер", crust: "Тип теста",
    extras: "Добавки", save: "Сохранить", toCart: "В корзину", readyPopTitle: "Готово!",
    readyPopDesc: "Ваш заказ готов. Официант уже несет его вам!", readyPopBtn: "Понятно, жду!",
    loading: "Загрузка меню"
  },
  en: {
    menu: "Menu", orders: "My Orders", search: "Search...", all: "All",
    table: "Table", emptyOrders: "No orders", emptyDesc: "You haven't ordered anything yet. Choose a dish from the menu!",
    orderTime: "Order time", totalSum: "Total sum", received: "Received",
    cooking: "Preparing 🔥", ready: "Ready! 🎉", done: "Completed",
    descReceived: "Kitchen is reviewing your order", descCooking: "Our chefs are preparing your dish",
    descReady: "Waiter is bringing your dish", descDone: "Order closed. Anything else?",
    contents: "Order contents", openCart: "Open Cart", size: "Size", crust: "Crust type",
    extras: "Extras", save: "Save", toCart: "Add to Cart", readyPopTitle: "Ready!",
    readyPopDesc: "Your order is ready. The waiter is bringing it to you!", readyPopBtn: "Got it, waiting!",
    loading: "Loading menu items"
  }
};

type LangType = 'uz' | 'ru' | 'en';
type ThemeType = 'light' | 'dark';

export default function CustomerMenuPage() {
  const params = useParams();
  const tableId = params.tableId as string;
  const searchParams = useSearchParams();
  const activeTabUrl = searchParams.get("tab") || "menu"; 

  const { cart, addToCart, removeFromCart, getItemQuantityInCart, getTotalAmount, getTotalItems } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  
  // YANGI: Yuklanish holati
  const [isLoading, setIsLoading] = useState(true);

  // Mavzu va Til Statelari
  const [lang, setLang] = useState<LangType>('uz');
  const [theme, setTheme] = useState<ThemeType>('dark');

  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedCrust, setSelectedCrust] = useState<any>(null);
  const [selectedExtras, setSelectedExtras] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);
  const [readyOrderPopup, setReadyOrderPopup] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    
    const savedLang = localStorage.getItem("customer_lang") as LangType;
    if (savedLang && T[savedLang]) setLang(savedLang);

    const savedTheme = localStorage.getItem("customer_theme") as ThemeType;
    if (savedTheme) setTheme(savedTheme);

    let isDataLoaded = { cat: false, items: false };
    const checkLoading = () => {
      if (isDataLoaded.cat && isDataLoaded.items) {
        setIsLoading(false);
      }
    };

    const qCategories = query(collection(db, "categories"), orderBy("order", "asc"));
    const unsubscribeCats = onSnapshot(qCategories, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      isDataLoaded.cat = true;
      checkLoading();
    });

    // ECONOMY STYLE: Faqat sotuvdagi taomlarni bazadan so'raymiz
    const qItems = query(collection(db, "menu_items"), where("isAvailable", "==", true), orderBy("createdAt", "desc"));
    const unsubscribeItems = onSnapshot(qItems, (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      isDataLoaded.items = true;
      checkLoading();
    });

    // ECONOMY STYLE: Faqatgina ayni damdagi (faol) buyurtmalarni chaqiramiz (1milyon buyurtma bo'lsa ham qotmaydi)
    const qOrders = query(
      collection(db, "orders"), 
      where("tableId", "==", tableId),
      where("status", "in", ["yangi", "tayyorlanmoqda", "tayyor"]) // YAKUNLANGANLAR KELMAYDI!
    );

    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const fetched: Array<{
        id: string;
        status?: string;
        createdAt?: { toMillis?: () => number };
        [key: string]: unknown;
      }> = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }));
      const activeMyOrders = fetched.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setMyOrders(activeMyOrders);

      const unacknowledgedReadyOrder = activeMyOrders.find((o) => o.status === "tayyor");

      if (unacknowledgedReadyOrder) {
        vibrate([100, 50, 100, 50, 200]); 
        setReadyOrderPopup(unacknowledgedReadyOrder);
      } else {
        setReadyOrderPopup(null);
      }
    });

    return () => { unsubscribeCats(); unsubscribeItems(); unsubscribeOrders(); };
  }, [tableId]);

  const vibrate = (ms: number | number[] = 20) => { if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(ms); };

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

  const closeReadyPopup = () => {
    setReadyOrderPopup(null);
  };

  const openItemModal = useCallback((item: any) => {
    vibrate(20);
    const existingCartItem = cart.find(c => c.id === item.id);
    if (existingCartItem) {
      setSelectedItem(item); setSelectedSize(existingCartItem.selectedSize);
      setSelectedCrust(existingCartItem.selectedCrust); setSelectedExtras(existingCartItem.selectedExtras || []);
      setQuantity(existingCartItem.quantity); setEditingCartItemId(existingCartItem.cartItemId);
    } else {
      setSelectedItem(item); setSelectedSize(item.sizes?.length > 0 ? item.sizes[0] : null);
      setSelectedCrust(item.crusts?.length > 0 ? item.crusts[0] : null); setSelectedExtras([]);
      setQuantity(1); setEditingCartItemId(null);
    }
  }, [cart]);

  const toggleExtra = useCallback((extra: any) => {
    vibrate(15);
    setSelectedExtras(prev => {
      const exists = prev.find(e => e.name === extra.name);
      if (exists) return prev.filter(e => e.name !== extra.name);
      return [...prev, extra];
    });
  }, []);

  const calculatedTotal = useMemo(() => {
    if (!selectedItem) return 0;
    let total = Number(selectedItem.basePrice) || 0;
    if (selectedItem.sizes?.length > 0 && selectedSize) total = Number(selectedSize.price);
    if (selectedCrust) total += Number(selectedCrust.price);
    selectedExtras.forEach(e => total += Number(e.price));
    return total * quantity; 
  }, [selectedItem, selectedSize, selectedCrust, selectedExtras, quantity]);

  const handleSaveToCart = () => {
    vibrate([30, 40, 30]);
    const cartItem = {
      cartItemId: editingCartItemId || Date.now().toString(), id: selectedItem.id,
      name: selectedItem.name, image: selectedItem.image, basePrice: selectedItem.basePrice,
      selectedSize, selectedCrust, selectedExtras, quantity, itemTotal: calculatedTotal
    };
    if (editingCartItemId) removeFromCart(editingCartItemId);
    addToCart(cartItem);
    setSelectedItem(null);
  };

  const filteredItems = useMemo(() => {
    return menuItems
      .filter(item => activeTab === "all" ? true : item.category === activeTab)
      .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [menuItems, activeTab, searchQuery]);

  const formatTime = (timestamp: any) => timestamp ? timestamp.toDate().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : "Hozir";

  if (!isMounted) return null;

  const t = T[lang] || T.uz;

  // ==========================================
  // JONLI ANIMATSIYA (LOADING STATE)
  // ==========================================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0A0A0A] transition-colors duration-300 pb-20">
        <div className="relative w-28 h-28 flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-[#FFC107] rounded-full animate-ping opacity-20 duration-1000"></div>
          <div className="absolute inset-2 bg-[#FFC107] rounded-full animate-pulse opacity-40"></div>
          <Pizza className="w-14 h-14 text-[#FFC107] relative z-10" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-widest uppercase">
            YALLA<span className="text-[#FFC107]">.</span>
          </h2>
          <div className="flex items-center gap-1.5 bg-white/50 dark:bg-white/5 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 backdrop-blur-sm">
            <span className="text-gray-600 dark:text-gray-300 font-bold text-xs tracking-widest uppercase">{t.loading}</span>
            <span className="flex gap-1 ml-1">
              <span className="w-1.5 h-1.5 bg-[#FFC107] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-[#FFC107] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-[#FFC107] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-[100px] selection:bg-[#FFC107] selection:text-black transition-colors duration-300">
      <Toaster position="top-center" />

      {activeTabUrl === "menu" && (
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#111] px-3 py-2.5 shadow-sm">
            <button
              onClick={() => { vibrate(15); setIsSearchOpen(!isSearchOpen); }}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-black uppercase transition-all border ${isSearchOpen ? 'bg-[#FFC107] text-black border-[#FFC107]' : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-white border-gray-200 dark:border-white/5'}`}
            >
              <Search className="w-4 h-4" />
              {isSearchOpen ? "Yopish" : t.search}
            </button>
            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate">
              {t.menu}
            </div>
          </div>
          {isSearchOpen && (
            <div className="mt-3 animate-in fade-in duration-300">
              <input autoFocus placeholder={t.search} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-[#FFC107]/50 focus:ring-2 focus:ring-[#FFC107]/20 text-sm shadow-sm transition-all" />
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: ASOSIY MENYU */}
      {activeTabUrl === "menu" && (
        <>
          <div className="px-4 py-3 flex overflow-x-auto no-scrollbar gap-2 sticky top-[68px] z-30 bg-white/90 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 transition-colors">
            {["all", ...categories.map(c => c.name)].map((cat) => (
              <button key={cat} onClick={() => { vibrate(15); setActiveTab(cat); }} className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap border ${activeTab === cat ? 'bg-[#FFC107] text-black border-[#FFC107] shadow-lg shadow-[#FFC107]/20' : 'bg-white dark:bg-[#111] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'}`}>
                {cat === "all" ? t.all : cat}
              </button>
            ))}
          </div>

          <main className="px-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5 pt-3">
            {filteredItems.map(item => {
              const qty = getItemQuantityInCart(item.id);
              return (
                <div key={item.id} onClick={() => openItemModal(item)} className={`bg-white dark:bg-[#111] rounded-[24px] overflow-hidden flex flex-col active:scale-[0.96] transition-all relative border ${qty > 0 ? 'border-[#FFC107] shadow-[0_0_15px_rgba(255,193,7,0.15)]' : 'border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'}`}>
                  {qty > 0 && <div className="absolute top-2 right-2 bg-[#FFC107] text-black w-7 h-7 rounded-full flex items-center justify-center font-black text-xs z-20 shadow-lg">{qty}</div>}
                  <div className="relative aspect-square w-full"><Image src={item.image || 'https://via.placeholder.com/400'} alt={item.name} fill className="object-cover" /></div>
                  <div className="p-3.5 flex-1 flex flex-col gap-1">
                    <h3 className="text-[13px] font-bold text-gray-900 dark:text-white line-clamp-1 leading-snug">{item.name}</h3>
                    <div className="flex justify-between items-center mt-auto pt-2">
                      <span className="text-yellow-600 dark:text-[#FFC107] font-black text-[13px]">{ (item.sizes?.[0]?.price || item.basePrice).toLocaleString() }</span>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm ${qty > 0 ? 'bg-[#FFC107] text-black' : 'bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-white'}`}>{qty > 0 ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </main>
        </>
      )}

      {/* VIEW 2: BUYURTMALARIM */}
      {activeTabUrl === "orders" && (
        <main className="px-4 py-4 space-y-4 flex flex-col min-h-[70vh]">
          {myOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 text-gray-400 dark:text-gray-500 animate-in fade-in zoom-in-95">
              <Receipt className="w-20 h-20 mb-4 opacity-20 text-gray-900 dark:text-white" />
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{t.emptyOrders}</h2>
              <p className="text-sm text-center max-w-[250px]">{t.emptyDesc}</p>
            </div>
          ) : (
            myOrders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-[#111] rounded-[24px] border border-gray-200 dark:border-white/5 p-4 md:p-5 relative overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 transition-colors">
                <div className="absolute top-0 left-0 right-0 h-1 flex">
                  <div className={`h-full flex-1 transition-colors duration-500 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]`} />
                  <div className={`h-full flex-1 transition-colors duration-500 ${order.status === 'tayyorlanmoqda' || order.status === 'tayyor' ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'bg-gray-200 dark:bg-[#222]'}`} />
                  <div className={`h-full flex-1 transition-colors duration-500 ${order.status === 'tayyor' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-gray-200 dark:bg-[#222]'}`} />
                </div>
                
                <div className="flex justify-between items-start mt-2 mb-4 border-b border-gray-100 dark:border-white/5 pb-4">
                  <div><span className="text-gray-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest">{t.orderTime}</span><h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white">{formatTime(order.createdAt)}</h3></div>
                  <div className="text-right"><span className="text-gray-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest">{t.totalSum}</span><h3 className="text-lg md:text-xl font-black text-yellow-600 dark:text-[#FFC107]">{order.totalAmount?.toLocaleString()} sum</h3></div>
                </div>
                
                <div className="bg-gray-50 dark:bg-[#0A0A0A] rounded-2xl p-4 flex items-center gap-4 border border-gray-100 dark:border-white/5 mb-5 shadow-inner">
                  {order.status === "yangi" && <div className="bg-red-50 dark:bg-red-500/20 p-3 rounded-full text-red-500 animate-pulse border border-red-200 dark:border-red-500/30"><Clock className="w-6 h-6" /></div>}
                  {order.status === "tayyorlanmoqda" && <div className="bg-yellow-50 dark:bg-yellow-400/20 p-3 rounded-full text-yellow-500 dark:text-yellow-400 animate-pulse border border-yellow-200 dark:border-yellow-400/30"><ChefHat className="w-6 h-6" /></div>}
                  {order.status === "tayyor" && <div className="bg-green-50 dark:bg-green-500/20 p-3 rounded-full text-green-600 dark:text-green-500 border border-green-200 dark:border-green-500/30"><CheckCircle2 className="w-6 h-6" /></div>}
                  <div>
                    <h4 className="text-[15px] md:text-base font-black text-gray-900 dark:text-white">
                      {order.status === "yangi" && t.received}
                      {order.status === "tayyorlanmoqda" && t.cooking}
                      {order.status === "tayyor" && t.ready}
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 text-[11px] md:text-xs font-semibold mt-1 leading-snug">
                      {order.status === "yangi" && t.descReceived}
                      {order.status === "tayyorlanmoqda" && t.descCooking}
                      {order.status === "tayyor" && t.descReady}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t.contents}</h5>
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-[#1A1A1A] p-3 rounded-xl border border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-black bg-[#FFC107] w-6 h-6 rounded-md flex items-center justify-center font-black text-xs shrink-0 shadow-sm">{item.quantity}x</span>
                        <span className="text-gray-900 dark:text-white font-bold text-[13px]">{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </main>
      )}

      {/* READY ORDER POP-UP */}
      {readyOrderPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4 transition-colors">
          <div className="bg-white dark:bg-[#111] border border-yellow-300 dark:border-[#FFC107]/50 rounded-[32px] p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(255,193,7,0.3)] animate-in zoom-in-90 duration-300">
            <div className="w-24 h-24 bg-[#FFC107] text-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(255,193,7,0.5)] animate-bounce">
              <PartyPopper className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{t.readyPopTitle}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              <span className="text-gray-900 dark:text-white font-bold">{formatTime(readyOrderPopup.createdAt)}</span> {t.readyPopDesc}
            </p>
            <button 
              onClick={closeReadyPopup}
              className="w-full bg-[#FFC107] text-black h-14 rounded-2xl font-black text-[15px] shadow-lg shadow-[#FFC107]/20 active:scale-95 transition-all"
            >
              {t.readyPopBtn}
            </button>
          </div>
        </div>
      )}

      {/* ITEM MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 dark:bg-black/90 backdrop-blur-md transition-colors">
           <div className="bg-white dark:bg-[#0A0A0A] w-full h-[92vh] sm:h-auto sm:max-h-[90vh] sm:max-w-md rounded-t-[40px] relative flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-400 shadow-2xl">
            <button onClick={() => setSelectedItem(null)} className="absolute top-5 right-5 z-[60] bg-white/50 dark:bg-black/50 backdrop-blur-md p-2 rounded-full text-gray-900 dark:text-white"><X className="w-6 h-6" /></button>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-40">
              <div className="w-full aspect-square relative bg-gray-100 dark:bg-[#111]"><Image src={selectedItem.image} alt={selectedItem.name} fill className="object-cover" /></div>
              <div className="p-6">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight">{selectedItem.name}</h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">{selectedItem.description}</p>
                {selectedItem.sizes?.length > 0 && (
                  <div className="mb-8"><div className="flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-[#FFC107]" /><h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t.size}</h4></div>
                    <div className="grid grid-cols-2 gap-3">{selectedItem.sizes.map((s: any, i: number) => { const isSelected = selectedSize?.name === s.name; return (<div key={i} onClick={() => { vibrate(20); setSelectedSize(s); }} className={`p-4 rounded-3xl border-2 transition-all flex flex-col gap-1 cursor-pointer ${isSelected ? 'border-[#FFC107] bg-yellow-50 dark:bg-[#FFC107]/5' : 'border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#111]'}`}><span className={`text-[15px] font-bold ${isSelected ? 'text-yellow-600 dark:text-[#FFC107]' : 'text-gray-900 dark:text-white'}`}>{s.name}</span><span className="text-xs text-gray-500 font-medium">{Number(s.price).toLocaleString()} sum</span></div>); })}</div>
                  </div>
                )}
                {selectedItem.crusts?.length > 0 && (
                  <div className="mb-8"><div className="flex items-center gap-2 mb-4"><Pizza className="w-4 h-4 text-[#FFC107]" /><h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t.crust}</h4></div>
                    <div className="grid grid-cols-2 gap-3">{selectedItem.crusts.map((c: any, i: number) => { const isSelected = selectedCrust?.name === c.name; return (<div key={i} onClick={() => { vibrate(20); setSelectedCrust(c); }} className={`p-4 rounded-3xl border-2 transition-all flex flex-col gap-1 cursor-pointer ${isSelected ? 'border-[#FFC107] bg-yellow-50 dark:bg-[#FFC107]/5' : 'border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#111]'}`}><span className={`text-[15px] font-bold ${isSelected ? 'text-yellow-600 dark:text-[#FFC107]' : 'text-gray-900 dark:text-white'}`}>{c.name}</span><span className="text-xs text-gray-500 font-medium">{c.price == 0 ? "Bepul" : `+${Number(c.price).toLocaleString()} sum`}</span></div>); })}</div>
                  </div>
                )}
                {selectedItem.extras?.length > 0 && (
                  <div className="mb-4"><div className="flex items-center gap-2 mb-4"><Plus className="w-4 h-4 text-[#FFC107]" /><h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t.extras}</h4></div>
                    <div className="flex flex-wrap gap-2">{selectedItem.extras.map((e: any, i: number) => { const isSelected = selectedExtras.some(ex => ex.name === e.name); return (<button key={i} onClick={() => toggleExtra(e)} className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 border ${isSelected ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent' : 'bg-gray-100 dark:bg-[#111] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}>{isSelected && <Check className="w-3.5 h-3.5" />} {e.name} <span className={`text-[11px] opacity-60 ml-1`}>+{Number(e.price).toLocaleString()}</span></button>); })}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md border-t border-gray-200 dark:border-white/5 pb-10">
              <div className="flex items-center gap-3">
                {editingCartItemId && (<button onClick={() => { vibrate(40); removeFromCart(editingCartItemId); setSelectedItem(null); }} className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center border border-red-200 dark:border-red-500/20 active:scale-90 transition-all"><Trash2 className="w-6 h-6" /></button>)}
                <div className="flex items-center justify-between bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl p-1 h-14 w-[130px] border border-gray-200 dark:border-white/10"><button onClick={() => { vibrate(20); setQuantity(q => Math.max(1, q - 1)); }} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-[#222] active:scale-95 shadow-sm text-gray-900 dark:text-white"><Minus className="w-5 h-5" /></button><span className="font-bold text-lg text-gray-900 dark:text-white">{quantity}</span><button onClick={() => { vibrate(20); setQuantity(q => q + 1); }} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-[#222] active:scale-95 shadow-sm text-gray-900 dark:text-white"><Plus className="w-5 h-5" /></button></div>
                <button onClick={handleSaveToCart} className="flex-1 bg-[#FFC107] text-black h-14 rounded-2xl font-black text-[15px] shadow-lg shadow-[#FFC107]/20 active:scale-95 transition-all flex items-center justify-center gap-2"><span>{editingCartItemId ? t.save : t.toCart}</span><span className="opacity-40 font-medium">|</span><span>{calculatedTotal.toLocaleString()} sum</span></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CART BUTTON */}
      {getTotalItems() > 0 && !isCartOpen && activeTabUrl === "menu" && (
        <div className="fixed bottom-[90px] left-6 right-6 z-40 animate-in slide-in-from-bottom-20 duration-500">
          <button onClick={() => { vibrate(30); setIsCartOpen(true); }} className="w-full bg-gray-900 dark:bg-white text-white dark:text-black h-[60px] rounded-2xl flex justify-between items-center px-5 shadow-2xl active:scale-95 transition-all group border border-transparent dark:border-white/20">
            <div className="flex items-center gap-3"><div className="bg-[#FFC107] text-black h-7 min-w-[28px] px-2 rounded-full flex items-center justify-center text-xs font-black shadow-sm">{getTotalItems()}</div><span className="text-[15px] font-black tracking-tight">{t.openCart}</span></div>
            <div className="flex items-center gap-2"><span className="text-[15px] font-black">{getTotalAmount().toLocaleString()} sum</span></div>
          </button>
        </div>
      )}

      {/* CART DRAWER */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} tableId={tableId} />
    </div>
  );
}