import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8F8F8] text-gray-900 dark:bg-[#0A0A0A] dark:text-white">
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-20">
        <div className="relative overflow-hidden rounded-[32px] border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#111] md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,193,7,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_35%)]" />

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-[#FFC107]/25 bg-[#FFC107]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#b88600] dark:text-[#ffd54f]">
                Yalla Menu
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                Admin paneli uchun tez va qulay boshqaruv tizimi
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300 md:text-base">
                Menyu, buyurtmalar va QR jarayonlarini bitta joydan boshqarish uchun admin kirish sahifasi.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:max-w-xs">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#FFC107] px-6 text-sm font-black text-black transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  Admin panelga kirish
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-black/5 bg-[#FFF9E8] p-5 dark:border-white/5 dark:bg-[#19160a]">
                <h2 className="text-lg font-black">Menyu boshqaruvi</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Taom qo'shish, tahrirlash, kategoriyalarni tartiblash va mavjudlikni tez boshqarish.
                </p>
              </div>
              <div className="rounded-3xl border border-black/5 bg-[#ECFEF4] p-5 dark:border-white/5 dark:bg-[#0f1b15]">
                <h2 className="text-lg font-black">Xodim paneli</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Menyu, buyurtmalar va QR boshqaruvi bitta joyda.
                </p>
              </div>
              <div className="rounded-3xl border border-black/5 bg-[#EFF6FF] p-5 sm:col-span-2 lg:col-span-1 dark:border-white/5 dark:bg-[#101723]">
                <h2 className="text-lg font-black">Moslashuvchan dizayn</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Mobil, planshet va desktop ekranlarda bir xil qulay ishlash uchun optimallashtirilgan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}