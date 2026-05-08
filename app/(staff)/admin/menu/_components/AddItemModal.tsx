"use client";

import { useState, useEffect, useCallback } from "react";
import { addSmartMenuItem, updateSmartMenuItem } from "@/lib/db";
import { X, Plus, Image as ImageIcon, Pizza, Check, Crop } from "lucide-react";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import imageCompression from "browser-image-compression";

// ==============================
// LUG'AT (Tarjimalar)
// ==============================
const T = {
  uz: {
    editItem: "Taomni Tahrirlash", newItem: "Yangi Taom", cropImage: "Rasmni qirqish",
    selectImage: "Rasm tanlang", crop11: "(1:1 qirqiladi)", cropBtn: "Qirqish",
    itemName: "Taom Nomi", category: "Kategoriya", prepTime: "Pishish vaqti",
    desc: "Tarkibi (Ixtiyoriy)", basePrice: "Asosiy Narx (So'm)", sizes: "O'lchamlar (Kichik, O'rta...)",
    crusts: "Xamir Turlari", extras: "Qo'shimchalar", cancel: "Bekor qilish",
    save: "Saqlash", saving: "Saqlanmoqda...", newCat: "Yangi Kategoriya",
    add: "Qo'shish", select: "Tanlang", new: "Yangi",
    reqFields: "Barcha majburiy maydonlarni to'ldiring!", reqImage: "Rasm yuklash majburiy!",
    success: "Muvaffaqiyatli saqlandi!", error: "Xatolik yuz berdi!"
  },
  ru: {
    editItem: "Редактировать блюдо", newItem: "Новое блюдо", cropImage: "Обрезать фото",
    selectImage: "Выберите фото", crop11: "(формат 1:1)", cropBtn: "Обрезать",
    itemName: "Название блюда", category: "Категория", prepTime: "Время приг.",
    desc: "Состав (Необязательно)", basePrice: "Базовая цена", sizes: "Размеры",
    crusts: "Типы теста", extras: "Добавки", cancel: "Отмена",
    save: "Сохранить", saving: "Сохранение...", newCat: "Новая категория",
    add: "Добавить", select: "Выберите", new: "Новая",
    reqFields: "Заполните все обязательные поля!", reqImage: "Фото обязательно!",
    success: "Успешно сохранено!", error: "Произошла ошибка!"
  },
  en: {
    editItem: "Edit Item", newItem: "New Item", cropImage: "Crop Image",
    selectImage: "Select Image", crop11: "(1:1 crop)", cropBtn: "Crop",
    itemName: "Item Name", category: "Category", prepTime: "Prep Time",
    desc: "Ingredients (Optional)", basePrice: "Base Price", sizes: "Sizes",
    crusts: "Crust Types", extras: "Extras", cancel: "Cancel",
    save: "Save", saving: "Saving...", newCat: "New Category",
    add: "Add", select: "Select", new: "New",
    reqFields: "Fill in all required fields!", reqImage: "Image is required!",
    success: "Saved successfully!", error: "An error occurred!"
  }
};

type LangType = 'uz' | 'ru' | 'en';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  item?: any;
  isEditMode?: boolean;
}

const COOKING_TIMES = ["5-10 daqiqa", "10-15 daqiqa", "15-20 daqiqa", "20-25 daqiqa", "30+ daqiqa"];

export default function AddItemModal({ isOpen, onClose, categories, item, isEditMode = false }: AddItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<LangType>('uz');
  
  // Asosiy form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  // Kategoriya
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Arraylar
  const [sizes, setSizes] = useState<{ name: string; price: string }[]>([]);
  const [crusts, setCrusts] = useState<{ name: string; price: string }[]>([]);
  const [extras, setExtras] = useState<{ name: string; price: string }[]>([]);

  // Qirqish (Crop)
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const isPizzaCategory = category.toLowerCase().includes("pizza") || category.toLowerCase().includes("pitsa");
  const hasSizes = sizes.length > 0;

  // Tilni kuzatish
  useEffect(() => {
    if (isOpen) {
      const savedLang = localStorage.getItem("admin_lang") as LangType;
      if (savedLang && T[savedLang]) setLang(savedLang);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isEditMode && item && isOpen) {
      setName(item.name || ""); setCategory(item.category || ""); setDescription(item.description || "");
      setBasePrice(item.basePrice?.toString() || ""); setCookingTime(item.cookingTime || "");
      setImagePreview(item.image || ""); setSizes(item.sizes || []); setCrusts(item.crusts || []); setExtras(item.extras || []);
      setNewCategoryName(""); setShowAddCategoryModal(false);
    } else if (!isOpen) {
      setName(""); setCategory(""); setDescription(""); setBasePrice(""); setCookingTime("");
      setImageFile(null); setImagePreview(""); setRawImage(null); setSizes([]); setCrusts([]); setExtras([]);
      setNewCategoryName(""); setShowAddCategoryModal(false);
    }
  }, [isEditMode, item, isOpen]);

  const t = T[lang] || T.uz;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRawImage(url);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropImage = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    try {
      const croppedFile = await getCroppedImg(rawImage, croppedAreaPixels);
      const options = { maxSizeMB: 0.15, maxWidthOrHeight: 800, useWebWorker: true, fileType: "image/jpeg" };
      const compressedFile = await imageCompression(croppedFile, options);
      
      setImageFile(compressedFile);
      setImagePreview(URL.createObjectURL(compressedFile));
      setRawImage(null);
    } catch (e) {
      toast.error(t.error);
    }
  };

  const handleArrayChange = (setter: any, array: any[], index: number, field: "name" | "price", value: string) => {
    const newArray = [...array]; newArray[index][field] = value; setter(newArray);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !cookingTime) return toast.error(t.reqFields);
    if (!isEditMode && !imageFile && !imagePreview) return toast.error(t.reqImage);

    const loadingToast = toast.loading(t.saving);
    setLoading(true);
    try {
      const cleanArray = (arr: any[]) => arr.filter(i => i.name.trim() !== "").map(i => ({ name: i.name, price: Number(i.price || 0) }));

      const itemData: any = {
        description, cookingTime,
        basePrice: sizes.length > 0 ? 0 : Number(basePrice || 0),
        sizes: cleanArray(sizes),
      };

      if (isPizzaCategory) {
        itemData.crusts = cleanArray(crusts); itemData.extras = cleanArray(extras);
      }

      if (isEditMode && item?.id) {
        await updateSmartMenuItem(item.id, category, name, imageFile, itemData, item.image);
      } else {
        await addSmartMenuItem(category, name, imageFile, itemData);
      }
      toast.success(t.success, { id: loadingToast });
      onClose();
    } catch (error) {
      toast.error(t.error, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-0 md:p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-[#111] border-t md:border border-gray-200 dark:border-white/10 w-full max-w-3xl md:rounded-3xl shadow-2xl relative flex flex-col h-[90vh] md:h-auto md:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
        
        {/* QIRQISH (CROP) QISMI */}
        {rawImage && (
          <div className="absolute inset-0 z-[60] bg-white dark:bg-[#111] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-[#1A1A1A]">
              <h3 className="text-gray-900 dark:text-white font-bold flex items-center gap-2"><Crop className="w-5 h-5"/> {t.cropImage}</h3>
              <button onClick={() => setRawImage(null)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white bg-gray-200 dark:bg-[#222] p-2 rounded-full"><X className="w-4 h-4"/></button>
            </div>
            <div className="relative flex-1 bg-black">
              <Cropper image={rawImage} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
            </div>
            <div className="p-4 md:p-6 bg-gray-50 dark:bg-[#1A1A1A] border-t border-gray-200 dark:border-white/10 flex gap-4 items-center pb-8 md:pb-6">
              <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-[#FFC107]" />
              <button onClick={handleCropImage} className="bg-[#FFC107] text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
                <Check className="w-5 h-5"/> {t.cropBtn}
              </button>
            </div>
          </div>
        )}

        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-white/5 shrink-0 bg-white dark:bg-[#111] sticky top-0 z-40">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            {isPizzaCategory && <Pizza className="text-[#FFC107] w-6 h-6 md:w-7 md:h-7" />}
            {isEditMode ? t.editItem : t.newItem}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-[#1A1A1A] p-2 rounded-full transition"><X className="w-5 h-5" /></button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 pb-24 md:pb-6">
          <form id="itemForm" onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* RASM YUKLASH */}
              <div className="w-full md:w-1/3 space-y-2 shrink-0 flex flex-col items-center md:items-start">
                <label className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-full text-center md:text-left">Taom Rasmi <span className="text-red-500">*</span></label>
                <div className="relative group w-48 md:w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-[#0A0A0A] hover:border-[#FFC107] transition overflow-hidden flex items-center justify-center cursor-pointer">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-[#FFC107] p-4 text-center transition-colors">
                      <ImageIcon className="w-8 h-8 mb-2" />
                      <span className="text-[10px] font-bold">{t.selectImage}<br/>{t.crop11}</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>

              {/* ASOSIY MA'LUMOTLAR */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">{t.itemName} <span className="text-red-500">*</span></label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20 transition shadow-sm" />
                </div>
                
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">{t.category} <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(c => (
                        <button key={c.id} type="button" onClick={() => setCategory(c.name)} className={`px-4 py-2 rounded-xl font-bold transition text-xs md:text-sm border ${category === c.name ? "bg-[#FFC107] text-black border-[#FFC107] shadow-lg shadow-[#FFC107]/20" : "bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-white border-gray-200 dark:border-white/10 hover:border-[#FFC107]"}`}>
                          {c.name}
                        </button>
                      ))}
                      {category && !categories.some(c => c.name === category) && (
                        <button type="button" className="px-4 py-2 rounded-xl font-bold transition text-xs md:text-sm bg-[#FFC107] text-black shadow-lg shadow-[#FFC107]/30 border border-[#FFC107]">
                          {category}
                        </button>
                      )}
                      <button type="button" onClick={() => setShowAddCategoryModal(true)} className="px-4 py-2 rounded-xl font-bold transition text-xs md:text-sm bg-yellow-50 dark:bg-[#1A1A1A] text-[#FFC107] border border-dashed border-[#FFC107] hover:bg-[#FFC107]/10 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> {t.new}
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">{t.prepTime} <span className="text-red-500">*</span></label>
                    <select required value={cookingTime} onChange={e => setCookingTime(e.target.value)} className="w-full bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-[#FFC107] transition appearance-none shadow-sm text-sm">
                      <option value="" disabled>{t.select}</option>
                      {COOKING_TIMES.map(tm => <option key={tm} value={tm}>{tm}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* TARKIBI */}
            <div>
              <label className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">{t.desc}</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-[#FFC107] transition resize-none shadow-sm text-sm" />
            </div>

            {/* NARX VA O'LCHAMLAR */}
            <div className="p-4 md:p-5 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 rounded-2xl space-y-5">
              <div>
                <label className="text-[10px] md:text-xs font-bold text-gray-900 dark:text-[#FFC107] uppercase tracking-wider mb-2 block">{t.basePrice}</label>
                <input type="number" value={hasSizes ? 0 : basePrice} onChange={e => setBasePrice(e.target.value)} disabled={hasSizes} placeholder="0" className={`w-full md:w-1/2 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none shadow-sm ${hasSizes ? "opacity-50 cursor-not-allowed" : "focus:border-[#FFC107] transition"}`} />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-white/5">
                <label className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">{t.sizes}</label>
                <div className="space-y-2">
                  {sizes.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input placeholder="Nomi" value={s.name} onChange={e => handleArrayChange(setSizes, sizes, i, "name", e.target.value)} className="flex-1 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-3 py-2 outline-none focus:border-[#FFC107] shadow-sm text-sm" />
                      <input type="number" placeholder="Narx" value={s.price} onChange={e => handleArrayChange(setSizes, sizes, i, "price", e.target.value)} className="w-24 md:w-32 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-3 py-2 outline-none focus:border-[#FFC107] shadow-sm text-sm" />
                      <button type="button" onClick={() => setSizes(sizes.filter((_, idx) => idx !== i))} className="p-2 text-gray-400 hover:text-red-500 bg-white dark:bg-[#222] border border-gray-200 dark:border-transparent rounded-xl shadow-sm"><X className="w-4 h-4"/></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setSizes([...sizes, { name: "", price: "" }])} className="text-yellow-600 dark:text-[#FFC107] text-[11px] md:text-xs font-bold flex items-center gap-1 mt-2 bg-yellow-50 dark:bg-[#FFC107]/10 px-3 py-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-[#FFC107]/20 transition"><Plus className="w-3 h-3"/> {t.add}</button>
                </div>
              </div>
            </div>

            {/* XAMIR VA QO'SHIMCHALAR (Faqat Pitsa uchun) */}
            {isPizzaCategory && (
              <div className="p-4 md:p-5 border border-yellow-200 dark:border-[#FFC107]/20 bg-yellow-50/50 dark:bg-[#FFC107]/5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-yellow-700 dark:text-[#FFC107] uppercase tracking-wider mb-3 block">{t.crusts}</label>
                  {crusts.map((c, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={c.name} onChange={e => handleArrayChange(setCrusts, crusts, i, "name", e.target.value)} className="flex-1 bg-white dark:bg-[#0A0A0A] border border-yellow-100 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FFC107] shadow-sm" />
                      <input type="number" placeholder="0" value={c.price} onChange={e => handleArrayChange(setCrusts, crusts, i, "price", e.target.value)} className="w-24 bg-white dark:bg-[#0A0A0A] border border-yellow-100 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FFC107] shadow-sm" />
                      <button type="button" onClick={() => setCrusts(crusts.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 bg-white dark:bg-[#222] border border-yellow-100 dark:border-transparent rounded-xl px-2 shadow-sm"><X className="w-4 h-4"/></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setCrusts([...crusts, { name: "", price: "" }])} className="text-yellow-600 dark:text-[#FFC107] text-[11px] md:text-xs font-bold flex items-center gap-1 mt-2 bg-yellow-100/50 dark:bg-[#FFC107]/10 px-3 py-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-[#FFC107]/20 transition"><Plus className="w-3 h-3"/> {t.add}</button>
                </div>
                
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-yellow-700 dark:text-[#FFC107] uppercase tracking-wider mb-3 block">{t.extras}</label>
                  {extras.map((ex, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={ex.name} onChange={e => handleArrayChange(setExtras, extras, i, "name", e.target.value)} className="flex-1 bg-white dark:bg-[#0A0A0A] border border-yellow-100 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FFC107] shadow-sm" />
                      <input type="number" placeholder="0" value={ex.price} onChange={e => handleArrayChange(setExtras, extras, i, "price", e.target.value)} className="w-24 bg-white dark:bg-[#0A0A0A] border border-yellow-100 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FFC107] shadow-sm" />
                      <button type="button" onClick={() => setExtras(extras.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 bg-white dark:bg-[#222] border border-yellow-100 dark:border-transparent rounded-xl px-2 shadow-sm"><X className="w-4 h-4"/></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setExtras([...extras, { name: "", price: "" }])} className="text-yellow-600 dark:text-[#FFC107] text-[11px] md:text-xs font-bold flex items-center gap-1 mt-2 bg-yellow-100/50 dark:bg-[#FFC107]/10 px-3 py-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-[#FFC107]/20 transition"><Plus className="w-3 h-3"/> {t.add}</button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-[#111] shrink-0 flex justify-end gap-3 absolute md:static bottom-0 left-0 right-0 z-50">
          <button onClick={onClose} className="flex-1 md:flex-none px-6 py-3.5 rounded-xl text-gray-700 dark:text-white font-bold bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#333] transition">{t.cancel}</button>
          <button form="itemForm" type="submit" disabled={loading} className="flex-[2] md:flex-none px-8 py-3.5 rounded-xl bg-[#FFC107] text-black font-black hover:bg-[#e0a800] transition shadow-lg shadow-[#FFC107]/20 disabled:opacity-50">
            {loading ? t.saving : t.save}
          </button>
        </div>
      </div>

      {/* YANGI KATEGORIYA QO'SHISH MODALI */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 dark:bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#FFC107]" /> {t.newCat}
            </h3>
            <input
              autoFocus type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20 transition mb-4 shadow-sm"
              onKeyPress={e => {
                if (e.key === "Enter" && newCategoryName.trim()) {
                  setCategory(newCategoryName.trim()); setNewCategoryName(""); setShowAddCategoryModal(false);
                }
              }}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowAddCategoryModal(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-[#1A1A1A] text-gray-700 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-[#222] transition">{t.cancel}</button>
              <button onClick={() => { if (newCategoryName.trim()) { setCategory(newCategoryName.trim()); setNewCategoryName(""); setShowAddCategoryModal(false); } }} disabled={!newCategoryName.trim()} className="flex-1 py-2.5 rounded-xl bg-[#FFC107] text-black font-bold hover:bg-[#e0a800] transition shadow-md disabled:opacity-50">{t.add}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}