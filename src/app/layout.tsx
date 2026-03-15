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
  title: "Tokenise Anything | Deca4 x Curio",
  description:
    "Paste your website. Get a custom tokenisation proposal in 90 seconds. We analyse your business, identify tokenisable assets, and generate a complete strategy.",
  keywords:
    "tokenisation, tokenization, asset tokenisation, real estate tokenisation, blockchain, token economics, regulatory framework, Deca4, Curio",
  authors: [{ name: "Deca4 Advisory FZE" }, { name: "curioInvest" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    siteName: "Tokenise Anything",
    title: "Tokenise Anything | Instant Tokenisation Proposals",
    description:
      "Paste your website. We analyse your business and deliver a custom tokenisation proposal with token economics, regulatory framework, and go-to-market strategy.",
    url: "https://tokenise.deca4.com",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tokenise Anything | Deca4 x Curio",
    description:
      "From URL to tokenisation proposal in 90 seconds. Free and instant.",
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
