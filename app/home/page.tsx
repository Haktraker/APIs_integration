import { checkAuth } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { SearchForm } from "@/components/search-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Access your HakTrak Networks dashboard for real-time cyber intelligence and threat detection",
}

export default async function HomePage() {
  await checkAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">
          <SearchForm />
        </main>
      </div>
    </div>
  )
}

