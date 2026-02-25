"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Filter, Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const products = [
    {
        id: "read-me-when",
        slug: "read-me",
        title: "წამიკითხე როცა დაგჭირდები",
        price: 1.00,
        oldPrice: 65.00,
        image: "/hero.png",
        tag: "Bestseller",
        category: "წიგნი"
    },
    {
        id: "love-coupons",
        slug: "coming-soon",
        title: "სიყვარულის კუპონები",
        price: 24.00,
        oldPrice: 35.00,
        image: "/product-1.png",
        tag: "New",
        category: "სასაჩუქრე"
    },
    {
        id: "memory-box",
        slug: "coming-soon",
        title: "მოგონებების ყუთი",
        price: 89.00,
        oldPrice: 120.00,
        image: "/product-2.png",
        tag: null,
        category: "ყუთი"
    }
];

export default function ShopPage() {
    return (
        <div className="font-sans min-h-screen bg-bg-light pt-24 pb-32">
            {/* Background Blobs */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-rose-200/20 rounded-full blur-[100px]"></div>
            </div>

            <nav className="max-w-7xl mx-auto px-6 mb-8 text-sm text-text-mutted flex items-center gap-2 relative z-10">
                <Link href="/" className="hover:text-primary transition-colors">მთავარი</Link>
                <ChevronRight size={14} />
                <span className="text-primary font-medium cursor-default">მაღაზია</span>
            </nav>

            <main className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-serif text-text-dark mb-4">მაღაზია</h1>
                        <p className="text-text-mutted max-w-xl">აღმოაჩინეთ უნიკალური საჩუქრები, რომლებიც პირდაპირ გულში აღწევს და სამუდამო მოგონებად რჩება.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="ძიება..." className="pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-primary text-sm bg-white" />
                        </div>
                        <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-text-dark hover:text-primary hover:border-primary transition-colors shadow-sm">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                    {products.map((product, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={product.id}
                            className="group"
                        >
                            <Link href={`/shop/${product.slug}`} className="block relative aspect-[4/5] rounded-3xl overflow-hidden bg-rose-50/50 border border-gray-100 mb-5 shadow-sm">
                                {product.tag && (
                                    <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm text-text-dark px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 border border-rose-50">
                                        {product.tag === 'Bestseller' && <Sparkles size={14} className="text-primary" />}
                                        {product.tag}
                                    </div>
                                )}
                                <Image
                                    src={product.image}
                                    alt={product.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                                />
                                <div className="absolute inset-0 bg-black/opacity-0 group-hover:bg-black/5 transition-colors duration-300"></div>
                            </Link>

                            <div>
                                <p className="text-xs text-text-mutted mb-1 uppercase tracking-wider">{product.category}</p>
                                <Link href={`/shop/${product.slug}`} className="block">
                                    <h3 className="text-xl font-serif text-text-dark font-medium mb-2 group-hover:text-primary transition-colors">
                                        {product.title}
                                    </h3>
                                </Link>
                                <div className="flex items-center gap-3">
                                    <span className="text-xl text-primary font-bold">{product.price.toFixed(2)} ₾</span>
                                    {product.oldPrice && (
                                        <span className="text-sm text-text-mutted line-through">{product.oldPrice.toFixed(2)} ₾</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}
