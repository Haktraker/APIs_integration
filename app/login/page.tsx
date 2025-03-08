"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated (this is a placeholder, replace with your actual auth check)
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true"
    if (isAuthenticated) {
      router.push("/")
    }
  }, [router])

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center p-8 bg-background/50 backdrop-blur-sm">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
      <div className="hidden md:flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm p-8">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_Dark%20(1)-yjskR4803oYo2QW6vazyu5WEOg0vVJ.webp"
          alt="HakTrak Logo"
          width={400}
          height={100}
          priority
          className="mb-8"
        />
        <p className="text-lg text-center text-muted-foreground max-w-md">
          HakTrak Networks is an AI-powered eXtended Cyber Intelligence (XCI) Platform that protects you against cyber
          threats with actionable & contextualized intelligence.
        </p>
      </div>
    </div>
  )
} 