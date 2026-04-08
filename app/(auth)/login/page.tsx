"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const { data, error: authError } = await authClient.signIn.username({
                username,
                password,
            })

            if (authError) {
                setError(authError.message || "Credenciales incorrectas")
            } else {
                router.push("/")
                router.refresh()
            }
        } catch (err) {
            setError("Hubo un error de conexión.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden z-10">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-latte/40 dark:bg-brand-cocoa/30 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-overlay pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-brand-croissant/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-overlay pointer-events-none" />

            <main className="w-full max-w-md bg-card border border-border p-8 rounded-4xl shadow-2xl relative z-10 transition-all">
                <div className="text-center mb-8">
                    <div className="h-16 w-16 bg-secondary rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-6 border border-border">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-croissant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-serif tracking-tight text-foreground">Ingreso de Personal</h1>
                    <p className="text-muted-foreground mt-3 text-sm font-medium">Bienvenido al dashboard integrado</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground block">Usuario</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-secondary border border-border text-foreground rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-brand-croissant/20 focus:border-brand-croissant transition-all"
                            placeholder="Ej: panadderia"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground block">Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-secondary border border-border text-foreground rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-brand-croissant/20 focus:border-brand-croissant transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-croissant hover:bg-brand-croissant/90 text-white font-serif tracking-wide text-lg rounded-2xl px-4 py-3.5 transition-all transform active:scale-[0.98] shadow-lg shadow-brand-croissant/20 flex items-center justify-center mt-4"
                    >
                        {loading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : "Ingresar al Panel"}
                    </button>
                </form>
            </main>
        </div>
    )
}
