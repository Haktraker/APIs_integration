"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User } from "lucide-react"
import { ChangePasswordForm } from "./change-password-form"
import Link from "next/link"
import { useAuthStore } from "@/lib/auth"
import { serverLogout } from "@/app/actions/auth"
import { Bell } from "lucide-react"

export function AuthNavbar() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = async () => {
    logout()
    await serverLogout()
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <span className="text-2xl font-bold">
            <span className="text-blue-500">Hak</span>
            <span className="text-white">Trak</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="ml-8 hidden md:flex space-x-4">
          {/* <Button asChild variant="ghost" className="text-gray-300 hover:text-white">
            <Link href="/dashboard">Dashboard</Link>
          </Button> */}
          <Button asChild variant="ghost" className="text-gray-300 hover:text-white">
            <Link href="/darkweb">Dark Web</Link>
          </Button>
          <Button asChild variant="ghost" className="text-gray-300 hover:text-white">
            <Link href="/shodan">Shodan</Link>
          </Button>
          <Button asChild variant="ghost" className="text-gray-300 hover:text-white">
            <Link href="/intelx">IntelX</Link>
          </Button>
        </nav>
        
        <div className="ml-auto flex items-center space-x-4">
          {/* Notifications */}
          {/* <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
            <span className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-[10px] font-medium flex items-center justify-center text-white">
                3
              </span>
            </span>
          </Button> */}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-600 text-white">
                  <User className="h-4 w-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* <DropdownMenuItem asChild>
                <Link href="/profile">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  Settings
                </Link>
              </DropdownMenuItem> */}
              <DropdownMenuItem className="cursor-pointer" onSelect={() => setIsChangePasswordOpen(true)}>
                Change Password
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-500 cursor-pointer" onSelect={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <ChangePasswordForm onSuccess={() => setIsChangePasswordOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  )
} 