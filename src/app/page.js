"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, BookHeart, Sparkles, Star, Navigation, CheckCircle, Truck, Gift, ChevronDown, ChevronRight, ArrowRight, BookOpen } from "lucide-react";
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

// Recipient types shown in the "ვისთვის არის იდეალური" section.
// First entry is rendered as the FEATURED card (large, with badge). The rest
// fill the secondary grid. Image paths are local /public assets — swap with
// proper subject photos once they are produced.
const idealForData = [
  {
    title: "შეყვარებულისთვის",
    tag: "ყველაზე პოპულარული",
    desc: "უთხარი ის, რასაც ხშირად ვერ ეუბნები. გაუზიარე შენი ყველაზე ღრმა გრძნობები უნიკალური გზით.",
    image: "/ideal_lovers.jpg",
  },
  {
    title: "დედისთვის",
    tag: "სამადლობელი",
    desc: "84 გვერდი მადლობისა, რომელიც ვერასდროს ბოლომდე გამოვთქვი.",
    image: "/ideal_anniversary.jpg",
  },
  {
    title: "მამისთვის",
    tag: "გმირისთვის",
    desc: "სიტყვები, რომელიც ბავშვობიდან გინდოდა, რომ მოგესმინა მისგან. ახლა მის ხელშია.",
    image: "/ideal_longdistance.jpg",
  },
  {
    title: "ბავშვისთვის",
    tag: "უანდერძე",
    desc: "სიყვარულის წერილები, რომელსაც დიდი რომ გახდება, წაიკითხავს და გრძნობს ჩვენ მთელ მსოფლიოს.",
    image: "/470901438_17872310865248691_4842326323820694113_n.jpg",
  },
  {
    title: "მეგობრისთვის",
    tag: "ძმობა",
    desc: "მეგობრობაც დიდი სიყვარულია. აგრძნობინე, რას ნიშნავს ის შენთვის.",
    image: "/ideal_bestfriend.jpg",
  },
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
        {/* Hero — full-bleed diary, product right / type left (beamo-style) */}
        <section className="relative -mt-24 sm:-mt-32 min-h-[100svh] w-full flex items-start md:items-center pt-28 sm:pt-32 md:pt-0 overflow-hidden">
          {/* Art-directed background: portrait on phones, landscape on desktop */}
          <picture>
            <source media="(min-width: 768px)" srcSet="/hero-diary.webp" />
            <img
              src="/hero-diary-mobile.webp"
              alt="წამიკითხე როცა დაგჭირდები — შესავსები დღიური"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-[center_38%] md:object-center"
            />
          </picture>

          {/* Readability scrim — stronger on the left where the type sits */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-bg-light/92 via-bg-light/55 to-transparent md:bg-gradient-to-r md:from-bg-light/95 md:via-bg-light/70 md:to-transparent"
          />

          <div className="relative z-10 w-full max-w-[1680px] mx-auto px-6 sm:px-10">
            <div className="max-w-[42rem] md:max-w-[56vw] lg:max-w-[46rem] xl:max-w-[54rem] text-center md:text-left mx-auto md:mx-0">

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-bg-light/80 backdrop-blur rounded-full text-primary font-semibold text-xs sm:text-[13px] border border-rose-200/70 shadow-[0_8px_24px_-12px_rgba(138,31,59,0.25)]"
              >
                <BookHeart size={13} />
                <span>84 გვერდი, რომელსაც შენ ავსებ</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                className="mt-6 sm:mt-7 font-serif text-text-dark leading-[0.95] tracking-[-0.015em]"
                style={{ textShadow: "0 2px 28px rgba(255,247,240,0.85)" }}
              >
                <span className="block text-[clamp(2.6rem,7.2vw,6.4rem)] font-bold">
                  წამიკითხე
                </span>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                  className="block mt-2 sm:mt-3 text-[clamp(1.6rem,4vw,3.4rem)] italic font-light text-primary"
                >
                  როცა დაგჭირდები
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="mt-6 sm:mt-7 max-w-xl mx-auto md:mx-0 text-[15.5px] sm:text-lg md:text-[19px] text-text-dark/80 font-light leading-relaxed"
              >
                წიგნი, რომელსაც შენ წერ. შეავსე გვერდები შენი სიტყვებით და აჩუქე ადამიანს, რომელსაც უყვარხარ — რომ წაიკითხოს ზუსტად მაშინ, როცა დასჭირდება.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.65 }}
                className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-3 sm:gap-4"
              >
                <Link
                  href="/shop/read-me"
                  className="elegant-btn text-base sm:text-lg group w-full sm:w-auto px-8 py-4 shadow-[0_18px_40px_-14px_rgba(138,31,59,0.5)] hover:shadow-[0_22px_48px_-12px_rgba(138,31,59,0.6)]"
                >
                  <span className="font-semibold">შეიძინე 19 ₾</span>
                  <ArrowRight size={18} className="ml-2.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#how"
                  className="text-sm sm:text-base text-text-dark/70 hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
                >
                  <span className="underline underline-offset-[6px] decoration-text-dark/25 group-hover:decoration-primary/60">
                    ნახე როგორ მუშაობს
                  </span>
                  <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.85 }}
                className="mt-4 sm:mt-8 flex flex-wrap items-baseline justify-center md:justify-start gap-x-4 gap-y-1 text-[12px] sm:text-[13px] text-text-dark/65"
              >
                <span className="inline-flex items-baseline gap-2">
                  <span className="line-through text-text-dark/40 tabular-nums">65 ₾</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-primary text-bg-light text-[9px] font-bold rounded-full leading-none">-70%</span>
                </span>
                <span aria-hidden className="text-text-dark/30">·</span>
                <span>უფასო საჩუქრის შეფუთვა</span>
                <span aria-hidden className="text-text-dark/30">·</span>
                <span>მიწოდება საქართველოში</span>
              </motion.div>
            </div>
          </div>
        </section>

        {/* IDEAL FOR — asymmetric editorial grid (1 featured + 3 secondary) */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 mt-12 mb-32 sm:mb-40">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-end mb-12 sm:mb-16">
            <div className="lg:col-span-2 space-y-5">
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-primary font-semibold text-[13px]"
              >
                <Heart size={13} className="fill-current" /> ემოცია ყველასთვის
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                className="font-serif text-text-dark text-4xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-[-0.015em]"
              >
                ვისთვის არის <span className="italic text-primary">იდეალური</span>
              </motion.h2>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-text-mutted font-light leading-relaxed lg:pb-2 max-w-sm lg:ml-auto"
            >
              ოთხი ისტორია, ერთი წიგნი. აირჩიე ის, ვინც გულში გყავს.
            </motion.p>
          </div>

          {/* 6-tile mosaic: featured (2×2) + 5 secondary filling the remaining cells */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 auto-rows-[16rem] sm:auto-rows-[14rem] lg:auto-rows-[15rem]">
            {/* Featured */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative sm:col-span-2 lg:col-span-2 lg:row-span-2 rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-[0_30px_70px_-25px_rgba(138,31,59,0.35)]"
            >
              <Image
                src={idealForData[0].image}
                alt={idealForData[0].title}
                fill
                sizes="(min-width: 1024px) 64vw, 100vw"
                className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.06]"
              />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-text-dark/85 via-text-dark/40 to-transparent" />
              <div className="absolute inset-0 p-7 sm:p-10 lg:p-12 flex flex-col justify-end text-bg-light">
                <span className="inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full bg-bg-light/15 backdrop-blur-sm border border-bg-light/25 text-[11px] font-semibold uppercase tracking-[0.18em] mb-5">
                  <Heart size={11} className="fill-current text-rose-200" />
                  {idealForData[0].tag}
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-4 leading-[1.05] drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                  {idealForData[0].title}
                </h3>
                <p className="text-bg-light/90 font-light leading-relaxed max-w-md text-sm sm:text-base">
                  {idealForData[0].desc}
                </p>
              </div>
            </motion.div>

            {/* 4 secondary tiles — last one widens to fill the bottom row */}
            {idealForData.slice(1).map((item, idx, arr) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                className={`relative rounded-[2rem] overflow-hidden group cursor-pointer shadow-[0_18px_40px_-20px_rgba(138,31,59,0.28)] border border-rose-100 ${
                  idx === arr.length - 1 ? "lg:col-span-2" : ""
                }`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-[1000ms] group-hover:scale-110"
                />
                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-text-dark/90 via-text-dark/30 to-transparent" />
                <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between text-bg-light">
                  <span className="self-start inline-flex items-center px-2.5 py-1 rounded-full bg-bg-light/15 backdrop-blur-sm border border-bg-light/25 text-[10px] font-semibold uppercase tracking-[0.18em]">
                    {item.tag}
                  </span>
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl leading-tight mb-1.5 drop-shadow-[0_3px_10px_rgba(0,0,0,0.5)]">
                      {item.title}
                    </h3>
                    <p className="text-bg-light/85 text-[13px] font-light leading-snug line-clamp-2 max-w-[22rem]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* AI Comic Generator Teaser — dark warm callout, refined */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 mb-32 sm:mb-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative rounded-[2.5rem] overflow-hidden bg-text-dark text-bg-light p-8 sm:p-12 lg:p-16 shadow-[0_40px_80px_-30px_rgba(40,8,15,0.55)]"
          >
            {/* Warm burgundy wash from the right */}
            <div
              aria-hidden
              className="absolute inset-0 -z-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(80% 100% at 95% 50%, oklch(45% 0.14 22 / 0.45) 0%, transparent 60%)",
              }}
            />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-light/10 rounded-full text-rose-200 font-semibold text-[11px] uppercase tracking-[0.18em] border border-bg-light/20">
                  <Sparkles size={12} /> ახალი · AI გენერატორი
                </span>
                <h2 className="font-serif leading-[0.95] tracking-[-0.015em] mt-5">
                  <span className="block text-4xl sm:text-5xl lg:text-[4.5rem]">
                    შენი ისტორია,
                  </span>
                  <span className="block mt-2 text-2xl sm:text-3xl lg:text-4xl italic text-rose-200 font-light">
                    პერსონალური კომიქსი
                  </span>
                </h2>
                <p className="text-bg-light/75 leading-relaxed mt-6 max-w-md font-light">
                  გვიამბე ისტორია, ატვირთე ფოტოები, აირჩიე სტილი. AI შენთვის შექმნის უნიკალურ კომიქსს, რომელსაც ციფრულად ჩამოტვირთავ ან დაბეჭდილს მიიღებ.
                </p>
                <Link
                  href="/comic"
                  className="group inline-flex items-center gap-3 bg-bg-light text-text-dark px-7 py-4 rounded-full font-semibold hover:bg-primary hover:text-bg-light transition-all duration-400 shadow-[0_0_40px_rgba(255,255,255,0.18)] mt-8"
                >
                  გენერირება დაიწყე
                  <Sparkles
                    size={18}
                    className="text-primary group-hover:text-bg-light group-hover:rotate-12 transition-all"
                  />
                </Link>
              </div>

              {/* Staggered comic-style mosaic — real samples from the generator */}
              <div className="relative">
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { src: "/comic-styles/romantic-watercolor.png", label: "Watercolor", offset: "translate-y-0" },
                    { src: "/comic-styles/ghibli-esque.png", label: "Ghibli", offset: "translate-y-5 sm:translate-y-8" },
                    { src: "/comic-styles/manga-bw.png", label: "Manga", offset: "translate-y-2 sm:translate-y-3" },
                    { src: "/comic-styles/classic-comic.png", label: "Classic", offset: "translate-y-4 sm:translate-y-6" },
                    { src: "/comic-styles/storybook.png", label: "Storybook", offset: "translate-y-0" },
                    { src: "/comic-styles/minimalist-flat.png", label: "Flat", offset: "translate-y-6 sm:translate-y-10" },
                  ].map((tile, i) => (
                    <motion.div
                      key={tile.src}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }}
                      className={`relative aspect-[3/4] rounded-2xl overflow-hidden border border-bg-light/15 group ${tile.offset}`}
                    >
                      <Image
                        src={tile.src}
                        alt={`${tile.label} comic style sample`}
                        fill
                        sizes="(min-width: 1024px) 16vw, 30vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-text-dark/55 via-transparent to-transparent opacity-90 group-hover:opacity-60 transition-opacity duration-400" />
                      <div className="absolute inset-x-0 bottom-2 text-center text-bg-light/85 text-[10px] font-mono uppercase tracking-[0.18em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                        {tile.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div
                  aria-hidden
                  className="absolute -inset-6 -z-10 rounded-full"
                  style={{
                    background:
                      "radial-gradient(closest-side, oklch(70% 0.15 25 / 0.22), transparent 70%)",
                    filter: "blur(40px)",
                  }}
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* MORE FROM LOVENEST — other books / products cross-sell */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 mb-32 sm:mb-40">
          <div className="text-center mb-12 sm:mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-full text-primary font-semibold text-xs sm:text-[13px] border border-rose-100"
            >
              <BookOpen size={13} />
              <span>კოლექცია</span>
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
              className="mt-5 font-serif text-text-dark text-[clamp(1.9rem,4.2vw,3rem)] font-bold leading-tight"
            >
              სხვა წიგნები LoveNest-ისგან
            </motion.h2>
            <p className="mt-4 max-w-xl mx-auto text-text-mutted font-light leading-relaxed">
              თითოეული შექმნილია იმისთვის, რომ გრძნობა ქაღალდზე დარჩეს.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                title: "სიყვარულის კუპონები",
                desc: "ჩამოსახევი კუპონები, რომლებსაც ერთმანეთს ჩუქნით.",
                price: "24 ₾",
                oldPrice: "35 ₾",
                img: "/product-1.png",
                href: "/shop",
                soon: true,
              },
              {
                title: "მოგონებების ყუთი",
                desc: "ადგილი ბილეთებისთვის, ფოტოებისა და წერილებისთვის.",
                price: "89 ₾",
                oldPrice: "120 ₾",
                img: "/product-2.png",
                href: "/shop",
                soon: true,
              },
              {
                title: "პერსონალური კომიქსი",
                desc: "შენი ისტორია AI-ს დახმარებით კომიქსად, PDF-ით ან ბეჭდურად.",
                price: "60 ₾",
                oldPrice: "90 ₾",
                img: "/comic-styles/storybook.png",
                href: "/comic",
                soon: false,
              },
            ].map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <Link
                  href={p.href}
                  className="group block h-full rounded-[1.75rem] overflow-hidden bg-bg-light border border-rose-100 shadow-[0_18px_44px_-24px_rgba(138,31,59,0.35)] hover:shadow-[0_26px_60px_-22px_rgba(138,31,59,0.45)] transition-shadow"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-rose-50">
                    <Image
                      src={p.img}
                      alt={p.title}
                      fill
                      sizes="(min-width: 640px) 30vw, 90vw"
                      className="object-cover group-hover:scale-[1.04] transition-transform duration-700"
                    />
                    {p.soon && (
                      <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-bg-light/90 backdrop-blur text-[11px] font-semibold text-primary border border-rose-100">
                        მალე
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-xl text-text-dark font-bold">{p.title}</h3>
                    <p className="mt-2 text-sm text-text-mutted font-light leading-relaxed">{p.desc}</p>
                    <div className="mt-4 flex items-baseline gap-2.5">
                      <span className="font-serif text-lg text-text-dark tabular-nums">{p.price}</span>
                      <span className="line-through text-text-mutted/55 text-sm tabular-nums">{p.oldPrice}</span>
                      <ChevronRight size={16} className="ml-auto text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS — three-step horizontal flow with watermark numerals & connecting ribbon */}
        <section id="how" className="relative scroll-mt-24 bg-white border-y border-rose-100 py-24 sm:py-32 overflow-hidden">
          {/* Warm bloom behind the section */}
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[420px] rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(closest-side, oklch(92% 0.05 30 / 0.55), transparent 70%)",
              filter: "blur(50px)",
            }}
          />

          <div className="relative max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-end mb-20 sm:mb-28">
              <div className="lg:col-span-2 space-y-5">
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-primary font-semibold text-[13px]"
                >
                  <Sparkles size={13} /> სამი ნაბიჯი
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                  className="font-serif text-text-dark text-4xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-[-0.015em]"
                >
                  როგორ <span className="italic text-primary">მუშაობს</span>
                </motion.h2>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-text-mutted font-light leading-relaxed lg:pb-2 max-w-sm lg:ml-auto"
              >
                სამი ნაბიჯი დაუვიწყარი ემოციისკენ. ერთი საღამოს საქმე.
              </motion.p>
            </div>

            <div className="relative">
              {/* Desktop connecting ribbon — a hand-drawn dashed curve threading the three steps */}
              <svg
                aria-hidden
                viewBox="0 0 1000 100"
                preserveAspectRatio="none"
                className="hidden lg:block absolute inset-x-0 top-[60px] h-24 w-full pointer-events-none z-0"
              >
                <defs>
                  <linearGradient id="howRibbon" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#8a1f3b" stopOpacity="0.05" />
                    <stop offset="25%" stopColor="#8a1f3b" stopOpacity="0.55" />
                    <stop offset="75%" stopColor="#8a1f3b" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#8a1f3b" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M 60 60 C 220 10, 320 90, 500 50 S 780 10, 940 60"
                  stroke="url(#howRibbon)"
                  strokeWidth="1.5"
                  strokeDasharray="7 8"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 2.4, ease: [0.2, 0.8, 0.2, 1] }}
                />
              </svg>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-14 md:gap-8 relative z-10">
                {[
                  {
                    Icon: BookOpen,
                    title: "აირჩიე წიგნი",
                    desc: "შეარჩიე საუკეთესო სასაჩუქრე წიგნი, რომელიც ინახავს შენს სიტყვებს.",
                    note: "1 წუთი",
                  },
                  {
                    Icon: Sparkles,
                    title: "ჩვენ ვამზადებთ",
                    desc: "ვამზადებთ და ვფუთავთ საჩუქარს განსაკუთრებული სიყვარულითა და ესთეტიკით.",
                    note: "1-2 დღე",
                  },
                  {
                    Icon: Heart,
                    title: "აჩუქე ემოცია",
                    desc: "შეავსე ფურცლები შენი გრძნობებით და უყურე მის ბედნიერ რეაქციას.",
                    note: "სამუდამოდ",
                  },
                ].map(({ Icon, title, desc, note }, idx) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, delay: idx * 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                    className="relative text-center md:text-left"
                  >
                    {/* Watermark numeral behind the content */}
                    <span
                      aria-hidden
                      className="absolute -top-6 sm:-top-8 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 font-serif font-bold text-[10rem] sm:text-[12rem] leading-none text-primary/8 tracking-[-0.04em] tabular-nums select-none pointer-events-none"
                    >
                      0{idx + 1}
                    </span>

                    <div className="relative pt-10 sm:pt-14 md:pt-16">
                      {/* Icon medallion (sits above the connecting ribbon at y≈60px) */}
                      <div className="relative inline-flex items-center justify-center w-[72px] h-[72px] rounded-full bg-bg-light text-primary border border-rose-100 shadow-[0_18px_36px_-18px_rgba(138,31,59,0.45)] mb-7">
                        <Icon size={26} strokeWidth={1.5} />
                        <span
                          aria-hidden
                          className="absolute -bottom-2 right-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-bg-light font-mono text-[11px] font-semibold shadow-[0_4px_12px_-3px_rgba(138,31,59,0.6)]"
                        >
                          {idx + 1}
                        </span>
                      </div>

                      <h3 className="font-serif text-2xl sm:text-3xl text-text-dark leading-tight mb-3">
                        {title}
                      </h3>
                      <p className="text-text-mutted font-light leading-relaxed text-[15px] max-w-sm md:max-w-none mx-auto md:mx-0">
                        {desc}
                      </p>

                      <span className="mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] font-semibold text-primary/80">
                        <span aria-hidden className="w-6 h-px bg-primary/40" />
                        {note}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
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

        {/* VALUE PROPOSITION — 1 hero benefit + 2 secondary, asymmetric */}
        <section id="info" className="py-24 sm:py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-end mb-14 sm:mb-20">
              <div className="lg:col-span-2 space-y-5">
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-primary font-semibold tracking-[0.32em] text-[11px] uppercase"
                >
                  რატომ ეს წიგნი
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                  className="font-serif text-text-dark text-4xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-[-0.015em]"
                >
                  არ არის უბრალოდ ნივთი, <span className="italic text-primary">ეს ემოციაა</span>
                </motion.h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* Featured benefit */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                className="relative lg:row-span-2 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-primary to-rose-700 text-bg-light p-10 sm:p-14 lg:p-16 min-h-[420px] flex flex-col justify-between shadow-[0_30px_70px_-25px_rgba(138,31,59,0.45)]"
              >
                <div
                  aria-hidden
                  className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-bg-light/8 blur-3xl pointer-events-none"
                />
                <div
                  aria-hidden
                  className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-rose-300/15 blur-3xl pointer-events-none"
                />
                <div className="relative z-10">
                  <BookHeart size={56} strokeWidth={1.5} className="mb-10 sm:mb-12" />
                  <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-[1.05] mb-5 sm:mb-6">
                    მხოლოდ თქვენი <span className="italic">ისტორია</span>
                  </h3>
                  <p className="text-bg-light/85 text-base sm:text-lg leading-relaxed font-light max-w-md">
                    წიგნის 84-ვე გვერდს ავსებთ თქვენი სიტყვებით, მოგონებებითა და გრძნობებით. რაც საჩუქარს უპირობოდ უნიკალურს ხდის.
                  </p>
                </div>
                <span className="relative z-10 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] font-semibold text-bg-light/70 mt-10">
                  <span aria-hidden className="w-8 h-px bg-bg-light/40" />
                  100% პერსონალური
                </span>
              </motion.div>

              {/* Two secondary benefits stacked on the right */}
              {[
                {
                  Icon: Heart,
                  title: "დროში გაყინული გრძნობა",
                  desc: "თქვენი სიტყვები სამუდამოდ რჩება. ყოველი გადაშლა აცოცხლებს ემოციას თავიდან.",
                },
                {
                  Icon: CheckCircle,
                  title: "დაუვიწყარი რეაქცია",
                  desc: "სიხარულის ცრემლები და ბედნიერება, რომელიც არ ფასდება არცერთი საჩუქრით.",
                },
              ].map(({ Icon, title, desc }, idx) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.15 + idx * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                  className="bg-bg-light rounded-[2rem] border border-rose-100 p-8 sm:p-10 shadow-[0_14px_36px_-22px_rgba(138,31,59,0.18)]"
                >
                  <Icon size={32} strokeWidth={1.5} className="text-primary mb-6" />
                  <h3 className="font-serif text-2xl sm:text-3xl text-text-dark leading-tight mb-3">
                    {title}
                  </h3>
                  <p className="text-text-mutted font-light leading-relaxed max-w-md">
                    {desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUCT DETAILS — horizontal split with spec list, not a card grid */}
        <section className="py-24 sm:py-32 px-6 bg-white border-y border-rose-100">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-rose-100 shadow-[0_30px_60px_-25px_rgba(138,31,59,0.3)]"
            >
              <Image src="/hero.png" alt="წიგნის დეტალები" fill className="object-cover" />
              <div className="absolute -inset-0 -z-10 bg-rose-50/40" />
            </motion.div>

            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-primary font-semibold tracking-[0.32em] text-[11px] uppercase">
                  წიგნის დეტალები
                </p>
                <h2 className="font-serif text-text-dark text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-[-0.015em]">
                  მზადდება <span className="italic text-primary">ხელით</span>
                </h2>
                <p className="text-text-mutted text-base sm:text-lg font-light leading-relaxed max-w-md">
                  პრემიუმ მასალები, ხელნაკეთი შეფუთვა, თქვენი ისტორია. ისე, რომ ათეული წლის შემდეგაც ისე გამოიყურებოდეს, როგორც პირველ დღეს.
                </p>
              </div>

              <dl className="border-t border-rose-100">
                {[
                  { label: "მოცულობა", value: "84 გვერდი დასაწერად" },
                  { label: "ფორმატი", value: "15 × 20 სმ, ხელში დასაჭერად" },
                  { label: "ფურცელი", value: "120გ პრემიუმი, მელანი არ გადადის" },
                  { label: "ყდა", value: "მყარი, ლამინირებული, ოქროსფერი ანაბეჭდით" },
                  { label: "შეფუთვა", value: "სასაჩუქრე ყუთი ლენტითა და ბარათით" },
                ].map((d) => (
                  <div
                    key={d.label}
                    className="grid grid-cols-[7rem_1fr] sm:grid-cols-[9rem_1fr] gap-6 py-4 border-b border-rose-100 last:border-0"
                  >
                    <dt className="text-[11px] uppercase tracking-[0.24em] font-semibold text-text-mutted self-baseline pt-1">
                      {d.label}
                    </dt>
                    <dd className="text-text-dark text-sm sm:text-base leading-relaxed">
                      {d.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* REVIEWS — 1 featured pull-quote + 2 supporting, editorial layout */}
        <section className="py-24 sm:py-32 px-6 bg-rose-50/25">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14 sm:mb-20 space-y-5">
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-primary font-semibold tracking-[0.32em] text-[11px] uppercase"
              >
                1000+ ბედნიერი წყვილი
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                className="font-serif text-text-dark text-4xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-[-0.015em]"
              >
                მყიდველები <span className="italic text-primary">ამბობენ</span>
              </motion.h2>
            </div>

            {/* Featured pull-quote */}
            <motion.blockquote
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative max-w-3xl mx-auto mb-12 sm:mb-16"
            >
              <span
                aria-hidden
                className="absolute -top-10 sm:-top-14 left-0 sm:-left-6 font-serif text-[9rem] sm:text-[12rem] leading-none text-primary/12 select-none pointer-events-none"
              >
                "
              </span>
              <div className="flex text-yellow-500 mb-6 justify-center">
                {[...Array(featuredReviews[0].rating)].map((_, i) => (
                  <Star key={i} size={20} className="fill-current" />
                ))}
              </div>
              <p className="font-serif text-text-dark text-2xl sm:text-3xl lg:text-[2.25rem] italic leading-[1.4] text-center mb-8 px-2">
                {featuredReviews[0].text}
              </p>
              <footer className="flex items-center justify-center gap-3 text-sm">
                <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {featuredReviews[0].name.charAt(0)}
                </span>
                <span>
                  <span className="block font-semibold text-text-dark">
                    {featuredReviews[0].name}
                  </span>
                  <span className="block text-xs text-text-mutted">
                    {featuredReviews[0].date}
                  </span>
                </span>
              </footer>
            </motion.blockquote>

            {/* 2 supporting reviews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
              {featuredReviews.slice(1).map((review, idx) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.1 + idx * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                  className="bg-bg-light p-7 sm:p-8 rounded-[1.75rem] border border-rose-100 flex flex-col shadow-[0_14px_36px_-22px_rgba(138,31,59,0.18)]"
                >
                  <div className="flex text-yellow-500 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={14} className="fill-current" />
                    ))}
                  </div>
                  <p className="text-text-dark font-serif italic text-lg leading-relaxed mb-6 flex-1">
                    {review.text}
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-rose-100">
                    <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                      {review.name.charAt(0)}
                    </span>
                    <span>
                      <span className="block font-semibold text-sm text-text-dark">
                        {review.name}
                      </span>
                      <span className="block text-[11px] text-text-mutted">{review.date}</span>
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-14 sm:mt-16 text-center">
              <Link
                href="/shop/read-me"
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium underline underline-offset-[6px] decoration-primary/40 hover:decoration-primary"
              >
                ნახე 1000+ შეფასება <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* FINAL CTA — confident, bigger, single button */}
        <section className="py-32 sm:py-44 px-6 bg-text-dark rounded-t-[3rem] text-bg-light relative overflow-hidden">
          {/* Warm burgundy glow centered behind the type */}
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[860px] h-[860px] rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(closest-side, oklch(45% 0.14 22 / 0.4), transparent 70%)",
              filter: "blur(40px)",
            }}
          />

          <div className="max-w-3xl mx-auto text-center relative z-10 space-y-10">
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              className="font-serif leading-[0.95] tracking-[-0.015em]"
            >
              <span className="block text-5xl sm:text-7xl lg:text-[6.5rem] font-bold">
                ნუ გადადებ
              </span>
              <motion.span
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                className="block mt-3 sm:mt-4 text-3xl sm:text-5xl lg:text-[3.5rem] italic font-light text-rose-200"
              >
                სიყვარულის გამოხატვას
              </motion.span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45 }}
              className="text-bg-light/65 text-base sm:text-lg lg:text-xl font-light max-w-xl mx-auto leading-relaxed"
            >
              შეუკვეთე დღესვე, დაწერე გულწრფელი სიტყვები. აჩუქე ემოცია, რომელიც არასდროს დავიწყდება.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="pt-4 flex flex-col items-center gap-5"
            >
              <Link
                href="/shop/read-me"
                className="group inline-flex items-center justify-center gap-3 bg-bg-light text-text-dark pl-10 pr-7 py-5 sm:py-6 rounded-full text-lg sm:text-xl font-semibold hover:bg-primary hover:text-bg-light transition-all duration-400 shadow-[0_0_60px_rgba(255,255,255,0.22)]"
              >
                <span>შეიძინე 19 ₾</span>
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-bg-light group-hover:bg-bg-light group-hover:text-primary transition-colors">
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
              <span className="inline-flex items-center gap-2 text-[13px] text-bg-light/75 bg-bg-light/8 px-4 py-2 rounded-full border border-bg-light/15">
                <Gift size={14} className="text-rose-300" />
                უფასო სასაჩუქრე შეფუთვა შეკვეთის ფარგლებში
              </span>
            </motion.div>
          </div>
        </section>

      </main>
    </div>
  );
}
