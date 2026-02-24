import Image from "next/image";

export const metadata = {
    title: "ჩვენს შესახებ | Lovenest",
    description: "Lovenest-ის ისტორია და ჩვენი ღირებულებები.",
};

export default function AboutPage() {
    return (
        <div className="font-sans pt-24 pb-24">
            {/* Header */}
            <div className="bg-rose-50/30 border-y border-rose-50 py-16 mb-16">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-serif text-text-dark mb-4">ჩვენს შესახებ</h1>
                    <p className="text-text-mutted text-lg font-light leading-relaxed">
                        ჩვენ ვქმნით არა ნივთებს, არამედ ემოციებს, რომლებიც წლებს უძლებს.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-xl border border-rose-100">
                    <Image src="/product-2.png" alt="Lovenest Mission" fill className="object-cover" />
                </div>

                <div className="space-y-6 text-lg text-text-mutted font-light leading-relaxed">
                    <h2 className="text-3xl font-serif text-text-dark font-medium mb-6">როგორ დაიწყო ყველაფერი?</h2>
                    <p>
                        იდეა გაჩნდა სურვილიდან, რომ შეგვექმნა საჩუქარი, რომელიც იქნებოდა უფრო მეტი, ვიდრე უბრალოდ ნივთი. გვინდოდა გაგვეკეთებინა რაღაც ისეთი, რაც შეინახავდა ადამიანის ემოციას, მის ხმას და სიტყვებს.
                    </p>
                    <p>
                        ასე შეიქმნა <strong>"წამიკითხე როცა დაგჭირდები"</strong> — 84 გვერდიანი ცარიელი წიგნი, რომელსაც ავსებს თავად მჩუქებელი. ეს არის წერილები მომავალში, ზუსტად იმ მომენტებისთვის გათვლილი, როცა ადამიანს სჭირდება გამხნევება, სიყვარულის შეხსენება ან უბრალოდ გაღიმება.
                    </p>
                    <p>
                        ჩვენი მისიაა დავეხმაროთ ადამიანებს ერთმანეთისთვის უნიკალური, დაუვიწყარი მოგონებების ჩუქებაში. თითოეული წიგნი იბეჭდება უმაღლესი ხარისხის მასალებით და იკვრება დიდი სიყვარულით საქართველოში.
                    </p>
                </div>
            </div>
        </div>
    );
}
