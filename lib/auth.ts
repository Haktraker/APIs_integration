"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {


  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    throw new Error("Email and password are required")
  }

  try {
    const response = await fetch(`${process.env.API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Login failed:", errorData)
      throw new Error(errorData.message || "Invalid credentials")
    }

    const data = await response.json()

    // Set auth cookie
    cookies().set("auth-token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    redirect("/home")
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
  
}

export async function logout() {
  cookies().delete("auth-token")
  redirect("/")
}

export async function checkAuth() {

  
  const token = cookies().get("auth-token")
  if (!token) {
    redirect("/")
  }
  
}

