"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Receipt, Store, Search, ChevronRight } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface TicketData {
  id: string
  localName: string
  date: string
  status: string
  total: number
  itemsCount: number
}

interface VentasListClientProps {
  tickets: TicketData[]
}

export function VentasListClient({ tickets }: VentasListClientProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-3xl font-serif tracking-tight">Registro de Ventas</h2>
          <p className="text-muted-foreground mt-1 text-sm">Historial de todos los tickets procesados recientemente.</p>
        </div>
      </div>

      <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden bg-card/60 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Fecha</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Local</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Estado</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Items</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-muted-foreground text-right">Total</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-muted-foreground text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No hay ventas registradas aún.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {format(new Date(ticket.date), "dd/MM/yyyy HH:mm", { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-brand-croissant" />
                        <span className="font-medium text-foreground">{ticket.localName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-brand-matcha/20 text-emerald-800 dark:text-emerald-300">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {ticket.itemsCount} {ticket.itemsCount === 1 ? 'prod.' : 'prods.'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-serif font-medium text-base">
                      {formatCurrency(ticket.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link 
                        href={`/ventas/${ticket.id}`} 
                        className="inline-flex items-center justify-center p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-brand-croissant"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
