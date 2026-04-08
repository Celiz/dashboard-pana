"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setLoading(true)
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login")
          router.refresh()
        },
      },
    })
    setLoading(false)
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground bg-card border border-border rounded-xl hover:bg-secondary hover:text-foreground transition-all shadow-sm hover:border-brand-croissant/30 active:scale-95"
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span>{loading ? "Saliendo..." : "Cerrar sesión"}</span>
    </button>
  )
}
