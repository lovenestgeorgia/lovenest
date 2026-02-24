"use client";

import { useCartStore } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Cart() {
    const { items, isOpen, closeCart, removeItem, updateQuantity, getCartTotal } = useCartStore();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={closeCart}
                        className="fixed inset-0 bg-text-dark/20 backdrop-blur-sm z-50"
                    />

                    {/* Cart Sidebar */}
                    <motion.div
                        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                        className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-white z-50 shadow-2xl flex flex-col font-sans"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-rose-50 flex justify-between items-center">
                            <h2 className="font-serif text-2xl text-text-dark flex items-center gap-2">
                                <ShoppingBag size={24} className="text-primary" />
                                კალათა
                            </h2>
                            <button onClick={closeCart} className="p-2 text-text-mutted hover:bg-rose-50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-text-mutted space-y-4">
                                    <ShoppingBag size={48} className="opacity-20" />
                                    <p>კალათა ცარიელია</p>
                                    <button onClick={closeCart} className="elegant-btn-outline mt-4">
                                        მაღაზიაში დაბრუნება
                                    </button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.id} className="flex gap-4 py-4 border-b border-rose-50/50">
                                        <div className="w-20 h-24 relative rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
                                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-medium text-text-dark text-sm pr-4 leading-tight">{item.name}</h4>
                                                    <button onClick={() => removeItem(item.id)} className="text-text-mutted hover:text-red-500 transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <p className="text-primary font-semibold mt-1">{item.price.toFixed(2)} ₾</p>
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-3 mt-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-text-dark hover:border-primary transition-colors"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="text-sm w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-text-dark hover:border-primary transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-rose-50 bg-bg-light">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-text-mutted font-medium">ჯამი:</span>
                                    <span className="font-serif text-2xl font-bold text-primary">{getCartTotal().toFixed(2)} ₾</span>
                                </div>
                                <Link
                                    href="/checkout"
                                    onClick={closeCart}
                                    className="elegant-btn w-full justify-between"
                                >
                                    გადასვლა გადახდაზე
                                    <ArrowRight size={18} />
                                </Link>
                                <div className="text-center mt-3 text-xs text-text-mutted space-y-1">
                                    <p>მიტანა საქართველოს მასშტაბით უფასოა.</p>
                                    <p>გადახდა დაცულია Unipay სისტემით.</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
