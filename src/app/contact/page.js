import { Mail, Phone, MapPin } from "lucide-react";

export const metadata = {
    title: "კონტაქტი | Lovenest",
    description: "დაგვიკავშირდით ნებისმიერი კითხვის შემთხვევაში.",
};

export default function ContactPage() {
    return (
        <div className="font-sans pt-24 pb-24 min-h-screen">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">

                {/* Contact Info */}
                <div className="space-y-12">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-serif text-text-dark mb-6">დაგვიკავშირდით</h1>
                        <p className="text-text-mutted text-lg font-light leading-relaxed">
                            გაქვთ კითხვები შეკვეთასთან დაკავშირებით? სიამოვნებით დაგეხმარებით! დაგვიკავშირდით ნებისმიერ დროს.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-primary shrink-0">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-medium text-text-dark mb-1">ტელეფონი</h3>
                                <p className="text-text-mutted font-light">+995 5XX XXX XXX</p>
                                <p className="text-sm text-text-mutted mt-1">ორშაბათი - შაბათი: 10:00 - 19:00</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-primary shrink-0">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-medium text-text-dark mb-1">ელექტრონული ფოსტა</h3>
                                <p className="text-text-mutted font-light">info@lovenest.ge</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-primary shrink-0">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-medium text-text-dark mb-1">მისამართი</h3>
                                <p className="text-text-mutted font-light">თბილისი, საქართველო (მხოლოდ ონლაინ გაყიდვები)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-rose-50">
                    <h2 className="text-2xl font-serif text-text-dark mb-6">მოგვწერეთ შეტყობინება</h2>
                    <form className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-text-dark mb-2">სახელი</label>
                            <input type="text" className="w-full bg-bg-light border border-gray-200 rounded-lg px-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="თქვენი სახელი" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-dark mb-2">ელ. ფოსტა</label>
                            <input type="email" className="w-full bg-bg-light border border-gray-200 rounded-lg px-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="example@mail.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-dark mb-2">შეტყობინება</label>
                            <textarea rows={5} className="w-full bg-bg-light border border-gray-200 rounded-lg px-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none" placeholder="როგორ შეგვიძლია დაგეხმაროთ?"></textarea>
                        </div>
                        <button type="button" className="elegant-btn w-full text-lg shadow-md">გაგზავნა</button>
                    </form>
                </div>

            </div>
        </div>
    );
}
