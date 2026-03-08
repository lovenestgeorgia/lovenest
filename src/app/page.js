"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, BookHeart, Sparkles, Star, Navigation, CheckCircle, Truck, Gift, ChevronDown, BookOpen } from "lucide-react";
import { Countdown } from "@/components/Countdown";
import { FOMOToast } from "@/components/FOMOToast";
import { reviews } from "@/data/reviews";

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
    image: "/ideal_lovers.jpg",
    gradient: "from-rose-600/90 to-pink-500/90"
  },
  {
    title: "მანძილზე სიყვარულისთვის",
    desc: "როცა მონატრება ყველაზე ძლიერია. ეს წიგნი ყოველთვის მის გვერდით იქნება, მაშინაც კი როცა შორს ხარ.",
    image: "/ideal_longdistance.jpg",
    gradient: "from-blue-600/90 to-indigo-500/90"
  },
  {
    title: "წლისთავისთვის",
    desc: "საუკეთესო საჩუქარი აღსანიშნავ დღეს. შეკრიბეთ თქვენი ყველაზე ტკბილი მოგონებები ერთად.",
    image: "/ideal_anniversary.jpg",
    gradient: "from-amber-600/90 to-orange-500/90"
  },
  {
    title: "მეგობრისთვის",
    desc: "რადგან მეგობრობაც დიდი სიყვარულია. აგრძნობინე შენს საუკეთესო მეგობარს, თუ რამდენს ნიშნავს შენთვის.",
    image: "/ideal_bestfriend.jpg",
    gradient: "from-emerald-600/90 to-teal-500/90"
  }
];

const faqs = [
  {
    q: "რამდენ ხანში ხდება მზადება და მოწოდება, და რა ღირს მიტანა?",
    a: "თბილისის მასშტაბით მიტანა ხდება შეკვეთიდან 1-2 სამუშაო დღეში (ფასი 6 ₾). რეგიონის ქალაქებში მიწოდება სრულდება 2-3 სამუშაო დღეში (ფასი 8 ₾), ხოლო რეგიონის სოფლებში და მაღალმთიან რეგიონებში 3-5 სამუშაო დღეში (ფასი 12 ₾)."
  },
  {
    q: "რას მოიცავს სასაჩუქრე შეფუთვა?",
    a: "ყოველი წიგნი იფუთება პრემიუმ ხარისხის სასაჩუქრე ყუთში, ფორმდება ულამაზესი ლენტით და თან ერთვის ბარათი."
  },
  {
    q: "როგორ ხდება თანხის გადახდა?",
    a: "გადაიხადეთ უსაფრთხოდ ონლაინ (UniPay-ს გავლით), ან აირჩიეთ ნაღდი ანგარიშსწორება და თანხა გადაიხადეთ ამანათის ჩაბარებისას კურიერთან."
  }
];

export default function Home() {
  // Select top 3 reviews for home page
  const featuredReviews = reviews.slice(0, 3);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="font-sans bg-bg-light relative overflow-hidden">
      <FOMOToast />

      {/* Global Animated Background Particles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top Right Pink Blob */}
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-rose-300/30 rounded-full blur-[100px]"
        />

        {/* Bottom Left Amber Blob */}
        <motion.div
          animate={{ y: [0, 40, 0], x: [0, -30, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-[120px]"
        />

        {/* Center Accent Blob */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[140px]"
        />
      </div>

      <main className="relative z-10 pt-24 sm:pt-32">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center justify-center pb-12 px-6">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-rose-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
          <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-secondary blur-3xl opacity-50 z-0 pointer-events-none"></div>

          <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">

            {/* Text Content */}
            <div className="order-2 lg:order-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 rounded-full text-primary font-medium text-xs border border-rose-100 shadow-sm"
              >
                <Star size={12} className="fill-current text-yellow-500" />
                <span className="text-text-dark">ყველაზე პოპულარული სასაჩუქრე წიგნი</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-serif text-text-dark leading-[1.05]"
              >
                წამიკითხე <br /><span className="text-primary italic">როცა დაგჭირდები</span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="flex items-center gap-2 text-sm font-medium text-text-dark"
              >
                <div className="flex gap-0.5 text-yellow-500">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-current" />)}
                </div>
                <span className="opacity-70">(1000+ ბედნიერი მომხმარებელი)</span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg md:text-xl text-text-mutted max-w-lg font-light leading-relaxed"
              >
                84 გვერდში ჩატეული სიყვარული. დაუტოვე შენს საყვარელ ადამიანს შენი სიტყვები ზუსტად იმ მომენტებისთვის, როცა ეს ყველაზე მეტად დასჭირდება.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto"
              >
                <Link href="/shop/read-me" className="elegant-btn text-lg group w-full sm:w-auto justify-center shadow-lg shadow-rose-200">
                  <span className="font-semibold">შეიძინე 39 ₾</span>
                  <Sparkles size={18} className="ml-2 group-hover:rotate-12 transition-transform" />
                </Link>
                <Link href="#info" className="elegant-btn-outline text-lg w-full sm:w-auto justify-center flex items-center gap-2">
                  გაიგე მეტი <ChevronDown size={18} />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap items-center gap-4 text-xs font-semibold text-primary/80 pt-2 bg-rose-50/50 px-4 py-2 rounded-full border border-rose-100/50"
              >
                <span className="flex items-center gap-1"><span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span> მხოლოდ დღეს: უფასო სასაჩუქრე შეფუთვა 🎁</span>
              </motion.div>
            </div>

            {/* Image Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="order-1 lg:order-2 relative w-full flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-md aspect-[4/5] sm:aspect-[3/4]">
                {/* Decorative border */}
                <div className="absolute inset-0 border-2 border-primary/20 rounded-[2rem] transform translate-x-4 translate-y-4"></div>

                {/* Main Hero Image */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl group cursor-pointer border border-rose-100">
                  <Image
                    src="/hero.png"
                    alt="წამიკითხე როცა დაგჭირდები - წიგნი"
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    priority
                  />

                  {/* Floating Action Badge */}
                  <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-rose-50 flex items-center gap-2 animate-bounce-slow">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-bold text-text-dark">მარაგი იწურება!</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 1: IDEAL FOR (PREMIUM 3D CARDS) */}
        <section className="relative z-10 max-w-7xl mx-auto space-y-40 px-6 mt-12 mb-32">
          <div className="text-center mb-20 space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
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
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-125"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-0" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} opacity-0 group-hover:opacity-90 transition-opacity duration-500 z-10`} />
                  <div className="absolute inset-0 rounded-[2.5rem] border-2 border-white/0 group-hover:border-white/40 transition-colors duration-500 z-30 pointer-events-none" />
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

        {/* SECTION 2: HOW IT WORKS (DYNAMIC PATH ANIMATION) */}
        <section className="relative py-24 my-20">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-xl border-y border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] z-0"></div>
          <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
            <div className="text-center mb-24 space-y-4">
              <h2 className="text-4xl md:text-5xl font-serif text-text-dark">როგორ მუშაობს</h2>
              <p className="text-text-mutted text-lg font-light">სამი მარტივი ნაბიჯი დაუვიწყარი ემოციისკენ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
              <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[2px] bg-rose-100 z-0 overflow-hidden">
                <motion.div
                  initial={{ x: "-100%" }}
                  whileInView={{ x: "100%" }}
                  viewport={{ once: false }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-full h-full bg-gradient-to-r from-transparent via-primary to-transparent"
                />
              </div>

              <motion.div whileHover={{ y: -10 }} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-text-dark shadow-xl border border-rose-100 mb-8 relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/40 transition-colors opacity-0 group-hover:opacity-100" />
                  <BookOpen size={30} className="text-primary relative z-10 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-bold text-text-dark mb-4 group-hover:text-primary transition-colors">1. აირჩიე წიგნი</h3>
                <p className="text-text-mutted font-light leading-relaxed">
                  შეარჩიე საუკეთესო სასაჩუქრე წიგნი, რომელიც ინახავს შენს სიტყვებს.
                </p>
              </motion.div>

              <motion.div whileHover={{ y: -10 }} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-rose-600 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(2fb,113,133,0.4)] mb-8 relative">
                  <div className="absolute -inset-2 rounded-full border border-primary/30 animate-[spin_4s_linear_infinite]" />
                  <Sparkles size={30} className="relative z-10 group-hover:rotate-12 transition-transform" />
                </div>
                <h3 className="text-xl font-bold text-text-dark mb-4 group-hover:text-primary transition-colors">2. ჩვენ ვამზადებთ</h3>
                <p className="text-text-mutted font-light leading-relaxed">
                  ჩვენ ვამზადებთ და ვფუთავთ საჩუქარს განსაკუთრებული სიყვარულით და ესთეტიკით.
                </p>
              </motion.div>

              <motion.div whileHover={{ y: -10 }} className="relative z-10 flex flex-col items-center text-center group">
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
        <section className="relative z-10 max-w-3xl mx-auto pb-32 px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif text-text-dark">გაქვთ კითხვები?</h2>
            <p className="text-text-mutted text-lg font-light">ჩვენ აქ ვართ რომ დაგეხმაროთ</p>
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

        {/* Value Proposition & Informational Section */}
        <section id="info" className="py-24 px-6 bg-white border-y border-rose-50">
          <div className="max-w-5xl mx-auto text-center space-y-16">
            <div className="space-y-4">
              <p className="text-primary font-medium tracking-widest text-sm uppercase">რატომ ეს წიგნი?</p>
              <h2 className="text-3xl md:text-5xl font-serif text-text-dark leading-tight">
                არ არის უბრალოდ ნივთი, <br />ეს საუკეთესო <span className="text-primary italic">ემოციაა</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
              <div className="bg-rose-50/30 p-8 rounded-3xl border border-rose-50 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary mb-6">
                  <BookHeart size={28} />
                </div>
                <h3 className="text-xl font-serif font-bold mb-3">მხოლოდ თქვენი ისტორია</h3>
                <p className="text-text-mutted text-sm leading-relaxed">წიგნის 84-ვე გვერდს ავსებთ თქვენი სიტყვებით, მოგონებებითა და გრძნობებით, რაც საჩუქარს 100%-ით უნიკალურს ხდის.</p>
              </div>

              <div className="bg-amber-50/30 p-8 rounded-3xl border border-amber-50 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-accent mb-6">
                  <Heart size={28} />
                </div>
                <h3 className="text-xl font-serif font-bold mb-3">დროში გაყინული გრძნობა</h3>
                <p className="text-text-mutted text-sm leading-relaxed">განსხვავებით ჩვეულებრივი საჩუქრებისგან, თქვენი სიტყვები სამუდამოდ რჩება და ყოველ გადაშლაზე თავიდან აცოცხლებს ემოციას.</p>
              </div>

              <div className="bg-rose-50/30 p-8 rounded-3xl border border-rose-50 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary mb-6">
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-xl font-serif font-bold mb-3">დაუვიწყარი რეაქცია</h3>
                <p className="text-text-mutted text-sm leading-relaxed">ამ საჩუქრის მიღებისას გაჩენილი ემოცია, სიხარულის ცრემლები და ბედნიერება ნამდვილად შეუფასებელია ნებისმიერი ადამიანისთვის.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Product Details Section */}
        <section className="py-20 px-6 bg-white border-b border-rose-50">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-serif text-text-dark">წიგნის დეტალები</h2>
              <p className="text-text-mutted text-lg font-light">შეიქმნა უმაღლესი ხარისხის მასალებით, რათა თქვენი მოგონებები დიდხანს შენახულიყო</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-rose-50/20 border border-rose-100">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-primary shrink-0">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-text-dark text-lg mb-1">მოცულობა და ზომა</h4>
                  <p className="text-text-mutted text-sm">84 გვერდი დასაწერად, ზომები: 15x20 სმ (A5 ფორმატზე ოდნავ პატარა, იდეალურია ხელში დასაჭერად 🌸)</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 rounded-2xl bg-rose-50/20 border border-rose-100">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-primary shrink-0">
                  <Star size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-text-dark text-lg mb-1">პრემიუმ ხარისხი</h4>
                  <p className="text-text-mutted text-sm">მყარი, ლამინირებული ყდა ოქროსფერი ანაბეჭდებით და გაზრდილი სისქის (120გ) ფურცლებით, რომელზეც მელანი არ გადადის.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof / Reviews Preview */}
        <section className="py-24 px-6 bg-rose-50/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-serif text-text-dark">მყიდველები ამბობენ</h2>
              <p className="text-text-mutted">ნახეთ, რას წერენ ისინი, ვინც უკვე აჩუქა სიყვარული</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredReviews.map((review) => (
                <div key={review.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                  <div className="flex text-yellow-500 mb-4">
                    {[...Array(review.rating)].map((_, i) => <Star key={i} size={16} className="fill-current" />)}
                  </div>
                  <p className="text-text-dark text-lg font-serif italic mb-6 flex-1">"{review.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-text-dark">{review.name}</p>
                      <p className="text-xs text-text-mutted">{review.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link href="/shop/read-me" className="elegant-btn-outline inline-flex">
                ნახეთ 1000+ შეფასება
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-6 bg-text-dark rounded-t-[3rem] text-white relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent pointer-events-none"></div>

          <div className="max-w-3xl mx-auto text-center relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-serif leading-tight">
              ნუ გადადებ სიყვარულის <br /><span className="italic text-rose-200">გამოხატვას</span>
            </h2>
            <p className="text-gray-300 text-lg md:text-xl font-light max-w-xl mx-auto">
              შეუკვეთე დღესვე, დაწერე შენი გულწრფელი სიტყვები და აჩუქე ემოცია, რომელიც არასდროს დავიწყდება.
            </p>
            <div className="pt-8 flex flex-col items-center">
              <Link href="/shop/read-me" className="inline-flex items-center justify-center gap-3 bg-white text-text-dark px-10 py-5 rounded-full text-xl font-medium hover:bg-rose-50 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                შეიძინე ახლავე <Navigation size={20} className="text-primary rotate-45" />
              </Link>
              <div className="mt-6 inline-flex items-center gap-2 text-sm text-white font-medium bg-white/10 px-5 py-2.5 rounded-full backdrop-blur-sm border border-white/20">
                <Gift size={16} className="text-rose-300" />
                <span><strong className="text-rose-300">მხოლოდ დღეს:</strong> უფასო სასაჩუქრე შეფუთვა</span>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
