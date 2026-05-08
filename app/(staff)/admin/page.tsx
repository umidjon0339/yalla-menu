"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pizza, ChefHat, QrCode } from "lucide-react";

type LangType = "uz" | "ru" | "en";

const T = {
  uz: {
    menu: "Menyu",
    orders: "Buyurtmalar",
    qr: "QR Generator",
    settings: "Sozlamalar",
    helper: "Tezkor boshqaruv tugmalari",
    menu_desc: "Taomlarni yaratish, tahrirlash va o'chirish",
    orders_desc: "Buyurtmalarni ko'rish va holatini yangilash",
    qr_desc: "Jadval uchun QR kodlar yaratish",
    settings_desc: "Do'kon sozlamalari va xodimlar",
  },
  ru: {
    menu: "Меню",
    orders: "Заказы",
    qr: "QR генератор",
    settings: "Настройки",
    helper: "Быстрые кнопки управления",
    menu_desc: "Создавать, редактировать и удалять блюда",
    orders_desc: "Просмотр заказов и обновление статусов",
    qr_desc: "Создавать QR-коды для столов",
    settings_desc: "Настройки магазина и сотрудники",
  },
  en: {
    menu: "Menu",
    orders: "Orders",
    qr: "QR Generator",
    settings: "Settings",
    helper: "Quick admin shortcuts",
    menu_desc: "Create, edit and remove menu items",
    orders_desc: "View orders and update statuses",
    qr_desc: "Generate table QR codes",
    settings_desc: "Store settings and staff management",
  },
} as const;

export default function AdminDashboardPage() {
  const [lang, setLang] = useState<LangType>("uz");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("admin_lang") as LangType | null;
    if (saved && T[saved]) setLang(saved);
    const handler = (e: StorageEvent) => {
      if (e.key === "admin_lang" && e.newValue && (e.newValue === "uz" || e.newValue === "ru" || e.newValue === "en")) {
        setLang(e.newValue as LangType);
      }
    };
    window.addEventListener("storage", handler);

    // Also poll localStorage for same-window changes (some components update localStorage
    // without dispatching a storage event). This ensures the dashboard updates immediately.
    const intervalId = setInterval(() => {
      const current = localStorage.getItem("admin_lang") as LangType | null;
      if (current && current !== undefined) {
        setLang((prev) => (current !== prev ? (current as LangType) : prev));
      }
    }, 700);

    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(intervalId);
    };
  }, []);

  if (!isMounted) return <div className="min-h-screen bg-[#0A0A0A]" />;

  const t = T[lang];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black">Admin</h1>
          <p className="text-sm text-gray-500 mt-2">{t.helper}</p>
        </header>

        <main className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
          <Link
            href="/admin/menu"
            className="group flex h-44 sm:h-52 md:h-56 flex-col justify-center items-start gap-3 sm:gap-6 rounded-3xl md:rounded-4xl p-4 sm:p-6 md:p-10 bg-gradient-to-br from-[#FFF8E6] to-[#FFE8B8] hover:scale-[1.02] transition-transform shadow-xl dark:from-[#2b2b2b] dark:to-[#222222]"
            aria-label="Open Menu"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 items-center justify-center rounded-xl sm:rounded-2xl bg-white shadow-md dark:bg-[#111]">
                <Pizza className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 text-[#b88600]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black leading-tight">{t.menu}</h2>
                <p className="hidden sm:block mt-1 text-sm text-gray-600 dark:text-gray-300">{t.menu_desc}</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/orders"
            className="group flex h-44 sm:h-52 md:h-56 flex-col justify-center items-start gap-3 sm:gap-6 rounded-3xl md:rounded-4xl p-4 sm:p-6 md:p-10 bg-gradient-to-br from-[#FFF0EE] to-[#FFD6BF] hover:scale-[1.02] transition-transform shadow-xl dark:from-[#2b2b2b] dark:to-[#221917]"
            aria-label="Open Orders"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 items-center justify-center rounded-xl sm:rounded-2xl bg-white shadow-md dark:bg-[#111]">
                <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 text-[#e76f51]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black leading-tight">{t.orders}</h2>
                <p className="hidden sm:block mt-1 text-sm text-gray-600 dark:text-gray-300">{t.orders_desc}</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/qr"
            className="col-span-2 md:col-span-1 group flex h-44 sm:h-52 md:h-56 flex-col justify-center items-start gap-3 sm:gap-6 rounded-3xl md:rounded-4xl p-4 sm:p-6 md:p-10 bg-gradient-to-br from-[#ECFDFF] to-[#D8F0FF] hover:scale-[1.02] transition-transform shadow-xl dark:from-[#0f1724] dark:to-[#071226]"
            aria-label="QR Generator"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 items-center justify-center rounded-xl sm:rounded-2xl bg-white shadow-md dark:bg-[#06121a]">
                <QrCode className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 text-[#0ea5e9]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black leading-tight">{t.qr}</h2>
                <p className="hidden sm:block mt-1 text-sm text-gray-600 dark:text-gray-300">{t.qr_desc}</p>
              </div>
            </div>
          </Link>

          {/* settings removed per request */}

        </main>
      </div>
    </div>
  );
}