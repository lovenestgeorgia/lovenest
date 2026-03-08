"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { ChevronRight, Heart, Sparkles, Navigation, CheckCircle, Truck, Shield, Star, ThumbsUp, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Countdown } from "@/components/Countdown";
import { reviews } from "@/data/reviews";

const images = [
    "/hero.png",
    "/product-1.png",
    "/product-2.png"
];

export default function ProductPage({ params }) {
    const [activeImage, setActiveImage] = useState(0);
    const [activeTab, setActiveTab] = useState("reviews");
    const [visibleReviews, setVisibleReviews] = useState(8);
    const { addItem, openCart } = useCartStore();

    // Facebook Pixel: ViewContent
    useEffect(() => {
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'ViewContent', {
                content_name: 'წამიკითხე როცა დაგჭირდები',
                content_category: 'წიგნი',
                content_type: 'product',
                value: 39.00,
                currency: 'GEL'
            });
        }
    }, []);

    const handleAddToCart = () => {
        // Facebook Pixel: AddToCart
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'AddToCart', {
                content_name: 'წამიკითხე როცა დაგჭირდები',
                content_type: 'product',
                value: 39.00,
                currency: 'GEL'
            });
        }
        addItem({
            id: "book-1",
            name: "წამიკითხე როცა დაგჭირდები",
            price: 39.00,
            image: "/hero.png",
            quantity: 1
        });
        openCart();
    };

    const loadMoreReviews = () => {
        setVisibleReviews(prev => Math.min(prev + 12, reviews.length));
    };

    const averageRating = (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1);

    return (
        <div className="font-sans min-h-screen bg-bg-light relative overflow-hidden pb-32">

            {/* Global Background Bloom */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-rose-200/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[0%] left-[-10%] w-[600px] h-[600px] bg-amber-100/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 pt-28 sm:pt-36">
                {/* Breadcrumbs */}
                <nav className="max-w-6xl mx-auto px-6 mb-8 text-xs sm:text-sm text-text-mutted flex items-center gap-2">
                    <Link href="/" className="hover:text-primary transition-colors">მთავარი</Link>
                    <ChevronRight size={14} />
                    <Link href="/shop" className="hover:text-primary transition-colors">მაღაზია</Link>
                    <ChevronRight size={14} />
                    <span className="text-primary font-medium cursor-default">წამიკითხე როცა...</span>
                </nav>

                <main className="max-w-7xl mx-auto px-4 sm:px-6">

                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">

                        {/* Left: Gallery (Sticky on Desktop) */}
                        <div className="w-full lg:w-[45%] xl:w-[50%] flex flex-col-reverse md:flex-row gap-4 lg:sticky lg:top-32 relative z-10">
                            {/* Thumbnails */}
                            <div className="flex md:flex-col gap-3 sm:gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide w-full md:w-24 shrink-0">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`relative w-20 h-24 sm:w-20 sm:h-28 lg:w-24 lg:h-32 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-rose-50/50 shadow-sm ${activeImage === idx ? 'border-primary ring-4 ring-primary/20 scale-95 opacity-100' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-[1.02]'}`}
                                    >
                                        <Image src={img} alt={`Thumbnail ${idx}`} fill sizes="(max-width: 768px) 100px, 150px" className="object-cover" />
                                    </button>
                                ))}
                            </div>

                            {/* Main Image */}
                            <motion.div
                                key={activeImage}
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden border border-rose-100 shadow-[0_20px_50px_rgba(0,0,0,0.08)] bg-rose-50/30 group cursor-crosshair"
                            >
                                <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10 bg-white/95 backdrop-blur-md border border-rose-50 text-text-dark px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-yellow-500"><Star size={16} className="fill-current" /> {averageRating}</span>
                                    <span className="text-gray-300">|</span>
                                    <span>{reviews.length} შეფასება</span>
                                </div>
                                <Image
                                    src={images[activeImage]}
                                    alt="წამიკითხე როცა დაგჭირდები"
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="object-cover object-center group-hover:scale-[1.15] transition-transform duration-700 ease-out origin-center"
                                    priority
                                />
                            </motion.div>
                        </div>

                        {/* Right: Info */}
                        <div className="w-full lg:w-[55%] xl:w-[50%] flex flex-col pt-4 lg:pt-0 pb-12 relative z-10">

                            {/* Urgency Badge */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50/80 backdrop-blur-sm rounded-full text-red-600 font-bold text-xs sm:text-sm border border-red-200/50 w-fit mb-6 sm:mb-8 shadow-sm"
                            >
                                <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500"></span>
                                </span>
                                მარაგი მკვეთრად იწურება! დარჩა მხოლოდ <span className="underline decoration-red-300 decoration-2">17 ცალი</span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="text-4xl sm:text-5xl md:text-6xl font-serif text-text-dark leading-[1.1] mb-6"
                            >
                                წამიკითხე <br className="hidden sm:block" /> <span className="text-primary italic font-light sm:block sm:mt-2 h-auto">როცა დაგჭირდები</span>
                            </motion.h1>

                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8 sm:mb-10 text-xs sm:text-sm bg-white/50 border border-rose-50 w-fit px-4 py-2 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-1 text-yellow-500 cursor-pointer" onClick={() => setActiveTab("reviews")}>
                                    {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-current" />)}
                                    <span className="text-text-dark font-medium ml-1 underline underline-offset-4 decoration-rose-200 hover:decoration-primary transition-colors">({reviews.length} შეფასება)</span>
                                </div>
                                <span className="w-1 h-1 rounded-full bg-rose-200"></span>
                                <span className="text-green-600 font-bold flex items-center gap-1.5"><CheckCircle size={16} /> მარაგშია (გასაგზავნად მზადაა)</span>
                            </div>

                            {/* Price Block */}
                            <div className="mb-8 flex flex-col gap-1">
                                <div className="flex items-end gap-3 sm:gap-4">
                                    <span className="text-5xl sm:text-6xl font-serif text-text-dark font-medium tracking-tight">39.00 <span className="text-3xl">₾</span></span>
                                    <span className="text-lg sm:text-xl text-text-mutted line-through font-sans font-light mb-2 opacity-60">65.00 ₾</span>
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md mb-3 ml-2 border border-green-200">-40% ფასდაკლება</span>
                                </div>
                                <p className="text-xs text-text-mutted flex items-center gap-1.5"><Shield size={12} /> ყველა გადასახადი შედის ფასში.</p>
                            </div>

                            {/* Countdown Integration */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="mb-10 p-5 sm:p-6 bg-gradient-to-br from-rose-50/80 to-amber-50/80 backdrop-blur-sm shadow-[inset_0_2px_20px_rgba(255,255,255,0.9)] rounded-[2rem] border-2 border-white relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                                <Countdown />
                                <p className="text-xs sm:text-sm text-text-dark font-medium mt-3 pl-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    იჩქარეთ! საჩუქრად შეფუთვა აქციის ფარგლებში <strong className="text-primary">სრულიად უფასოა</strong>.
                                </p>
                            </motion.div>

                            <p className="text-text-dark font-light leading-relaxed mb-10 text-base sm:text-lg lg:text-xl md:pr-4">
                                <strong className="font-semibold font-serif text-primary text-xl">84 გვერდიანი უნიკალური საჩუქარი.</strong> <br /><br />
                                თქვენ თავად ავსებთ თითოეულ გვერდს სხვადასხვა ემოციით, საერთო ფოტოებითა და თბილი სიტყვებით,
                                რათა საყვარელმა ადამიანმა ზუსტად საჭირო მომენტში წაიკითხოს ისინი.
                            </p>

                            <button
                                onClick={handleAddToCart}
                                className="elegant-btn w-full py-5 sm:py-6 text-xl sm:text-2xl relative overflow-hidden group shadow-[0_15px_40px_rgba(169,27,13,0.25)] hover:shadow-[0_20px_50px_rgba(169,27,13,0.35)] transition-all mb-4 hover:-translate-y-1 rounded-3xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary via-rose-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <span className="relative z-10 flex items-center justify-center gap-3 font-serif tracking-wide">
                                    დაამატე კალათაში <Sparkles size={24} className="group-hover:rotate-12 group-hover:scale-110 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
                            </button>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-text-mutted mb-12 sm:mb-16 bg-gray-50/50 py-3 px-4 rounded-2xl border border-gray-100 text-center">
                                <span className="flex items-center gap-1.5"><Lock size={14} className="text-green-600" /> გადახდა UniPay-ით ან კურიერთან</span>
                                <span className="hidden sm:inline text-gray-300">|</span>
                                <span className="flex items-center gap-1.5">100% დაბრუნების გარანტია</span>
                            </div>

                            {/* Advanced Animated Features List */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6 pt-10 border-t border-rose-100/50">
                                {[
                                    { icon: CheckCircle, title: "პრემიუმ ხარისხი", desc: "მკვრივი, 120 გრამიანი კრემისფერი ქაღალდი", delay: 0 },
                                    { icon: Heart, title: "უნიკალური ემოცია", desc: "შექმნილია სპეციალურად ქართულად", delay: 0.1 },
                                    { icon: Truck, title: "სწრაფი მიწოდება", desc: "1-2 სამუშაო დღე თბილისში, 2-4 რეგიონში", delay: 0.2 },
                                    { icon: Sparkles, title: "მზა შეფუთვა", desc: "მოდის ულამაზეს სასაჩუქრე ყუთში", delay: 0.3 }
                                ].map((feature, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: feature.delay }}
                                        key={idx}
                                        className="flex gap-4 sm:gap-5 group"
                                    >
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-sm border border-rose-50 flex items-center justify-center shrink-0 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                                            <feature.icon size={22} className="sm:hidden block" />
                                            <feature.icon size={24} className="hidden sm:block" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h4 className="font-serif font-bold text-text-dark text-sm sm:text-base mb-1 group-hover:text-primary transition-colors">{feature.title}</h4>
                                            <p className="text-xs sm:text-sm text-text-mutted leading-snug">{feature.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                        </div>
                    </div>
                </main>

                {/* Full-Width Visual Break Section (Deepens the page) */}
                <section className="mt-20 sm:mt-32 w-full bg-text-dark text-white py-16 sm:py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent pointer-events-none mix-blend-overlay"></div>
                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif leading-tight mb-8">
                            ემოცია, რომელიც არასდროს <span className="text-rose-300 italic">დავიწყდება</span>
                        </h2>
                        <p className="text-gray-300 sm:text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto mb-10">
                            წიგნის თითოეულ გვერდზე შექმენით ახალი მოგონება.
                            ეს არ არის მხოლოდ ნივთი, ეს არის თქვენი გრძნობების არქივი,
                            რომელსაც თქვენი საყვარელი ადამიანი მთელი ცხოვრება შეინახავს.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-400">
                            <span className="flex items-center gap-2"><div className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center"><Navigation size={18} className="rotate-45" /></div> ემოციური და პრაქტიკული</span>
                            <span className="flex items-center gap-2"><div className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center"><Heart size={18} /></div> უსაზღვრო სიყვარული</span>
                        </div>
                    </div>
                </section>

                {/* Tabs Section */}
                <main className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="mt-20 sm:mt-24 pt-8" id="details-tabs">
                        <div className="flex flex-wrap gap-2 md:gap-6 lg:gap-12 justify-center mb-16 px-2 bg-white/50 backdrop-blur-md sticky top-[72px] sm:top-24 z-30 py-4 border-b border-rose-100 shadow-sm rounded-3xl mx-auto w-fit">
                            {['reviews', 'description', 'shipping'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        window.scrollTo({ top: document.getElementById("details-tabs").offsetTop - 120, behavior: 'smooth' });
                                    }}
                                    className={`py-2 px-3 sm:px-6 text-sm sm:text-base lg:text-lg font-serif transition-colors relative rounded-full ${activeTab === tab ? 'text-white font-medium bg-text-dark shadow-md' : 'text-text-mutted hover:text-text-dark hover:bg-gray-100'}`}
                                >
                                    {tab === 'reviews' && `შეფასებები (${reviews.length})`}
                                    {tab === 'description' && 'წიგნის შესახებ'}
                                    {tab === 'shipping' && 'მიწოდება & გადახდა'}
                                </button>
                            ))}
                        </div>

                        <div className="max-w-4xl mx-auto min-h-[400px]">
                            <AnimatePresence mode="wait">

                                {/* Reviews Tab */}
                                {activeTab === "reviews" && (
                                    <motion.div
                                        key="reviews"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-12"
                                    >
                                        <div className="flex flex-col md:flex-row gap-8 items-center justify-between bg-rose-50/30 p-8 rounded-3xl border border-rose-50">
                                            <div className="text-center md:text-left">
                                                <h3 className="text-5xl md:text-6xl font-serif text-text-dark mb-2">{averageRating}</h3>
                                                <div className="flex text-yellow-500 justify-center md:justify-start mb-2">
                                                    {[...Array(5)].map((_, i) => <Star key={i} size={24} className="fill-current" />)}
                                                </div>
                                                <p className="text-sm text-text-mutted font-medium">დაფუძნებულია {reviews.length} შეფასებაზე</p>
                                            </div>

                                            <div className="flex-1 w-full max-w-sm space-y-3">
                                                {/* Mock Rating Bars */}
                                                <div className="flex items-center gap-3 text-sm"><span className="w-3 text-text-mutted font-bold">5</span><div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 w-[90%] rounded-full"></div></div><span className="w-8 text-right text-text-mutted">63</span></div>
                                                <div className="flex items-center gap-3 text-sm"><span className="w-3 text-text-mutted font-bold">4</span><div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 w-[10%] rounded-full"></div></div><span className="w-8 text-right text-text-mutted">7</span></div>
                                                <div className="flex items-center gap-3 text-sm"><span className="w-3 text-text-mutted font-bold">3</span><div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-yellow-300 w-[0%] rounded-full"></div></div><span className="w-8 text-right text-text-mutted">0</span></div>
                                                <div className="flex items-center gap-3 text-sm"><span className="w-3 text-text-mutted font-bold">2</span><div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-yellow-200 w-[0%] rounded-full"></div></div><span className="w-8 text-right text-text-mutted">0</span></div>
                                                <div className="flex items-center gap-3 text-sm"><span className="w-3 text-text-mutted font-bold">1</span><div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-yellow-100 w-[0%] rounded-full"></div></div><span className="w-8 text-right text-text-mutted">0</span></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {reviews.slice(0, visibleReviews).map((review) => (
                                                <div key={review.id} className="p-6 sm:p-8 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col hover:shadow-lg transition-shadow">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-primary font-bold text-lg border border-rose-100">
                                                                {review.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-text-dark text-base flex items-center gap-1.5">
                                                                    {review.name} <CheckCircle size={14} className="text-green-500" />
                                                                </p>
                                                                <p className="text-xs text-text-mutted mt-0.5">{review.date}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex text-yellow-500 mb-4">
                                                        {[...Array(review.rating)].map((_, i) => <Star key={i} size={16} className="fill-current" />)}
                                                    </div>
                                                    <p className="text-text-dark text-sm sm:text-base leading-relaxed mb-6 flex-1 font-serif italic">"{review.text}"</p>
                                                    <div className="flex items-center gap-2 text-xs text-text-mutted cursor-pointer hover:text-primary mt-auto pt-4 border-t border-gray-50 uppercase tracking-widest font-semibold transition-colors">
                                                        <ThumbsUp size={16} /> <span>სასარგებლო</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {visibleReviews < reviews.length && (
                                            <div className="text-center pt-8">
                                                <button onClick={loadMoreReviews} className="elegant-btn-outline py-4 px-10 text-lg rounded-full">
                                                    ჩატვირთე მეტი მიმოხილვა
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Description Tab */}
                                {activeTab === "description" && (
                                    <motion.div
                                        key="description"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.2 }}
                                        className="prose prose-rose prose-lg sm:prose-xl max-w-none text-text-dark font-light leading-relaxed px-4"
                                    >
                                        <p className="text-lg sm:text-2xl font-serif text-center mb-12">
                                            <span className="text-primary text-4xl leading-none block mb-4">"</span>
                                            წამიკითხე როცა დაგჭირდები არის არა უბრალოდ წიგნი, არამედ სიყვარულის არქივი,
                                            რომელიც ინახავს თქვენს ყველაზე სანუკვარ გრძნობებს.
                                            <span className="text-primary text-4xl leading-none block mt-4">"</span>
                                        </p>

                                        <h3 className="text-2xl font-serif text-text-dark mt-16 mb-6">როგორ მუშაობს? საუკეთესო ემოციები 4 მარტივ ნაბიჯში</h3>
                                        <div className="space-y-6">
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-6 items-start">
                                                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center shrink-0 font-serif text-xl text-primary font-bold">1</div>
                                                <div><strong className="block text-lg mb-2">შეუკვეთეთ და მიიღეთ წიგნი</strong> იღებთ წიგნს ცარიელი, მაგრამ თემატურად დაყოფილი 84 გვერდით.</div>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-6 items-start">
                                                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center shrink-0 font-serif text-xl text-primary font-bold">2</div>
                                                <div><strong className="block text-lg mb-2">შეავსეთ ფურცლები</strong> წერთ მოგონებებს, ხატავთ, აკრავთ ფოტოებს. თითოეულ გვერდს სხვადასხვა სათაური აქვს (მაგ: "როცა მოწყენილი ხარ").</div>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-6 items-start">
                                                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center shrink-0 font-serif text-xl text-primary font-bold">3</div>
                                                <div><strong className="block text-lg mb-2">აჩუქეთ საყვარელ ადამიანს</strong> გადაეცით საჩუქარი ულამაზეს სასაჩუქრე შეფუთვაში.</div>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-6 items-start">
                                                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center shrink-0 font-serif text-xl text-primary font-bold">4</div>
                                                <div><strong className="block text-lg mb-2">გადაშალე საჭირო მომენტში</strong> ადრესატი კითხულობს კონკრეტულ ემოციას ზუსტად იმ დროს, როცა მას ჭირდება!</div>
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-serif text-text-dark mt-16 mb-6">ტექნიკური მახასიათებლები</h3>
                                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0">
                                            <li className="bg-rose-50/50 p-6 rounded-2xl"><strong>გვერდები:</strong> <br /><span className="text-xl">84 გვერდი</span></li>
                                            <li className="bg-rose-50/50 p-6 rounded-2xl"><strong>ყდა:</strong> <br /><span className="text-xl">Soft-touch მაგარი ყდა, ოქროსფერი პრინტით</span></li>
                                            <li className="bg-rose-50/50 p-6 rounded-2xl"><strong>ქაღალდი:</strong> <br /><span className="text-xl">120 გრ. პრემიუმ კრემისფერი ქაღალდი</span></li>
                                            <li className="bg-rose-50/50 p-6 rounded-2xl"><strong>ზომა:</strong> <br /><span className="text-xl">15 x 21 სმ (A5)</span></li>
                                        </ul>
                                    </motion.div>
                                )}

                                {/* Shipping Tab */}
                                {activeTab === "shipping" && (
                                    <motion.div
                                        key="shipping"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.2 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                                    >
                                        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-lg">
                                            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-primary mb-6"><Truck size={32} /></div>
                                            <h3 className="text-2xl font-serif text-text-dark mb-6">მიწოდების პირობები</h3>
                                            <ul className="space-y-6 text-base text-text-mutted font-light">
                                                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pb-4 border-b border-gray-100">
                                                    <span className="text-gray-500">თბილისი:</span>
                                                    <span className="font-semibold text-text-dark bg-gray-50 px-3 py-1 rounded-md">1 სამუშაო დღე — 6 ₾</span>
                                                </li>
                                                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pb-4 border-b border-gray-100">
                                                    <span className="text-gray-500">რეგიონი (ქალაქი):</span>
                                                    <span className="font-semibold text-text-dark bg-gray-50 px-3 py-1 rounded-md">2-3 სამუშაო დღე — 8 ₾</span>
                                                </li>
                                                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pb-4 border-b border-gray-100">
                                                    <span className="text-gray-500">რეგიონი (სოფელში):</span>
                                                    <span className="font-semibold text-text-dark bg-gray-50 px-3 py-1 rounded-md">3-5 სამუშაო დღე — 12 ₾</span>
                                                </li>
                                            </ul>

                                        </div>

                                        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-lg flex flex-col justify-between">
                                            <div>
                                                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-primary mb-6"><Shield size={32} /></div>
                                                <h3 className="text-2xl font-serif text-text-dark mb-6">გადახდა & დაცვა</h3>
                                                <div className="space-y-4 text-base text-text-mutted font-light leading-relaxed">
                                                    <p>თქვენ შეგიძლიათ გადაიხადოთ ნაღდი ფულით <strong>კურიერთან (Cash on Delivery)</strong> ამანათის ჩაბარებისას, ან ისარგებლოთ <strong>UniPay</strong>-ს უსაფრთხო ონლაინ სისტემით (256-bit დაშიფვრით), სადაც თქვენი ბარათის მონაცემები სრულიად დაცულია.</p>
                                                    <p>ონლაინ გადახდა შესაძლებელია ნებისმიერი ბანკის <strong>Visa, Mastercard ან Amex</strong> ბარათით. კურიერთან გადახდის შემთხვევაში, თქვენი შეკვეთა დადასტურდება გადახდის გარეშეც.</p>
                                                    <p className="bg-green-50 text-green-700 p-4 rounded-xl mt-4 border border-green-100 shadow-inner">
                                                        <strong>100% ხარისხის გარანტია!</strong> თუ ნივთს აღმოაჩნდება ქარხნული დეფექტი, იგი შეიცვლება სრულიად უფასოდ ან დაგიბრუნდებათ გადახდილი თანხა 2 დღის განმავლობაში.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </main>

            </div>

            {/* Mobile Sticky Add to Cart Footer */}
            <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-rose-100 p-4 z-50 transform translate-y-0 lg:hidden shadow-[0_-20px_40px_rgba(0,0,0,0.08)]">
                <div className="flex justify-between items-center max-w-lg mx-auto">
                    <div className="flex flex-col">
                        <span className="text-xs text-text-mutted line-through leading-none pb-1">65.00 ₾</span>
                        <span className="text-2xl font-serif text-text-dark font-bold leading-none">39.00 ₾</span>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className="elegant-btn py-4 px-8 text-base shadow-lg shadow-rose-200 flex items-center gap-2 rounded-2xl"
                    >
                        ყიდვა <Navigation size={16} className="rotate-45" />
                    </button>
                </div>
            </div>

        </div>
    );
}
