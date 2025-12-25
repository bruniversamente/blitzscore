import type { Metadata } from "next";
import { Geist, Geist_Mono, UnifrakturMaguntia } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const gothicFont = UnifrakturMaguntia({
  weight: "400",
  variable: "--font-gothic",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blitz Score - Placar Dutch Blitz",
  description: "O melhor marcador oficial para suas partidas de Dutch Blitz. Calcule pontos, acompanhe o histórico e veja quem é o mestre do Blitz!",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "Blitz Score - Placar Dutch Blitz",
    description: "Marcador oficial para Dutch Blitz com histórico e estatísticas.",
    images: [{ url: "/logo.jpg" }],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${gothicFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
