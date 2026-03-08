"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
    {
        category: "შეკვეთა და მოწოდება",
        qas: [
            { q: "რამდენ ხანში მზადდება შეკვეთა?", a: "შეკვეთის დამუშავებას და მომზადებას ჩვეულებრივ 1 სამუშაო დღე სჭირდება." },
            { q: "რა ღირს მიტანის სერვისი?", a: "მიტანის სერვისი სრულიად უფასოა მთელი საქართველოს მასშტაბით." },
            { q: "რამდენ დღეში ხდება მიწოდება?", a: "თბილისის მასშტაბით მიწოდება ხორციელდება მეორე სამუშაო დღეს, ხოლო რეგიონებში 2-3 სამუშაო დღეშ." }
        ]
    },
    {
        category: "პროდუქტის შესახებ",
        qas: [
            { q: "რისგან არის დამზადებული წიგნი?", a: "წიგნი მზადდება პრემიუმ ხარისხის სქელი ქაღალდისგან, მყარი, ლამინირებული ყდით, რომელიც წლებს უძლებს." },
            { q: "რამდენი გვერდისგან შედგება?", a: "წიგნი შედგება 84 გვერდისგან." },
            { q: "შეიძლება თუ არა წიგნში ფოტოების ჩაკვრა?", a: "რა თქმა უნდა! ტექსტებთან ერთად თავისუფლად შეგიძლიათ ჩააკრათ პოლაროიდის ან სტანდარტული ფოტოები." }
        ]
    },
    {
        category: "გადახდა",
        qas: [
            { q: "როგორ ხდება თანხის გადახდა?", a: "გადახდა შეგიძლიათ როგორც ონლაინ, ბარათით (Unipay-ს დაცული სისტემით), ასევე ნაღდი ანგარიშსწორებით კურიერთან ამანათის ჩაბარებისას." },
            { q: "შემიძლია თუ არა ნივთის დაბრუნება?", a: "ვინაიდან პროდუქტი პერსონალიზირებულია, მისი დაბრუნება არ ხდება, გარდა იმ შემთხვევისა, თუ ნივთი ქარხნულად წუნდებულია ან დაზიანდა ტრანსპორტირებისას." }
        ]
    }
];

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState(`0-0`);

    const toggle = (id) => {
        setOpenIndex(openIndex === id ? null : id);
    };

    return (
        <div className="font-sans pt-24 pb-24 min-h-screen">
            <div className="bg-rose-50/30 border-y border-rose-50 py-16 mb-16">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-serif text-text-dark mb-4">ხშირად დასმული კითხვები</h1>
                    <p className="text-text-mutted text-lg font-light leading-relaxed">
                        ყველა პასუხი თქვენს კითხვებზე თავს იყრის აქ
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 space-y-12">
                {FAQS.map((category, catIdx) => (
                    <div key={catIdx} className="space-y-6">
                        <h2 className="text-2xl font-serif text-text-dark border-b border-rose-100 pb-2">{category.category}</h2>

                        <div className="space-y-4">
                            {category.qas.map((qa, qaIdx) => {
                                const id = `${catIdx}-${qaIdx}`;
                                const isOpen = openIndex === id;

                                return (
                                    <div key={qaIdx} className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                                        <button
                                            onClick={() => toggle(id)}
                                            className="w-full flex justify-between items-center p-5 text-left bg-white hover:bg-rose-50/30 transition-colors"
                                        >
                                            <span className={`font-medium text-lg ${isOpen ? "text-primary font-serif" : "text-text-dark"}`}>{qa.q}</span>
                                            <ChevronDown className={`transition-transform duration-300 text-text-mutted ${isOpen ? "rotate-180" : ""}`} size={20} />
                                        </button>
                                        {isOpen && (
                                            <div className="p-5 pt-2 text-text-mutted font-light leading-relaxed border-t border-gray-50 bg-rose-50/10">
                                                {qa.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
