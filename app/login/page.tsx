"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSearchParams } from "next/navigation"
import { serverLogin } from "@/app/actions/auth"
import { useAuthStore } from "@/lib/auth"
import { useState, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"

// Form validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

// Separate the form component
function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const login = useAuthStore((state) => state.login)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('email', data.email)
      formData.append('password', data.password)
      if (callbackUrl) {
        formData.append('callbackUrl', callbackUrl)
      }

      // Update client-side state
      login({ email: data.email })
      
      // Handle server-side auth
      await serverLogin(formData)
    } catch (error) {
      console.error('Login error:', error)
      toast.error("Invalid email or password")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {callbackUrl && (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      )}
      
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Password</Label>
          <Link 
            href="/forgot-password" 
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          {...register("password")}
          className={errors.password ? "border-red-500" : ""}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      {/* Sign Up Link */}
      <p className="text-center text-gray-400 text-sm">
        Don't have an account?{" "}
        <Link 
          href="/register" 
          className="text-blue-400 hover:text-blue-300"
        >
          Create one now
        </Link>
      </p>
    </form>
  )
}

// Main page component
export default function LoginPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            className="max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Back to Home Link */}
            <Link 
              href="/" 
              className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>

            {/* Login Form Card */}
            <div className="bg-gray-800/30 rounded-lg p-8 backdrop-blur-sm border border-gray-700">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  <span className="gradient-text">Welcome Back</span>
                </h1>
                <p className="text-gray-400">
                  Sign in to access your dashboard
                </p>
              </div>

              <Suspense fallback={
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              }>
                <LoginForm />
              </Suspense>
            </div>

            {/* Additional Info */}
            <div className="mt-8 text-center text-sm text-gray-400">
              <p>
                By signing in, you agree to our{" "}
                <Link 
                  href="/terms" 
                  className="text-blue-400 hover:text-blue-300"
                >
                  Terms of Service
                </Link>
                {" "}and{" "}
                <Link 
                  href="/privacy" 
                  className="text-blue-400 hover:text-blue-300"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
} 