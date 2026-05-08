import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  cartItemId: string;
  id: string;
  name: string;
  image: string;
  basePrice: number;
  selectedSize?: any;
  selectedCrust?: any;
  selectedExtras?: any[];
  quantity: number;
  itemTotal: number;
}

interface CartStore {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void; // YANGI
  clearCart: () => void;
  getItemQuantityInCart: (productId: string) => number;
  getTotalAmount: () => number;
  getTotalItems: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      
      addToCart: (item) => {
        set((state) => ({ cart: [...state.cart, item] }));
      },
      
      removeFromCart: (cartItemId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.cartItemId !== cartItemId),
        }));
      },

      // YANGI: Savatchada miqdorni o'zgartirish va narxni qayta hisoblash
      updateQuantity: (cartItemId, newQuantity) => {
        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.cartItemId === cartItemId) {
              const singleItemPrice = item.itemTotal / item.quantity; 
              return { 
                ...item, 
                quantity: newQuantity, 
                itemTotal: singleItemPrice * newQuantity 
              };
            }
            return item;
          })
        }));
      },
      
      clearCart: () => set({ cart: [] }),
      
      getItemQuantityInCart: (productId) => {
        return get().cart
          .filter((item) => item.id === productId)
          .reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalAmount: () => {
        return get().cart.reduce((total, item) => total + item.itemTotal, 0);
      },
      
      getTotalItems: () => {
        return get().cart.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'yalla-cart-storage',
    }
  )
);