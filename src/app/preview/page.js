"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Navigation, ChevronDown } from "lucide-react";

const idealForData = [
    {
        title: "შეყვარებულისთვის",
        desc: "უთხარი ის, რასაც ხშირად ვერ ეუბნები",
        image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop",
        gradient: "from-rose-500/80 to-pink-500/80"
    },
    {
        title: "მანძილზე სიყვარულისთვის",
        desc: "როცა მონატრება ყველაზე ძლიერია",
        image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop",
        gradient: "from-blue-500/80 to-indigo-500/80"
    },
    {
        title: "წლისთავისთვის",
        desc: "საუკეთესო საჩუქარი აღსანიშნავ დღეს",
        image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=600&auto=format&fit=crop",
        gradient: "from-amber-500/80 to-orange-500/80"
    },
    {
        title: "საუკეთესო მეგობრისთვის",
        desc: "რადგან მეგობრობაც დიდი სიყვარულია",
        image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=600&auto=format&fit=crop",
        gradient: "from-emerald-500/80 to-teal-500/80"
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
        q: "შემიძლია თუ არა წინასწარ ვნახო რას ვყიდულობ?",
        a: "რა თქმა უნდა! ჩვენი წიგნის შიდა გვერდები სრულად არის ნაჩვენები ჩვენს ინსტაგრამზე. ეს არის 84 გვერდიანი, მაღალი ხარისხის პოლიგრაფიით დაბეჭდილი ესთეტიკური წიგნი."
    }
];

export default function PreviewSections() {
    const [openFaq, setOpenFaq] = useState(0);

    return (
        <div className="font-sans bg-bg-light min-h-screen pt-20 pb-32">

            {/* Header Notification for Preview */}
            <div className="bg-text-dark text-white p-4 text-center font-bold sticky top-[72px] z-50 shadow-md">
                ⚠️ ეს არის სატესტო (Preview) გვერდი. <span className="font-normal">გთხოვთ შეაფასოთ დიზაინი და თუ კი იტყვით რომ მოგწონთ, ამ სექციებს მთავარ გვერდზე გადმოვიტანთ.</span>
            </div>

            <div className="max-w-6xl mx-auto space-y-40 px-6 mt-20">

                {/* SECTION 1: IDEAL FOR */}
                <section>
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-serif text-text-dark">ვისთვის არის ეს ემოცია?</h2>
                        <p className="text-text-mutted text-lg max-w-2xl mx-auto">აჩუქე დაუვიწყარი გრძნობა მას, ვინც შენს გულში განსაკუთრებულ ადგილს იკავებს</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {idealForData.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ y: -10 }}
                                className="relative h-96 rounded-[2rem] overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
                            >
                                <div className="absolute inset-0 z-0">
                                    <Image src={item.image} alt={item.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                </div>
                                <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} opacity-60 group-hover:opacity-80 transition-opacity duration-300 z-10`}></div>

                                <div className="absolute inset-0 p-6 flex flex-col justify-end z-20 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <h3 className="text-2xl font-serif font-bold mb-2">{item.title}</h3>
                                    <p className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 font-light text-sm">
                                        {item.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>


                {/* SECTION 2: HOW IT WORKS */}
                <section className="bg-rose-50/50 -mx-6 px-6 py-24 rounded-[3rem] border border-rose-100/50 relative overflow-hidden">
                    {/* Decorative Background Blob */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/40 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-20 space-y-4">
                            <h2 className="text-3xl md:text-5xl font-serif text-text-dark">როგორ მუშაობს?</h2>
                            <p className="text-text-mutted text-lg">სამი მარტივი ნაბიჯი ემოციის გასაზიარებლად</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                            {/* Connecting line for desktop */}
                            <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-0.5 bg-rose-200 z-0"></div>

                            {/* Step 1 */}
                            <div className="relative z-10 flex flex-col items-center text-center group">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary text-2xl font-serif font-bold shadow-md border-4 border-rose-50 mb-6 group-hover:scale-110 transition-transform duration-300">
                                    1
                                </div>
                                <h3 className="text-xl font-bold mb-3">აირჩიე საჩუქარი</h3>
                                <p className="text-text-mutted text-sm px-4">შეარჩიე ემოციური წიგნი "წამიკითხე როცა დაგჭირდები" ჩვენი კატალოგიდან.</p>
                            </div>

                            {/* Step 2 */}
                            <div className="relative z-10 flex flex-col items-center text-center group">
                                <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-serif font-bold shadow-lg shadow-rose-200 border-4 border-rose-100 mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Sparkles size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">ჩვენ ვამზადებთ</h3>
                                <p className="text-text-mutted text-sm px-4">ვამზადებთ და ვფუთავთ განსაკუთრებული სიყვარულით და დეტალების მიმართ ყურადღებით.</p>
                            </div>

                            {/* Step 3 */}
                            <div className="relative z-10 flex flex-col items-center text-center group">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary text-2xl font-serif font-bold shadow-md border-4 border-rose-50 mb-6 group-hover:scale-110 transition-transform duration-300">
                                    3
                                </div>
                                <h3 className="text-xl font-bold mb-3">დაწერე შენი გრძნობები</h3>
                                <p className="text-text-mutted text-sm px-4">მიიღე საჩუქარი, შეავსე ფურცლები შენი ისტორიებით და აჩუქე დაუვიწყარი ემოცია.</p>
                            </div>
                        </div>
                    </div>
                </section>


                {/* SECTION 3: FAQ */}
                <section className="max-w-3xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-serif text-text-dark">ხშირად დასმული კითხვები</h2>
                        <p className="text-text-mutted text-lg">ყველაფერი, რაც გაინტერესებთ Lovenest-ის პროდუქტებზე</p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${openFaq === idx ? 'border-rose-200 shadow-md' : 'border-gray-100 hover:border-rose-100'}`}
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                                >
                                    <span className="font-semibold text-lg text-text-dark">{faq.q}</span>
                                    <ChevronDown className={`text-text-mutted transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {openFaq === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="px-6 pb-6 pt-0 text-text-mutted leading-relaxed border-t border-gray-50 mt-2">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center flex flex-col items-center">
                        <p className="text-sm font-medium text-text-mutted mb-4">ვერ იპოვეთ თქვენი კითხვა?</p>
                        <Link href="https://instagram.com/lovenest.ge" target="_blank" className="elegant-btn-outline rounded-full px-8">
                            მოგვწერეთ ინსტაგრამზე
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
