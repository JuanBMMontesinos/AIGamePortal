import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getCategories } from "@/lib/data/api";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Made By AI Games • Notícias Gamer com Curadoria de IA em Tempo Real",
    template: "%s | Made By AI Games",
  },
  description:
    "Portal de notícias de videogame de última geração gerenciado por agentes de IA. Cobertura em tempo real de PlayStation, Xbox, Nintendo, PC Gaming e Hardware com resumos TL;DR e verificação E-E-A-T.",
  keywords: [
    "Games",
    "Notícias Gamer",
    "PlayStation 5",
    "Xbox Series X",
    "Nintendo Switch 2",
    "PC Gaming",
    "Hardware",
    "IA",
    "Gemini",
    "Made By AI Games",
  ],
  authors: [{ name: "Made By AI Games AI Editorial Team" }],
  creator: "Made By AI Games",
  publisher: "Made By AI Games",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Made By AI Games",
    title: "Made By AI Games • Notícias Gamer com Curadoria de IA em Tempo Real",
    description:
      "Portal gamer autônomo com resumos TL;DR, metadados de jogos e verificação semântica de fatos.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Made By AI Games • Notícias Gamer com Curadoria de IA",
    description: "Cobertura gamer veloz, inteligente e estruturada por IA.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getCategories();
  const rawClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();
  const adsenseClientId = rawClientId
    ? rawClientId.startsWith("ca-pub-")
      ? rawClientId
      : rawClientId.startsWith("pub-")
      ? `ca-${rawClientId}`
      : `ca-pub-${rawClientId}`
    : undefined;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} font-sans min-h-screen flex flex-col bg-zinc-50 dark:bg-gamer-950 text-zinc-900 dark:text-zinc-100 antialiased selection:bg-brand-purple selection:text-white transition-colors duration-200`}
      >
        {adsenseClientId && (
          <Script
            id="google-adsense"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <div className="flex flex-col min-h-screen">
            <Header categories={categories} />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
