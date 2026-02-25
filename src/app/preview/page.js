"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const idealForData = [
    {
        title: "შეყვარებულისთვის",
        desc: "უთხარი ის, რასაც ხშირად ვერ ეუბნები",
        image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "მანძილზე სიყვარულისთვის",
        desc: "როცა მონატრება ყველაზე ძლიერია",
        image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "წლისთავისთვის",
        desc: "საუკეთესო საჩუქარი აღსანიშნავ დღეს",
        image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "მეგობრისთვის",
        desc: "რადგან მეგობრობაც დიდი სიყვარულია",
        image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=600&auto=format&fit=crop"
    }
];

const faqs = [
    {
        q: "რამდენ ხანში ხდება შეკვეთის მოწოდება?",
        a: "თბილისის მასშტაბით მიტანა ხდება შეკვეთიდან 1-2 სამუშაო დღეში. რეგიონებში მიწოდება სრულდება 3-4 სამუშაო დღის განმავლობაში, საქართველოს ფოსტის მეშვეობით."
    },
    {
        q: "რას მოიცავს სასაჩუქრე შეფუთვა?",
        a: "ყოველი წიგნი იფუთება პრემიუმ ხარისხის სასაჩუქრე ყუთში, ფორმდება აბრეშუმის ლენტით და თან ერთვის პერსონალური ბარათი, რომელზეც შეგვიძლია თქვენი ტექსტი დავწეროთ."
    },
    {
        q: "უსაფრთხოა თუ არა ბარათით გადახდა?",
        a: "დიახ, ჩვენი პარტნიორია UniPay. გადახდა ხდება დაცული ტრანზაქციით და თქვენი ბარათის მონაცემები ჩვენს საიტზე არ ინახება."
    },
    {
        q: "შემიძლია წინასწარ ვნახო შიგთავსი?",
        a: "რა თქმა უნდა! ჩვენი წიგნის შიდა გვერდები დეტალურად არის ნაჩვენები მის აღწერაში. ეს არის 84-გვერდიანი, მაღალი ხარისხის პოლიგრაფიით დაბეჭდილი ესთეტიკური წიგნი."
    }
];

export default function PreviewSections() {
    const [openFaq, setOpenFaq] = useState(0);

    return (
        <div className="font-sans bg-bg-light min-h-screen pt-12 pb-32">

            {/* Header Notification for Preview */}
            <div className="bg-rose-50 border-b border-rose-100 text-text-dark p-3 text-center text-sm sticky top-[72px] z-50">
                ⚠️ <strong>სატესტო გვერდი დიზაინის შესაფასებლად (ვერსია 2)</strong>. სადა, მინიმალისტური და ელეგანტური.
            </div>

            <div className="max-w-6xl mx-auto space-y-32 px-6 mt-24">

                {/* SECTION 1: IDEAL FOR (CLEAN EDITORIAL STYLE) */}
                <section>
                    <div className="text-center mb-16 space-y-3">
                        <span className="text-primary font-medium tracking-widest text-xs uppercase">ვისთვის არის</span>
                        <h2 className="text-3xl md:text-5xl font-serif text-text-dark">იდეალური საჩუქარი</h2>
                        <p className="text-text-mutted text-base max-w-xl mx-auto font-light">
                            გამოხატე გრძნობები მათ მიმართ, ვინც შენს ცხოვრებაში ყველაზე მნიშვნელოვანია
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {idealForData.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, duration: 0.6 }}
                                className="group cursor-pointer flex flex-col items-center text-center"
                            >
                                {/* Image Container with subtle hover */}
                                <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden mb-5 bg-gray-100">
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 group-hover:opacity-100 grayscale-[20%] group-hover:grayscale-0"
                                    />
                                </div>
                                {/* Text */}
                                <h3 className="text-lg font-serif font-bold text-text-dark mb-1">{item.title}</h3>
                                <p className="text-sm text-text-mutted font-light leading-relaxed px-2">
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </section>


                {/* SECTION 2: HOW IT WORKS (MINIMALIST TIMELINE) */}
                <section className="border-t border-b border-rose-50 py-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16 space-y-3">
                            <span className="text-primary font-medium tracking-widest text-xs uppercase">პროცესი</span>
                            <h2 className="text-3xl md:text-4xl font-serif text-text-dark">როგორ მუშაობს</h2>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 md:gap-0 relative">
                            {/* Connecting line (Desktop) */}
                            <div className="hidden md:block absolute top-[24px] left-[10%] right-[10%] h-[1px] bg-rose-100 z-0"></div>

                            {/* Step 1 */}
                            <div className="relative z-10 flex flex-col items-center text-center w-full md:w-1/3 px-4">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-text-dark font-serif text-lg border border-rose-200 mb-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                                    1
                                </div>
                                <h3 className="text-base font-bold text-text-dark mb-2">აირჩიე წიგნი</h3>
                                <p className="text-xs text-text-mutted font-light leading-relaxed">
                                    შეარჩიე ყველაზე ემოციური საჩუქარი ჩვენი კატალოგიდან.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="relative z-10 flex flex-col items-center text-center w-full md:w-1/3 px-4">
                                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-primary font-serif text-lg border border-rose-200 mb-5 shadow-[0_4px_20px_-4px_rgba(251,113,133,0.15)]">
                                    2
                                </div>
                                <h3 className="text-base font-bold text-text-dark mb-2">ჩვენ ვამზადებთ</h3>
                                <p className="text-xs text-text-mutted font-light leading-relaxed">
                                    თითოეული დეტალი მზადდება და იფუთება განსაკუთრებული სიყვარულით.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="relative z-10 flex flex-col items-center text-center w-full md:w-1/3 px-4">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-text-dark font-serif text-lg border border-rose-200 mb-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                                    3
                                </div>
                                <h3 className="text-base font-bold text-text-dark mb-2">დაწერე შენი გრძნობები</h3>
                                <p className="text-xs text-text-mutted font-light leading-relaxed">
                                    შეავსე ფურცლები შენი სიტყვებით და აჩუქე დაუვიწყარი მოგონება.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>


                {/* SECTION 3: FAQ (CLEAN ACCORDION) */}
                <section className="max-w-2xl mx-auto pb-12">
                    <div className="text-center mb-12 space-y-3">
                        <h2 className="text-3xl md:text-4xl font-serif text-text-dark">კითხვები?</h2>
                        <p className="text-text-mutted text-sm font-light">
                            პასუხები ყველაზე ხშირად დასმულ კითხვებზე
                        </p>
                    </div>

                    <div className="space-y-2 border-t border-rose-50 pt-4">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="border-b border-gray-100 last:border-0"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                                    className="w-full py-5 flex items-center justify-between text-left group"
                                >
                                    <span className={`font-medium text-sm transition-colors duration-300 ${openFaq === idx ? 'text-primary' : 'text-text-dark group-hover:text-primary'}`}>
                                        {faq.q}
                                    </span>
                                    <div className="text-text-mutted opacity-50 ml-4 flex-shrink-0">
                                        {openFaq === idx ? <Minus size={16} /> : <Plus size={16} />}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {openFaq === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pb-6 text-sm text-text-mutted font-light leading-relaxed pr-8">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}
