"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function serverLogin(formData: FormData) {
  const email = formData.get("email")
  const password = formData.get("password")
  const callbackUrl = formData.get("callbackUrl") as string

  // Add your authentication logic here
  cookies().set("auth-token", "your-auth-token")

  // Redirect to callback URL if it exists, otherwise to dashboard
  redirect(callbackUrl || "/dashboard")
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
  return token
} 