import Link from "next/link";
import { Heart } from "lucide-react";

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-polka flex items-center justify-center p-6">
            <div className="bg-white p-12 cartoon-border cartoon-shadow rounded-3xl max-w-xl text-center space-y-6">
                <Heart size={80} className="fill-brand-pink text-brand-pink mx-auto" />
                <h1 className="text-5xl font-[family-name:var(--font-bangers)] text-brand-pink mt-4">გადახდა წარმატებულია!</h1>
                <p className="text-xl font-medium">თქვენი შეკვეთა მიღებულია. ჩვენ მალე დაგიკავშირდებით შეკვეთის დეტალების დასაზუსტებლად და წიგნის გასაგზავნად.</p>
                <Link href="/" className="cartoon-btn bg-brand-blue w-full mt-6">
                    მთავარ გვერდზე დაბრუნება
                </Link>
            </div>
        </div>
    );
}
