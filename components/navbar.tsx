"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { User } from "lucide-react"
import { ChangePasswordForm } from "./change-password-form"
import { logout } from "@/lib/auth"
import Link from "next/link"

export function Navbar() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/")
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
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

