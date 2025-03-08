import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
  // Your existing login logic
  const email = formData.get("email")
  const password = formData.get("password")

  // Add your authentication logic here
  // For now, we'll just set a cookie
  cookies().set("auth-token", "your-auth-token")
  redirect("/dashboard")
}

export async function serverLogout() {
  cookies().delete("auth-token")
  redirect("/")
}

export async function checkAuth() {
  const token = cookies().get("auth-token")
  if (!token) {
    redirect("/login")
  }
} 