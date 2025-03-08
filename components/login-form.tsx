"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { login } from "@/lib/auth"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { useAuthStore } from "@/lib/auth"
import { serverLogin } from "@/app/actions/auth"

export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      try {
        // Update client-side state
        login({ /* user data */ })
        // Handle server-side auth
        await serverLogin(formData)
        toast.success("Logged in successfully")
        router.push("/home")
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message)
          toast.error(error.message)
        } else {
          setError("An unexpected error occurred")
          toast.error("An unexpected error occurred")
        }
      }
    })
  }

  return (
    <Card className="w-full shadow-[0_0_30px_rgba(139,92,246,0.1)] border-muted">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              className="border-muted bg-secondary/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              className="border-muted bg-secondary/50"
              required
            />
          </div>
          {error && <div className="text-destructive text-sm">{error}</div>}
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


