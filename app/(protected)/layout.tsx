import { checkAuth } from "@/app/actions/auth"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication on the server side
  await checkAuth()

  return <>{children}</>
} 