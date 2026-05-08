"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Minus, Plus, Trash2, MessageSquare, CheckCircle, ChevronDown } from "lucide-react";
import { useCart } from "@/store/useCart";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "react-hot-toast";

// ==============================
// LUG'AT (Tarjimalar)
// ==============================
const T = {
  uz: {
    cart: "Savatcha", clear: "Tozalash", empty: "Savatcha bo'sh", emptyDesc: "Menu orqali taomlarni qo'shing.",
    commentTitle: "Izoh qoldirish", commentPlaceholder: "Masalan: Piyozsiz qiling, tezroq olib keling...",
    submitting: "Yuborilmoqda...", orderBtn: "Buyurtma berish",
    successTitle: "Qabul qilindi!", successDesc: "Buyurtmangiz oshxonaga yetib bordi. Tez orada tayyor bo'ladi.",
    expiredMsg: "Savatcha vaqt o'tganligi sababli tozalandi"
  },
  ru: {
    cart: "Корзина", clear: "Очистить", empty: "Корзина пуста", emptyDesc: "Добавьте блюда из меню.",
    commentTitle: "Оставить комментарий", commentPlaceholder: "Например: Без лука, принесите быстрее...",
    submitting: "Отправка...", orderBtn: "Оформить заказ",
    successTitle: "Принято!", successDesc: "Ваш заказ отправлен на кухню. Скоро будет готово.",
    expiredMsg: "Корзина очищена по истечении времени"
  },
  en: {
    cart: "Cart", clear: "Clear", empty: "Cart is empty", emptyDesc: "Add items from the menu.",
    commentTitle: "Leave a comment", commentPlaceholder: "E.g.: No onions, bring it faster...",
    submitting: "Submitting...", orderBtn: "Place Order",
    successTitle: "Accepted!", successDesc: "Your order has reached the kitchen. It will be ready soon.",
    expiredMsg: "Cart cleared due to expiration"
  }
};

type LangType = 'uz' | 'ru' | 'en';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string | string[];
}

export default function CartDrawer({ isOpen, onClose, tableId }: CartDrawerProps) {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalAmount } = useCart();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [lang, setLang] = useState<LangType>('uz');
  const [isMounted, setIsMounted] = useState(false);

  const vibrate = (ms: number | number[] = 20) => {
    if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(ms);
  };

  // ==========================================
  // 1. TILLAR VA MAVZUNI O'QISH
  // ==========================================
  useEffect(() => {
    setIsMounted(true);
    if (isOpen) {
      const savedLang = localStorage.getItem("customer_lang") as LangType;
      if (savedLang && T[savedLang]) setLang(savedLang);
    }
  }, [isOpen]);

  // ==========================================
  // 2. SAVATCHANI AVTOMATIK TOZALASH (2 SOAT)
  // ==========================================
  useEffect(() => {
    // Agar savatchada narsa bo'lsa, uni oxirgi o'zgartirilgan vaqtini yozib qo'yamiz
    if (cart.length > 0) {
      localStorage.setItem("cart_last_updated", Date.now().toString());
    } else {
      localStorage.removeItem("cart_last_updated");
    }
  }, [cart]);

  useEffect(() => {
    if (isOpen && cart.length > 0) {
      const lastUpdated = localStorage.getItem("cart_last_updated");
      const now = Date.now();
      // 2 soat = 2 * 60 * 60 * 1000 = 7200000 millisekund
      if (lastUpdated && now - parseInt(lastUpdated) > 7200000) {
        clearCart();
        localStorage.removeItem("cart_last_updated");
        toast(T[lang]?.expiredMsg || T.uz.expiredMsg, { icon: "🧹", style: { background: '#222', color: '#fff' } });
        onClose();
      }
    }
  }, [isOpen, cart.length, clearCart, lang, onClose]);

  const t = T[lang] || T.uz;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    vibrate([30, 50, 30]);
    setIsSubmitting(true);

    try {
      // FIREBASE GA SAQLASH
      const docRef = await addDoc(collection(db, "orders"), {
        tableId: tableId,
        items: cart,
        totalAmount: getTotalAmount(),
        comment: comment.trim(),
        status: "yangi",
        createdAt: serverTimestamp(),
        paymentStatus: "kutilmoqda",
      });

      // MUXFIYLIK (LOCALSTORAGE) - Boshqa mijozlar ko'rmasligi uchun
      const savedIds = JSON.parse(localStorage.getItem("my_yalla_orders") || "[]");
      savedIds.push(docRef.id);
      localStorage.setItem("my_yalla_orders", JSON.stringify(savedIds));

      setIsSuccess(true);
      clearCart(); 
      localStorage.removeItem("cart_last_updated"); // Savat bo'shadi
      setComment("");
      
      // YO'NALTIRISH (REDIRECT)
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        router.push(`/menu/${tableId}?tab=orders`);
      }, 2500);

    } catch (error) {
      toast.error("Error submitting order!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !isMounted) return null;

  // ==========================================
  // MUVAFFAQIYATLI YUBORILDI EKRANI (Light/Dark Mode)
  // ==========================================
  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-[#0A0A0A] animate-in fade-in duration-300 px-4 text-center transition-colors">
        <div className="flex flex-col items-center animate-in zoom-in-50 duration-500">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{t.successTitle}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-[15px] leading-relaxed max-w-[280px]">
            {t.successDesc}
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // SAVATCHA EKRANI (Light/Dark Mode)
  // ==========================================
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md sm:p-4 transition-colors">
      <div className="bg-white dark:bg-[#0A0A0A] w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-md rounded-t-[32px] sm:rounded-[32px] relative flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#0A0A0A] z-10 transition-colors">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">{t.cart}</h2>
          <div className="flex items-center gap-3">
            {cart.length > 0 && (
              <button onClick={() => { vibrate(30); clearCart(); }} className="text-[13px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                {t.clear}
              </button>
            )}
            <button onClick={() => { vibrate(20); onClose(); }} className="bg-gray-100 dark:bg-[#1A1A1A] p-2 rounded-full text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-[#222] transition-colors">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ITEMS LIST */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-40 bg-gray-50 dark:bg-transparent transition-colors">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-60 mt-20">
              <div className="w-20 h-20 bg-gray-100 dark:bg-[#111] rounded-full flex items-center justify-center mb-4 border border-gray-200 dark:border-white/5 shadow-sm">
                <Trash2 className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-gray-900 dark:text-white font-bold text-lg">{t.empty}</h3>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">{t.emptyDesc}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.cartItemId} className="bg-white dark:bg-[#111] rounded-[24px] p-3 flex gap-3 border border-gray-200 dark:border-white/5 shadow-sm relative transition-colors">
                  
                  {/* Rasm */}
                  <div className="w-20 h-20 relative rounded-[16px] overflow-hidden bg-gray-100 dark:bg-[#1A1A1A] shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  
                  {/* Ma'lumot */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="text-[14px] font-bold text-gray-900 dark:text-white leading-snug pr-6">{item.name}</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {item.selectedSize?.name && `${item.selectedSize.name}`}
                        {item.selectedCrust?.name && `, ${item.selectedCrust.name}`}
                        {item.selectedExtras?.map((e: any) => `, +${e.name}`)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-yellow-600 dark:text-[#FFC107] font-black text-[14px]">{item.itemTotal.toLocaleString()} sum</span>
                      
                      {/* Quantity Controller */}
                      <div className="flex items-center bg-gray-50 dark:bg-[#1A1A1A] rounded-full p-1 border border-gray-200 dark:border-white/5 shadow-inner">
                        <button 
                          onClick={() => {
                            vibrate(20);
                            if (item.quantity > 1) updateQuantity(item.cartItemId, item.quantity - 1);
                            else removeFromCart(item.cartItemId);
                          }} 
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-[#222] text-gray-700 dark:text-white shadow-sm active:bg-gray-100 dark:active:bg-[#333]"
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" /> : <Minus className="w-3.5 h-3.5" />}
                        </button>
                        <span className="w-8 text-center text-[13px] font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                        <button 
                          onClick={() => { vibrate(20); updateQuantity(item.cartItemId, item.quantity + 1); }} 
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-[#222] text-gray-700 dark:text-white shadow-sm active:bg-gray-100 dark:active:bg-[#333]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* IZOH QOLDIRISH */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t.commentTitle}</h4>
                </div>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t.commentPlaceholder}
                  className="w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl p-4 outline-none focus:border-yellow-400 dark:focus:border-[#FFC107]/50 focus:ring-2 focus:ring-[#FFC107]/20 transition-all text-[13px] placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none h-24 shadow-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM CHECKOUT BUTTON */}
        {cart.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#0A0A0A] border-t border-gray-200 dark:border-white/5 pb-8 sm:pb-4 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-20px_40px_rgba(0,0,0,0.8)] z-20 transition-colors">
            <button 
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full bg-[#FFC107] text-black h-16 rounded-full font-black text-[16px] flex items-center justify-between px-6 hover:bg-[#e0a800] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[#FFC107]/20"
            >
              <span>{isSubmitting ? t.submitting : t.orderBtn}</span>
              <span>{getTotalAmount().toLocaleString()} sum</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}