"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteMenuItemWithImage } from "@/lib/db";
import { Plus, Search, Edit2, Trash2, Clock, X, AlertTriangle, Info, Pizza, LayoutGrid, Loader2 } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import AddItemModal from "./_components/AddItemModal";

// ==============================
// LUG'AT (Tarjimalar)
// ==============================
const T = {
  uz: {
    menu: "Menyu", itemsCount: "ta taom mavjud", newItem: "Yangi taom", search: "Taom izlash...",
    all: "Barchasi", outOfStock: "TUGAGAN", details: "Batafsil", from: "dan",
    deleteTitle: "O'chirish", deleteConfirm1: "taomnomasini rostdan ham butunlay o'chirmoqchimisiz?",
    yes: "Ha, o'chirish", no: "Yo'q", empty: "Hech narsa topilmadi",
    basePrice: "Asosiy narx", sizes: "O'lchamlar", crusts: "Xamir turi", extras: "Qo'shimchalar",
    free: "Bepul", takenOff: "Sotuvdan olindi", putOnSale: "Sotuvga qo'yildi", descEmpty: "Ta'rif kiritilmagan.",
    loading: "Yuklanmoqda..."
  },
  ru: {
    menu: "Меню", itemsCount: "блюд в наличии", newItem: "Новое блюдо", search: "Поиск блюда...",
    all: "Все", outOfStock: "ЗАКОНЧИЛОСЬ", details: "Подробнее", from: "от",
    deleteTitle: "Удалить", deleteConfirm1: "вы действительно хотите навсегда удалить это блюдо?",
    yes: "Да, удалить", no: "Нет", empty: "Ничего не найдено",
    basePrice: "Базовая цена", sizes: "Размеры", crusts: "Тип теста", extras: "Добавки",
    free: "Бесплатно", takenOff: "Снято с продажи", putOnSale: "В продаже", descEmpty: "Описание не добавлено.",
    loading: "Загрузка..."
  },
  en: {
    menu: "Menu", itemsCount: "items available", newItem: "New item", search: "Search item...",
    all: "All", outOfStock: "OUT OF STOCK", details: "Details", from: "from",
    deleteTitle: "Delete", deleteConfirm1: "are you sure you want to permanently delete this item?",
    yes: "Yes, delete", no: "No", empty: "Nothing found",
    basePrice: "Base price", sizes: "Sizes", crusts: "Crust types", extras: "Extras",
    free: "Free", takenOff: "Taken off sale", putOnSale: "Put on sale", descEmpty: "No description provided.",
    loading: "Loading..."
  }
};

type LangType = 'uz' | 'ru' | 'en';

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [detailsItem, setDetailsItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState<LangType>('uz');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedLang = localStorage.getItem("admin_lang") as LangType;
    if (savedLang && T[savedLang]) setLang(savedLang);

    const handleStorageChange = () => {
      const currentLang = localStorage.getItem("admin_lang") as LangType;
      if (currentLang && T[currentLang]) setLang(currentLang);
    };

    const interval = setInterval(() => {
      const currentLang = localStorage.getItem("admin_lang") as LangType;
      if (currentLang && currentLang !== lang && T[currentLang]) setLang(currentLang);
    }, 500);

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [lang]);

  useEffect(() => {
    const qCategories = query(collection(db, "categories"), orderBy("order", "asc"));
    const unsubscribeCats = onSnapshot(qCategories, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qItems = query(collection(db, "menu_items"), orderBy("createdAt", "desc"));
    const unsubscribeItems = onSnapshot(qItems, (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    return () => { unsubscribeCats(); unsubscribeItems(); };
  }, []);

  const t = T[lang] || T.uz;

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "menu_items", id), { isAvailable: !currentStatus });
      toast.success(currentStatus ? t.takenOff : t.putOnSale);
    } catch (error) {
      toast.error("Error");
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const loadingToast = toast.loading("...");
    try {
      await deleteMenuItemWithImage(itemToDelete.id, itemToDelete.image);
      toast.success("O'chirildi!", { id: loadingToast });
      setItemToDelete(null);
    } catch (error) {
      toast.error("Xatolik!", { id: loadingToast });
    }
  };

  const filteredItems = menuItems
    .filter(item => activeTab === "all" ? true : item.category === activeTab)
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // SKELETON KARTA
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-[#111] rounded-2xl md:rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col shadow-sm">
      <div className="w-full aspect-square bg-gray-200 dark:bg-white/5 animate-pulse"></div>
      <div className="p-3 md:p-5 flex-1 flex flex-col gap-3">
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-white/10 rounded animate-pulse"></div>
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-white/10 rounded animate-pulse"></div>
        <div className="mt-auto h-8 w-full bg-gray-200 dark:bg-white/10 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] pb-28 md:pb-10 font-sans transition-colors duration-300">
      <Toaster position="top-center" />

      {/* =========================================
          HEADER (Top Bar)
      ========================================= */}
      <header className="px-4 pt-6 pb-2 md:p-10 max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
        
        {/* Sarlavha va Yuklanish holati */}
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{t.menu}</h1>
          <div className="flex items-center gap-2 mt-1">
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium">{t.loading}</p>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium">{menuItems.length} {t.itemsCount}</p>
            )}
          </div>
        </div>

        {/* Qidiruv va Qo'shish tugmasi bir qatorda */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full sm:w-64 lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#FFC107] transition-colors" />
            <input 
              placeholder={t.search}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl pl-12 pr-4 py-3 md:py-3.5 outline-none focus:border-[#FFC107]/50 focus:ring-2 focus:ring-[#FFC107]/20 transition-all text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-sm"
            />
          </div>

          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="bg-[#FFC107] w-full sm:w-auto text-black px-6 py-3 md:py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-[#FFC107]/20 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> 
            <span>{t.newItem}</span>
          </button>
        </div>
      </header>

      {/* =========================================
          KATEGORIYALAR
      ========================================= */}
      <div className="sticky top-[60px] md:top-0 z-30 bg-gray-50/90 dark:bg-[#0A0A0A]/90 backdrop-blur-xl py-3 border-b border-gray-200 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto no-scrollbar gap-2.5 items-center">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-2 border ${
              activeTab === "all" 
              ? "bg-[#FFC107] text-black border-[#FFC107] shadow-md shadow-[#FFC107]/20" 
              : "bg-white dark:bg-[#111] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] dark:hover:text-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> {t.all}
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.name)}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap border ${
                activeTab === cat.name 
                ? "bg-[#FFC107] text-black border-[#FFC107] shadow-md shadow-[#FFC107]/20" 
                : "bg-white dark:bg-[#111] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] dark:hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================
          ASOSIY GRID
      ========================================= */}
      <main className="max-w-7xl mx-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 mt-2">
        {isLoading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 animate-in fade-in">
            <Search className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-bold">{t.empty}</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="bg-white dark:bg-[#111] rounded-2xl md:rounded-3xl overflow-hidden flex flex-col group transition-all border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 active:scale-[0.98] shadow-sm animate-in fade-in zoom-in-95 duration-300">
              
              <div className="relative aspect-square w-full bg-gray-100 dark:bg-[#0A0A0A] overflow-hidden">
                <Image 
                  src={item.image || 'https://via.placeholder.com/400'} 
                  alt={item.name} fill 
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className={`object-cover transition-transform duration-700 group-hover:scale-105 ${!item.isAvailable && 'opacity-30 grayscale'}`} 
                />
                
                {!item.isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center p-2 bg-black/10">
                    <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-lg">{t.outOfStock}</span>
                  </div>
                )}

                <div className="absolute top-2 right-2 flex flex-col gap-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="bg-white/80 dark:bg-black/60 backdrop-blur-md text-gray-900 dark:text-white p-2 rounded-xl hover:bg-[#FFC107] hover:text-black transition shadow-md">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setItemToDelete(item)} className="bg-white/80 dark:bg-black/60 backdrop-blur-md text-red-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition shadow-md">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 md:p-5 flex-1 flex flex-col">
                <div className="mb-2">
                  <h3 className="text-sm md:text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">{item.name}</h3>
                  <p className="text-yellow-600 dark:text-[#FFC107] font-black text-xs md:text-base">
                    {item.basePrice === 0 && item.sizes?.length > 0 ? `${item.sizes[0].price.toLocaleString()} ${t.from}` : `${item.basePrice?.toLocaleString()} so'm`}
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-gray-500 mb-4">
                  <Clock className="w-3 h-3 text-gray-400" /> {item.cookingTime}
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <button 
                    onClick={() => setDetailsItem(item)}
                    className="flex-1 py-2 bg-gray-100 dark:bg-[#1A1A1A] hover:bg-gray-200 dark:hover:bg-[#222] text-gray-700 dark:text-white rounded-lg text-[11px] md:text-xs font-bold transition border border-gray-200 dark:border-white/5"
                  >
                    {t.details}
                  </button>
                  
                  <button 
                    onClick={() => toggleAvailability(item.id, item.isAvailable)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 focus:outline-none ${item.isAvailable ? 'bg-green-500' : 'bg-gray-300 dark:bg-[#222]'}`}
                   >
                     <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 shadow-sm ${item.isAvailable ? 'translate-x-5' : 'translate-x-0.5'}`} />
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* =========================================
          MODALLAR
      ========================================= */}

      {/* DETAILS MODAL */}
      {detailsItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <button onClick={() => setDetailsItem(null)} className="absolute top-4 right-4 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-md p-2.5 rounded-full text-gray-900 dark:text-white hover:bg-[#FFC107] hover:text-black transition shadow-lg">
              <X className="w-5 h-5" />
            </button>

            <div className="w-full aspect-square md:w-[400px] md:h-[400px] relative bg-gray-100 dark:bg-[#0A0A0A] shrink-0 border-r border-gray-200 dark:border-white/5">
              <Image src={detailsItem.image || 'https://via.placeholder.com/400'} alt={detailsItem.name} fill className="object-cover" />
              <div className="absolute bottom-4 left-4 flex gap-2">
                 <span className="bg-[#FFC107] text-black text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                   <Clock className="w-3.5 h-3.5"/> {detailsItem.cookingTime}
                 </span>
              </div>
            </div>
            
            <div className="flex-1 p-6 md:p-8 flex flex-col bg-white dark:bg-[#111] max-h-[50vh] md:max-h-none md:h-[400px] overflow-y-auto custom-scrollbar">
              <div className="mb-6 pr-8">
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2">{detailsItem.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{detailsItem.description || t.descEmpty}</p>
              </div>

              <div className="space-y-6 flex-1">
                {detailsItem.basePrice > 0 && !(detailsItem.sizes?.length > 0) && (
                  <div className="bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl p-4 flex justify-between items-center border border-gray-100 dark:border-white/5">
                    <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">{t.basePrice}</span>
                    <span className="text-[#FFC107] text-xl font-black">{detailsItem.basePrice.toLocaleString()} so'm</span>
                  </div>
                )}

                {detailsItem.sizes?.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Info className="w-4 h-4"/> {t.sizes}</h4>
                    <div className="space-y-2">
                      {detailsItem.sizes.map((s: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-[#1A1A1A] p-3.5 rounded-xl border border-gray-100 dark:border-white/5">
                          <span className="text-gray-900 dark:text-white font-semibold text-sm">{s.name}</span>
                          <span className="text-yellow-600 dark:text-[#FFC107] font-black">{Number(s.price).toLocaleString()} so'm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailsItem.crusts?.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Pizza className="w-4 h-4"/> {t.crusts}</h4>
                    <div className="space-y-2">
                      {detailsItem.crusts.map((c: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-[#1A1A1A] p-3.5 rounded-xl border border-gray-100 dark:border-white/5">
                          <span className="text-gray-800 dark:text-white font-medium text-sm">{c.name}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold">{c.price == 0 ? t.free : `+${Number(c.price).toLocaleString()} so'm`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailsItem.extras?.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Plus className="w-4 h-4"/> {t.extras}</h4>
                    <div className="space-y-2">
                      {detailsItem.extras.map((e: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-[#1A1A1A] p-3.5 rounded-xl border border-gray-100 dark:border-white/5">
                          <span className="text-gray-800 dark:text-white font-medium text-sm">{e.name}</span>
                          <span className="text-green-600 dark:text-green-400 text-sm font-bold">+{Number(e.price).toLocaleString()} so'm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 dark:bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-6 md:p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.deleteTitle}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-8 leading-relaxed">
              <span className="text-gray-900 dark:text-white font-bold">{itemToDelete.name}</span> {t.deleteConfirm1}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setItemToDelete(null)} className="flex-1 py-3.5 rounded-2xl font-bold bg-gray-100 dark:bg-[#1A1A1A] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#222] transition border border-gray-200 dark:border-transparent">{t.no}</button>
              <button onClick={confirmDelete} className="flex-1 py-3.5 rounded-2xl font-bold bg-red-500 text-white hover:bg-red-600 transition shadow-lg shadow-red-500/20">{t.yes}</button>
            </div>
          </div>
        </div>
      )}

      <AddItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} categories={categories} item={editingItem} isEditMode={!!editingItem} />
    </div>
  );
}