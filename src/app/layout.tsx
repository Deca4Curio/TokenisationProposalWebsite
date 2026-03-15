import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Real Assets. Global Capital. | Deca4 x Curio",
  description:
    "Need better access to capital or new revenue streams? Get your tokenisation report and find out how tokenisation can benefit you.",
  keywords:
    "tokenisation, tokenization, asset tokenisation, real estate tokenisation, blockchain, token economics, regulatory framework, Deca4, Curio",
  authors: [{ name: "Deca4 Advisory FZE" }, { name: "curioInvest" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    siteName: "Deca4 x Curio",
    title: "Real Assets. Global Capital. | Deca4 x Curio",
    description:
      "Need better access to capital or new revenue streams? Get your tokenisation report and find out how tokenisation can benefit you.",
    url: "https://tokenise.deca4.com",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tokenise Anything | Deca4 x Curio",
    description:
      "From URL to tokenisation report in 90 seconds. Free and instant.",
  },
  other: {
    "theme-color": "#00A9A5",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
