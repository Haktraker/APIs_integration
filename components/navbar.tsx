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

export function Navbar() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_Dark%20(1)-yjskR4803oYo2QW6vazyu5WEOg0vVJ.webp"
          alt="HakTrak Logo"
          width={120}
          height={30}
          priority
        />
        <div className="ml-auto flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsChangePasswordOpen(true)}>Change Password</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleLogout}
          >
            Logout
          </Button>
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

