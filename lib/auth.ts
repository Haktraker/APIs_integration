"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean
  user: any | null
  login: (userData: any) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (userData) => set({ isAuthenticated: true, user: userData }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

export const useAuth = () => {
  const { isAuthenticated, user, login, logout } = useAuthStore()
  return { isAuthenticated, user, login, logout }
}

export const logout = () => {
  useAuthStore.getState().logout()
}

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

export async function checkAuth() {

  
  const token = cookies().get("auth-token")
  if (!token) {
    redirect("/")
  }
  
}

