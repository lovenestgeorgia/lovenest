"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, BookHeart, Sparkles, Star, Navigation, CheckCircle, Truck, Gift } from "lucide-react";
import { Countdown } from "@/components/Countdown";
import { FOMOToast } from "@/components/FOMOToast";
import { reviews } from "@/data/reviews";

export default function Home() {
  // Select top 3 reviews for home page
  const featuredReviews = reviews.slice(0, 3);

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
                <span className="opacity-70">({reviews.length}+ ბედნიერი მომხმარებელი)</span>
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
                <Link href="#info" className="elegant-btn-outline text-lg w-full sm:w-auto justify-center">
                  გაიგე მეტი
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-4 text-xs font-medium text-text-mutted pt-2"
              >
                <span className="flex items-center gap-1"><Truck size={14} className="text-primary" /> სწრაფი მიწოდება</span>
                <span className="flex items-center gap-1"><Gift size={14} className="text-primary" /> სასაჩუქრე შეფუთვა</span>
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
                ნახეთ ყველა {reviews.length} შეფასება
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
            <div className="pt-8">
              <Link href="/shop/read-me" className="inline-flex items-center justify-center gap-3 bg-white text-text-dark px-10 py-5 rounded-full text-xl font-medium hover:bg-rose-50 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                შეიძინე ახლავე <Navigation size={20} className="text-primary rotate-45" />
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
