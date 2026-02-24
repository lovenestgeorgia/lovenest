import { Noto_Sans_Georgian } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Cart } from "@/components/Cart";

// Note: Dachi The Lynx is handled via pure CSS @font-face in globals.css
// to prevent Next.js build errors when the actual font file is missing locally.

const notoSansGeorgian = Noto_Sans_Georgian({
  variable: "--font-sans",
  subsets: ["georgian"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Lovenest | წამიკითხე როცა დაგჭირდები",
  description: "უნიკალური, ემოციური და პერსონალიზირებული საჩუქარი თქვენი საყვარელი ადამიანისთვის. Lovenest.ge",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ka" className="scroll-smooth">
      <body className={`font-dachi ${notoSansGeorgian.variable} font-sans antialiased selection:bg-rose-200 selection:text-rose-900 bg-bg-light flex flex-col min-h-screen`}>
        <Header />
        <Cart />
        <main className="flex-1 w-full relative z-0">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
