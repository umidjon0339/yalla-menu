import { db, storage } from "./firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// ==========================================
// 1. STORAGE (RASMLAR BILAN ISHLASH)
// ==========================================

// --- RASMNI YUKLASH ---
export const uploadImage = async (file: File): Promise<string> => {
  // Noyob fayl nomi yaratamiz
  const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
  const storageRef = ref(storage, `menu_images/${uniqueName}`);
  
  // Faylni Firebase Storage-ga yuklaymiz
  const snapshot = await uploadBytes(storageRef, file);
  // Ommaviy URL manzilini olib qaytaramiz
  return await getDownloadURL(snapshot.ref);
};

// --- RASMNI STORAGE'DAN O'CHIRISH (YANGI) ---
export const deleteImageFromStorage = async (imageUrl: string) => {
  // Agar rasm yo'q bo'lsa yoki u Firebase rasmi bo'lmasa, hech narsa qilmaymiz
  if (!imageUrl || !imageUrl.includes("firebasestorage")) return;
  
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error("Rasmni Storage'dan o'chirishda xatolik:", error);
  }
};


// ==========================================
// 2. FIRESTORE (MA'LUMOTLAR BILAN ISHLASH)
// ==========================================

// --- YANGI TAOM QO'SHISH ---
export const addSmartMenuItem = async (
  categoryName: string, 
  name: string, 
  imageFile: File | null, 
  customFields: Record<string, any>
) => {
  // 1. Kategoriya bor-yo'qligini tekshiramiz. Yo'q bo'lsa avtomatik yaratamiz.
  const q = query(collection(db, "categories"), where("name", "==", categoryName));
  const categorySnapshot = await getDocs(q);
  
  if (categorySnapshot.empty) {
    await addDoc(collection(db, "categories"), {
      name: categoryName,
      order: 99, // Yangi kategoriyalarni oxiriga tushirish uchun
      isActive: true
    });
  }

  // 2. Rasm yuklash (agar tanlangan bo'lsa)
  let imageUrl = "";
  if (imageFile) {
    imageUrl = await uploadImage(imageFile);
  }

  // 3. Taomni Firestore bazasiga saqlash
  return await addDoc(collection(db, "menu_items"), {
    category: categoryName,
    name: name,
    image: imageUrl, 
    isAvailable: true,
    createdAt: new Date(),
    ...customFields 
  });
};

// --- TAOMNI YANGILASH ---
export const updateSmartMenuItem = async (
  itemId: string,
  categoryName: string,
  name: string,
  imageFile: File | null,
  customFields: Record<string, any>,
  oldImageUrl?: string // Eskirgan rasmni o'chirish uchun parametr
) => {
  let updateData: any = {
    category: categoryName,
    name: name,
    ...customFields
  };

  // Agar admin yangi rasm yuklagan bo'lsa
  if (imageFile) {
    const imageUrl = await uploadImage(imageFile);
    updateData.image = imageUrl;
    
    // Eski rasm Storage'da bekorga joy egallamasligi uchun uni o'chirib yuboramiz
    if (oldImageUrl) {
      await deleteImageFromStorage(oldImageUrl);
    }
  }

  return await updateDoc(doc(db, "menu_items", itemId), updateData);
};

// --- TAOMNI O'CHIRISH (RASMI BILAN BIRGA) (YANGI) ---
export const deleteMenuItemWithImage = async (itemId: string, imageUrl: string) => {
  // 1. Baza (Firestore) dan o'chiramiz
  await deleteDoc(doc(db, "menu_items", itemId));
  
  // 2. Agar rasm bo'lsa, Storage'dan ham o'chiramiz
  if (imageUrl) {
    await deleteImageFromStorage(imageUrl);
  }
};