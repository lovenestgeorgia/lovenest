"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag, User, Menu, X, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StickyTimer } from "@/components/StickyTimer";

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { items, openCart } = useCartStore();

    const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <header
                className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
                    }`}
            >
                {/* Global Countdown Banner at the very top */}
                <StickyTimer />

                <div className={`max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between transition-all duration-300 ${isScrolled ? "py-3" : "py-5"}`}>

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 relative z-50 group">
                        <div className={`transition-all duration-300 rounded-full overflow-hidden border border-rose-100 shadow-sm relative group-hover:scale-105 ${isScrolled ? "w-10 h-10" : "w-12 h-12"}`}>
                            <Image src="/logo.jpg" alt="Lovenest Logo" fill sizes="48px" className="object-cover" />
                        </div>
                        <span className={`font-serif font-semibold tracking-wide transition-colors ${isScrolled ? "text-primary text-xl" : "text-text-dark text-2xl"}`}>
                            Lovenest
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-text-mutted">
                        <Link href="/" className="hover:text-primary transition-colors">მთავარი</Link>
                        <Link href="/shop/read-me" className="hover:text-primary transition-colors text-primary font-bold">მაღაზია</Link>
                        <Link href="/about" className="hover:text-primary transition-colors">ჩვენს შესახებ</Link>
                        <Link href="/faq" className="hover:text-primary transition-colors">კითხვები</Link>
                        <Link href="/contact" className="hover:text-primary transition-colors">კონტაქტი</Link>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-4 relative z-50">
                        <button className="p-2 text-text-mutted hover:text-primary transition-colors hidden sm:block">
                            <User size={20} />
                        </button>
                        <button
                            onClick={openCart}
                            className="p-2 text-text-mutted hover:text-primary transition-colors relative"
                        >
                            <ShoppingBag size={22} />
                            {cartItemsCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                                >
                                    {cartItemsCount}
                                </motion.span>
                            )}
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-text-mutted hover:text-primary transition-colors md:hidden"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                        className="fixed inset-0 z-40 bg-white pt-32 px-6 md:hidden flex flex-col gap-6 shadow-2xl"
                    >
                        <div className="flex flex-col gap-6 items-center text-center">
                            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-serif text-text-dark hover:text-primary transition-colors">მთავარი</Link>
                            <Link href="/shop/read-me" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-serif text-primary font-bold">მაღაზია</Link>
                            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-serif text-text-dark hover:text-primary transition-colors">ჩვენს შესახებ</Link>
                            <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-serif text-text-dark hover:text-primary transition-colors">კითხვები</Link>
                            <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-serif text-text-dark hover:text-primary transition-colors">კონტაქტი</Link>
                        </div>

                        <div className="mt-auto pb-12 w-full pt-8 border-t border-rose-50 flex flex-col gap-4">
                            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="elegant-btn-outline w-full gap-2 justify-center">
                                <User size={18} /> პროფილი
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
