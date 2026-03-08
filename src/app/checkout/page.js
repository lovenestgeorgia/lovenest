"use client";

import { Checkout } from "@/components/Checkout";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";

export default function CheckoutPage() {
    const { items, getCartTotal } = useCartStore();

    return (
        <div className="min-h-[80vh] font-sans pt-24 pb-24">

            {/* Breadcrumb */}
            <nav className="max-w-4xl mx-auto px-6 mb-8 text-sm text-text-mutted flex items-center gap-2">
                <Link href="/" className="hover:text-primary transition-colors">მთავარი</Link>
                <ChevronRight size={14} />
                <Link href="/shop" className="hover:text-primary transition-colors">კალათა</Link>
                <ChevronRight size={14} />
                <span className="text-primary font-medium cursor-default">გადახდა</span>
            </nav>

            <main className="max-w-4xl mx-auto w-full px-6 flex flex-col items-center animate-fade-in">

                <div className="w-full text-center mb-8">
                    <h1 className="text-4xl font-serif text-text-dark mb-4">შეკვეთის გაფორმება</h1>
                </div>

                {/* Checkout Wizard */}
                <div className="w-full">
                    <Checkout />
                </div>

                <div className="mt-12 text-center flex flex-col items-center gap-2 text-xs text-text-mutted">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                        <Image src="/logo.jpg" alt="Unipay" width={20} height={20} className="rounded-full blur-[1px]" />
                        <span>გადახდა შესაძლებელია UniPay-ს დაცული სისტემით ან ნაღდი ფულით კურიერთან.</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
