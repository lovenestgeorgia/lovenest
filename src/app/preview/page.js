"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, ChevronDown, BookOpen, Star } from "lucide-react";

// Helper for 3D Tilt Effect
function TiltCard({ children, className }) {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        setRotateX(-y / 15);
        setRotateY(x / 15);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ rotateX, rotateY }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ perspective: 1000 }}
            className={`relative ${className}`}
        >
            {children}
        </motion.div>
    );
}

const idealForData = [
    {
        title: "შეყვარებულისთვის",
        desc: "უთხარი ის, რასაც ხშირად ვერ ეუბნები. გაუზიარე შენი ყველაზე ღრმა გრძნობები უნიკალური გზით.",
        image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop",
        gradient: "from-rose-600/90 to-pink-500/90"
    },
    {
        title: "მანძილზე სიყვარულისთვის",
        desc: "როცა მონატრება ყველაზე ძლიერია. ეს წიგნი ყოველთვის მის გვერდით იქნება, მაშინაც კი როცა შორს ხარ.",
        image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop",
        gradient: "from-blue-600/90 to-indigo-500/90"
    },
    {
        title: "წლისთავისთვის",
        desc: "საუკეთესო საჩუქარი აღსანიშნავ დღეს. შეკრიბეთ თქვენი ყველაზე ტკბილი მოგონებები ერთად.",
        image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=600&auto=format&fit=crop",
        gradient: "from-amber-600/90 to-orange-500/90"
    },
    {
        title: "მეგობრისთვის",
        desc: "რადგან მეგობრობაც დიდი სიყვარულია. აგრძნობინე შენს საუკეთესო მეგობარს, თუ რამდენს ნიშნავს შენთვის.",
        image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=600&auto=format&fit=crop",
        gradient: "from-emerald-600/90 to-teal-500/90"
    }
];

const faqs = [
    {
        q: "რამდენ ხანში ხდება მზადება და მოწოდება?",
        a: "თბილისის მასშტაბით მიტანა ხდება შეკვეთიდან 1-2 სამუშაო დღეში. რეგიონებში მიწოდება სრულდება 3-4 სამუშაო დღის განმავლობაში."
    },
    {
        q: "რას მოიცავს სასაჩუქრე შეფუთვა?",
        a: "ყოველი წიგნი იფუთება პრემიუმ ხარისხის სასაჩუქრე ყუთში, ფორმდება ულამაზესი ლენტით და თან ერთვის ბარათი."
    },
    {
        q: "უსაფრთხოა თუ არა ბარათით გადახდა ონლაინ?",
        a: "დიახ, ჩვენი პარტნიორია UniPay. გადახდა ხდება სრულად დაცული ტრანზაქციით უშუალოდ ბანკის გვერდზე."
    }
];

export default function PreviewSections() {
    const [openFaq, setOpenFaq] = useState(0);

    return (
        <div className="font-sans bg-bg-light min-h-screen pt-12 pb-32 relative overflow-hidden">

            {/* Dynamic Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-rose-300/30 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-amber-200/20 rounded-full blur-[150px]"
                />
            </div>

            <div className="bg-rose-500/10 text-rose-600 border-b border-rose-200 p-3 text-center text-sm sticky top-[72px] z-50 backdrop-blur-md font-medium">
                ✨ <strong>გაუმჯობესებული ვერსია (V3):</strong> დამატებულია 3D ეფექტები, Glassmorphism და დინამიური ანიმაციები.
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-40 px-6 mt-24">

                {/* SECTION 1: IDEAL FOR (PREMIUM 3D CARDS WITH NEON GLOW) */}
                <section>
                    <div className="text-center mb-20 space-y-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 shadow-sm text-primary font-bold text-sm"
                        >
                            <Heart size={16} className="fill-current animate-pulse" /> ემოცია ყველასთვის
                        </motion.div>
                        <h2 className="text-4xl md:text-6xl font-serif text-text-dark leading-tight">
                            ვისთვის არის <br /><span className="text-primary italic">იდეალური?</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {idealForData.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: idx * 0.15, duration: 0.8, type: "spring" }}
                            >
                                <TiltCard className="h-[450px] rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-primary/20 transition-all">
                                    {/* Background Image */}
                                    <div className="absolute inset-0 z-0">
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className="object-cover transition-transform duration-1000 group-hover:scale-125"
                                        />
                                    </div>

                                    {/* Glassmorphism Default Gradient (Soft) */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-0" />

                                    {/* Glowing Hover Gradient (Vibrant) */}
                                    <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} opacity-0 group-hover:opacity-90 transition-opacity duration-500 z-10`} />

                                    {/* Border Glow Effect */}
                                    <div className="absolute inset-0 rounded-[2.5rem] border-2 border-white/0 group-hover:border-white/40 transition-colors duration-500 z-30 pointer-events-none" />

                                    {/* Content */}
                                    <div className="absolute inset-0 p-8 flex flex-col justify-end z-20 text-white transform transition-transform duration-500">
                                        <motion.div className="translate-y-8 group-hover:translate-y-0 transition-all duration-500">
                                            <h3 className="text-2xl font-serif font-bold mb-3 drop-shadow-md">{item.title}</h3>
                                            <p className="opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 font-medium text-sm leading-relaxed text-white/95">
                                                {item.desc}
                                            </p>
                                            <div className="mt-5 w-10 h-1 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200 transform origin-left group-hover:scale-x-150" />
                                        </motion.div>
                                    </div>
                                </TiltCard>
                            </motion.div>
                        ))}
                    </div>
                </section>


                {/* SECTION 2: HOW IT WORKS (DYNAMIC PATH ANIMATION & FLOATING ELEMENTS) */}
                <section className="relative py-20">
                    {/* Glass Container */}
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-xl border border-white rounded-[3rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] z-0"></div>

                    <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
                        <div className="text-center mb-24 space-y-4">
                            <h2 className="text-4xl md:text-5xl font-serif text-text-dark">როგორ მუშაობს</h2>
                            <p className="text-text-mutted text-lg font-light">სამი მარტივი ნაბიჯი დაუვიწყარი ემოციისკენ</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
                            {/* Animated Connecting Line (Desktop) */}
                            <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[2px] bg-rose-100 z-0 overflow-hidden">
                                <motion.div
                                    initial={{ x: "-100%" }}
                                    whileInView={{ x: "100%" }}
                                    viewport={{ once: false }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="w-full h-full bg-gradient-to-r from-transparent via-primary to-transparent"
                                />
                            </div>

                            {/* Step 1 */}
                            <motion.div
                                whileHover={{ y: -10 }}
                                className="relative z-10 flex flex-col items-center text-center group"
                            >
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-text-dark shadow-xl border border-rose-100 mb-8 relative">
                                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/40 transition-colors opacity-0 group-hover:opacity-100" />
                                    <BookOpen size={30} className="text-primary relative z-10 group-hover:scale-110 transition-transform" />
                                </div>
                                <h3 className="text-xl font-bold text-text-dark mb-4 group-hover:text-primary transition-colors">1. აირჩიე წიგნი</h3>
                                <p className="text-text-mutted font-light leading-relaxed">
                                    შეარჩიე საუკეთესო სასაჩუქრე წიგნი, რომელიც ინახავს შენს სიტყვებს.
                                </p>
                            </motion.div>

                            {/* Step 2 */}
                            <motion.div
                                whileHover={{ y: -10 }}
                                className="relative z-10 flex flex-col items-center text-center group"
                            >
                                <div className="w-20 h-20 bg-gradient-to-br from-primary to-rose-600 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(2fb,113,133,0.4)] mb-8 relative">
                                    <div className="absolute -inset-2 rounded-full border border-primary/30 animate-[spin_4s_linear_infinite]" />
                                    <Sparkles size={30} className="relative z-10 group-hover:rotate-12 transition-transform" />
                                </div>
                                <h3 className="text-xl font-bold text-text-dark mb-4 group-hover:text-primary transition-colors">2. ჩვენ ვამზადებთ</h3>
                                <p className="text-text-mutted font-light leading-relaxed">
                                    ჩვენ ვამზადებთ და ვფუთავთ საჩუქარს განსაკუთრებული სიყვარულით და ესთეტიკით.
                                </p>
                            </motion.div>

                            {/* Step 3 */}
                            <motion.div
                                whileHover={{ y: -10 }}
                                className="relative z-10 flex flex-col items-center text-center group"
                            >
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-text-dark shadow-xl border border-rose-100 mb-8 relative">
                                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/40 transition-colors opacity-0 group-hover:opacity-100" />
                                    <Heart size={30} className="text-primary relative z-10 group-hover:scale-110 transition-transform" />
                                </div>
                                <h3 className="text-xl font-bold text-text-dark mb-4 group-hover:text-primary transition-colors">3. აჩუქე ემოცია</h3>
                                <p className="text-text-mutted font-light leading-relaxed">
                                    შეავსე ფურცლები შენი გრძნობებით და უყურე მათ ბედნიერ რეაქციას.
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>


                {/* SECTION 3: FAQ (PREMIUM GLASS ACCORDION) */}
                <section className="max-w-3xl mx-auto pb-24">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-serif text-text-dark">გაქვთ კითხვები?</h2>
                        <p className="text-text-mutted text-lg font-light">
                            ჩვენ აქ ვართ რომ დაგეხმაროთ
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <motion.div
                                key={idx}
                                initial={false}
                                animate={{ backgroundColor: openFaq === idx ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.4)" }}
                                className={`rounded-2xl border backdrop-blur-sm overflow-hidden transition-colors duration-300 ${openFaq === idx ? 'border-primary shadow-lg shadow-rose-100/50' : 'border-white hover:border-rose-200'}`}
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                                    className="w-full px-8 py-6 flex items-center justify-between text-left group"
                                >
                                    <span className={`font-bold text-lg md:text-xl transition-colors duration-300 ${openFaq === idx ? 'text-primary' : 'text-text-dark group-hover:text-primary'}`}>
                                        {faq.q}
                                    </span>
                                    <motion.div
                                        animate={{ rotate: openFaq === idx ? 180 : 0, backgroundColor: openFaq === idx ? "rgb(251, 113, 133)" : "transparent" }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors border ${openFaq === idx ? 'border-primary text-white' : 'border-gray-200 text-text-mutted group-hover:border-primary group-hover:text-primary'}`}
                                    >
                                        <ChevronDown size={20} />
                                    </motion.div>
                                </button>

                                <AnimatePresence>
                                    {openFaq === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: "easeInOut" }}
                                        >
                                            <div className="px-8 pb-8 text-lg text-text-mutted font-light leading-relaxed">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}
