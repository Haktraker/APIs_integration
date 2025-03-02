import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import "react-calendar-heatmap/dist/styles.css";
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "HakTrak Networks",
    template: "%s | HakTrak Networks",
  },
  description: "AI-powered eXtended Cyber Intelligence Platform",
  keywords: ["cybersecurity", "AI", "intelligence", "threat detection", "network security"],
  authors: [{ name: "HakTrak Networks" }],
  creator: "HakTrak Networks",
  publisher: "HakTrak Networks",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://haktrak.com",
    siteName: "HakTrak Networks",
    title: "HakTrak Networks",
    description: "AI-powered eXtended Cyber Intelligence Platform",
    images: [
      {
        url: "https://haktrak.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "HakTrak Networks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HakTrak Networks",
    description: "AI-powered eXtended Cyber Intelligence Platform",
    images: ["https://haktrak.com/twitter-image.jpg"],
    creator: "@haktraknetworks",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
    generator: 'haktrak.com'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}



import './globals.css'