"use client";

import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
    return (
        <div className="font-sans min-h-screen bg-bg-light pt-24 pb-32">
            {/* Breadcrumbs */}
            <nav className="max-w-4xl mx-auto px-6 mb-8 text-sm text-text-mutted flex items-center gap-2">
                <Link href="/" className="hover:text-primary transition-colors">მთავარი</Link>
                <ChevronRight size={14} />
                <span className="text-primary font-medium cursor-default">კონფიდენციალურობა</span>
            </nav>

            <main className="max-w-4xl mx-auto px-6">
                <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-rose-50 text-primary rounded-2xl flex items-center justify-center mb-6">
                        <ShieldCheck size={32} />
                    </div>

                    <h1 className="text-4xl font-serif text-text-dark mb-2">კონფიდენციალურობის პოლიტიკა</h1>
                    <p className="text-sm text-text-mutted mb-12 border-b border-gray-100 pb-6">ბოლო განახლება: 24 თებერვალი, 2026</p>

                    <div className="prose prose-rose max-w-none text-text-dark font-light leading-relaxed">
                        <p>
                            წინამდებარე კონფიდენციალურობის პოლიტიკა აღწერს, თუ როგორ აგროვებს, იყენებს და იცავს
                            <strong> Lovenest.ge </strong> (შემდგომში "საიტი" ან "ჩვენ") თქვენს პირად ინფორმაციას.
                        </p>

                        <h3 className="text-xl font-serif text-text-dark mt-10 mb-4">1. მონაცემთა შეგროვება</h3>
                        <p>
                            ჩვენ ვაგროვებთ თქვენს მონაცემებს მხოლოდ მაშინ, როცა თქვენ ნებაყოფლობით გვაწვდით მას
                            (მაგალითად: შეკვეთის გაფორმებისას, ანგარიშის შექმნისას ან კონტაქტის ფორმის შევსებისას).
                            ეს მონაცემები მოიცავს: სახელს, გვარს, საკონტაქტო ნომერს, ელექტრონულ ფოსტას და მისამართს.
                        </p>

                        <h3 className="text-xl font-serif text-text-dark mt-10 mb-4">2. მონაცემთა გამოყენება</h3>
                        <p>
                            შეგროვებული ინფორმაცია გამოიყენება მხოლოდ შემდეგი მიზნებისთვის:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4 text-text-mutted">
                            <li>თქვენი შეკვეთის დასამუშავებლად და მოსაწოდებლად.</li>
                            <li>გადახდების სწორად ადმინისტრირებისთვის.</li>
                            <li>საჭიროების შემთხვევაში თქვენთან დასაკავშირებლად (შეკვეთის სტატუსი, კითხვები).</li>
                            <li>ჩვენი სერვისების და ვებგვერდის ფუნქციონალის გასაუმჯობესებლად.</li>
                        </ul>

                        <h3 className="text-xl font-serif text-text-dark mt-10 mb-4">3. საბანკო/გადახდის მონაცემები</h3>
                        <p>
                            ჩვენ <strong>არ ვინახავთ</strong> თქვენი საბანკო ან საკრედიტო ბარათის მონაცემებს.
                            გადახდები ხორციელდება პარტნიორი ორგანიზაციის საგადახდო სისტემის (მაგ. UniPay) მეშვეობით,
                            რომელიც უზრუნველყოფს უმაღლესი დონის საერთაშორისო უსაფრთხოებას და დაშიფვრას (SSL/TLS).
                        </p>

                        <h3 className="text-xl font-serif text-text-dark mt-10 mb-4">4. მესამე პირებთან გაზიარება</h3>
                        <p>
                            თქვენი პირადი ინფორმაცია მკაცრად კონფიდენციალურია. ჩვენ არ ვყიდით, არ ვცვლით და არ ვაზიარებთ
                            თქვენს მონაცემებს მესამე პირებთან, გარდა იმ შემთხვევებისა, როდესაც ეს აუცილებელია
                            სერვისის მისაწოდებლად (მაგალითად: საკურიერო კომპანიას ვაწვდით თქვენს მისამართს და ნომერს შეკვეთის ჩასაბარებლად).
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
