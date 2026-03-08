import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            hasGiftBox: false,

            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

            setGiftBox: (hasBox) => set({ hasGiftBox: hasBox }),

            addItem: (item) => {
                set((state) => {
                    const existingItem = state.items.find((i) => i.id === item.id);
                    if (existingItem) {
                        return {
                            items: state.items.map((i) =>
                                i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
                            ),
                            isOpen: true
                        };
                    }
                    return { items: [...state.items, { ...item, quantity: item.quantity || 1 }], isOpen: true };
                });
            },

            removeItem: (id) => {
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                }));
            },

            updateQuantity: (id, quantity) => {
                if (quantity < 1) return;
                set((state) => ({
                    items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
                }));
            },

            clearCart: () => set({ items: [] }),

            getCartTotal: () => {
                const subtotal = get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
                const giftBoxPrice = get().hasGiftBox ? 12 : 0;
                return subtotal + giftBoxPrice;
            }
        }),
        {
            name: 'lovenest-cart-storage',
        }
    )
);
