import { Noto_Sans_Georgian } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Cart } from "@/components/Cart";
import { FOMOToast } from "@/components/FOMOToast";

// Note: Dachi The Lynx is handled via pure CSS @font-face in globals.css
// to prevent Next.js build errors when the actual font file is missing locally.

const notoSansGeorgian = Noto_Sans_Georgian({
  variable: "--font-sans",
  subsets: ["georgian"],
  weight: ["300", "400", "500", "600", "700"],
});

const FB_PIXEL_ID = "481894767979502";

export const metadata = {
  title: "Lovenest | წამიკითხე როცა დაგჭირდები",
  description: "უნიკალური, ემოციური და პერსონალიზირებული საჩუქარი თქვენი საყვარელი ადამიანისთვის. Lovenest.ge",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ka" className="scroll-smooth">
      <head>
        {/* Facebook Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${FB_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </head>
      <body className={`font-dachi ${notoSansGeorgian.variable} font-sans antialiased selection:bg-rose-200 selection:text-rose-900 bg-bg-light flex flex-col min-h-screen`}>
        <Header />
        <Cart />
        <main className="flex-1 w-full relative z-0">
          {children}
        </main>
        <Footer />
        <FOMOToast />
      </body>
    </html>
  );
}
