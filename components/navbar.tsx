"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthNavbar } from "./auth-navbar"
import { useAuthStore } from "@/lib/auth"

export function Navbar() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <AuthNavbar />
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">
              <span className="text-blue-500">Hak</span>
              <span className="text-white">Trak</span>
            </span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" className="text-gray-300 hover:text-white">
              <Link href="/about">About</Link>
            </Button>
            <Button asChild variant="ghost" className="text-gray-300 hover:text-white">
              <Link href="/features">Features</Link>
            </Button>
            <Button asChild variant="ghost" className="text-gray-300 hover:text-white">
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

