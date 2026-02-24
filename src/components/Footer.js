import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-white border-t border-rose-50 pt-16 pb-8 font-sans">
            <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 min-h-[300px]">

                {/* Brand */}
                <div className="space-y-6">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-rose-100 shadow-sm">
                            <Image src="/logo.jpg" alt="Lovenest Logo" width={40} height={40} className="object-cover" />
                        </div>
                        <span className="font-serif text-xl font-semibold tracking-wide text-primary">Lovenest</span>
                    </Link>
                    <p className="text-text-mutted text-sm leading-relaxed">
                        პერსონალიზირებული, ემოციური საჩუქრები, რომლებიც პირდაპირ გულში აღწევს. წამიკითხე, როცა დაგჭირდები.
                    </p>
                    <div className="flex gap-4">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-rose-50 flex justify-center items-center text-primary hover:bg-primary hover:text-white transition-colors">
                            <Instagram size={18} />
                        </a>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-rose-50 flex justify-center items-center text-primary hover:bg-primary hover:text-white transition-colors">
                            <Facebook size={18} />
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="space-y-6">
                    <h4 className="font-serif text-lg text-text-dark font-medium">ნავიგაცია</h4>
                    <ul className="space-y-3 text-sm text-text-mutted">
                        <li><Link href="/shop" className="hover:text-primary transition-colors">ყველა პროდუქტი</Link></li>
                        <li><Link href="/shop/read-me" className="hover:text-primary transition-colors">კონკრეტული მოდელი</Link></li>
                        <li><Link href="/faq" className="hover:text-primary transition-colors">მიწოდება და გადახდა</Link></li>
                    </ul>
                </div>

                {/* Support */}
                <div className="space-y-6">
                    <h4 className="font-serif text-lg text-text-dark font-medium">ინფორმაცია</h4>
                    <ul className="space-y-3 text-sm text-text-mutted">
                        <li><Link href="/faq" className="hover:text-primary transition-colors">ხშირად დასმული კითხვები</Link></li>
                        <li><Link href="/about" className="hover:text-primary transition-colors">ჩვენს შესახებ</Link></li>
                        <li><Link href="/terms" className="hover:text-primary transition-colors">წესები და პირობები</Link></li>
                        <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">კონფიდენციალურობა</Link></li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="space-y-6">
                    <h4 className="font-serif text-lg text-text-dark font-medium">კონტაქტი</h4>
                    <ul className="space-y-4 text-sm text-text-mutted">
                        <li className="flex items-start gap-3">
                            <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                            <span>თბილისი, საქართველო</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail size={18} className="text-primary shrink-0" />
                            <span>info@lovenest.ge</span>
                        </li>
                        <li className="text-xs text-rose-500 mt-4 bg-rose-50 p-3 rounded border border-rose-100 italic">
                            შეკითხვების შემთხვევაში მოგვწერეთ სოციალურ ქსელებში (Facebook/Instagram). ვპასუხობთ მომენტალურად!
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 mt-16 pt-8 border-t border-rose-50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-mutted">
                <p>&copy; {new Date().getFullYear()} Lovenest.ge. ყველა უფლება დაცულია.</p>
                <div className="flex items-center gap-2">
                    <Image src="/logo.jpg" alt="Unipay Secure" width={16} height={16} className="rounded-full blur-[1px] grayscale opacity-60" />
                    <span>დაცული გადახდა Unipay-ს მიერ</span>
                </div>
            </div>
        </footer>
    );
}
