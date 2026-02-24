"use client";

import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="font-sans min-h-screen bg-bg-light pt-24 pb-32">
            {/* Breadcrumbs */}
            <nav className="max-w-4xl mx-auto px-6 mb-8 text-sm text-text-mutted flex items-center gap-2">
                <Link href="/" className="hover:text-primary transition-colors">მთავარი</Link>
                <ChevronRight size={14} />
                <span className="text-primary font-medium cursor-default">წესები და პირობები</span>
            </nav>

            <main className="max-w-4xl mx-auto px-6">
                <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-rose-50 text-primary rounded-2xl flex items-center justify-center mb-6">
                        <FileText size={32} />
                    </div>

                    <h1 className="text-4xl font-serif text-text-dark mb-2">წესები და პირობები</h1>
                    <p className="text-sm text-text-mutted mb-12 border-b border-gray-100 pb-6">გთხოვთ ყურადღებით გაეცნოთ მოცემულ პირობებს საიტის გამოყენებამდე.</p>

                    <div className="prose prose-rose max-w-none text-text-dark font-light leading-relaxed">
                        <p>
                            ვებგვერდზე <strong>Lovenest.ge</strong>-ზე შემოსვლით და შეკვეთის განთავსებით თქვენ ეთანხმებით
                            ქვემოთ მოცემულ წესებსა და პირობებს.
                        </p>

                        <h3 className="text-xl font-serif text-text-dark mt-10 mb-4">1. შეკვეთის გაფორმება და მიწოდება</h3>
                        <ul className="list-disc pl-5 space-y-2 mt-4 text-text-mutted">
                            <li>შეკვეთის გაფორმება ხდება უშუალოდ ვებგვერდიდან.</li>
                            <li>მიწოდების ვადები თბილისის მასშტაბით შეადგენს 1-2 სამუშაო დღეს, ხოლო რეგიონებში 2-5 სამუშაო დღეს.</li>
                            <li>ფორსმაჟორული სიტუაციების დროს (მაგ: რთული კლიმატური პირობები), მიწოდება შეიძლება გადავადდეს.</li>
                        </ul>

                        <h3 className="text-xl font-serif text-text-dark mt-10 mb-4">2. გადახდა</h3>
                        <p>
                            ანგარიშსწორება ხდება ელექტრონულად (ბარათით) UniPay სისტემის მეშვეობით ან საბანკო გადარიცხვით (წინასწარი შეთანხმებით).
                            ადგილზე ნაღდი ფულით ანგარიშსწორება არ არის გათვალისწინებული.
                        </p>

                        <h3 className="text-xl font-serif text-text-dark mt-10 mb-4">3. დაბრუნების პოლიტიკა (Refund Policy)</h3>
                        <p>
                            მომხმარებელს უფლება აქვს დააბრუნოს ან გადაცვალოს ნივთი მისი მიღებიდან <strong>2 სამუშაო დღის განმავლობაში</strong>, მხოლოდ შემდეგ შემთხვევებში:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4 text-text-mutted">
                            <li>ნივთს აღენიშნება საწარმოო/ქარხნული წუნი.</li>
                            <li>ნივთი დაზიანებულია ტრანსპორტირებისას.</li>
                            <li>ნივთის ვიზუალური იერსახე თვალსაჩინოდ არ ემთხვევა ვებგვერდზე განთავსებულ აღწერას.</li>
                        </ul>
                        <p className="mt-4 font-medium text-text-dark bg-rose-50 p-4 rounded-xl">
                            დაბრუნების აუცილებელი პირობაა: ნივთი უნდა იყოს პირვანდელ მდგომარეობაში და შენარჩუნებული ჰქონდეს სასაჩუქრე შეფუთვა.
                        </p>

                        <h3 className="text-xl font-serif text-text-dark mt-10 mb-4">4. საავტორო უფლებები</h3>
                        <p>
                            ვებგვერდზე განთავსებული ყველა დიზაინი, ტექსტი და ბრენდინგის ელემენტი წარმოადგენს Lovenest-ის
                            ინტელექტუალურ საკუთრებას. მათი უნებართვო კოპირება ან კომერციული მიზნით გამოყენება აკრძალულია კანონით.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
