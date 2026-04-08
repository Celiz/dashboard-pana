"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Store, Calendar, Printer, CheckCircle2, Ticket } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import type { VentaItem } from "@/app/page"

interface VentaDetailClientProps {
  ticket: {
    id: string
    date: string
    status: string
    localName: string
    items: VentaItem[]
  }
}

export function VentaDetailClient({ ticket }: VentaDetailClientProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const parseNumber = (value: any) => {
    return Number(value) || 0
  }

  const subtotal = ticket.items.reduce((acc, item) => acc + parseNumber(item.subtotal), 0)

  return (
    <div className="space-y-6 max-w-3xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/ventas" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-serif tracking-tight flex items-center gap-2">
              <Ticket className="w-6 h-6 text-brand-croissant" />
              Detalle de Venta
            </h2>
            <p className="text-muted-foreground text-sm font-mono mt-1 opacity-70">
              ID: {ticket.id}
            </p>
          </div>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-sm font-medium">
          <Printer className="w-4 h-4" />
          Imprimir comprobante
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Información del Ticket */}
        <Card className="md:col-span-1 rounded-3xl bg-secondary/30 border-border/50">
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-widest text-muted-foreground font-semibold">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
                <Store className="w-4 h-4" /> Local
              </p>
              <p className="font-serif font-medium text-lg leading-tight">{ticket.localName}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Fecha
              </p>
              <p className="font-medium">
                {format(new Date(ticket.date), "EEEE, d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(ticket.date), "HH:mm 'hs'", { locale: es })}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Estado
              </p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-brand-matcha/30 text-emerald-800 dark:text-emerald-300">
                {ticket.status}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Detalle de Productos */}
        <Card className="md:col-span-2 rounded-3xl border-border/50 shadow-sm relative overflow-hidden bg-card/80">
          {/* Un adorno para que parezca un ticket */}
          <div className="absolute top-0 left-0 w-full h-3 border-b-2 border-dashed border-border/60 opacity-50"></div>
          
          <CardHeader className="pt-8">
            <CardTitle className="font-serif text-xl">Ítems Procesados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-t border-border/50 pt-4 mt-2">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                    <th className="pb-3 font-medium w-1/2">Producto</th>
                    <th className="pb-3 text-right font-medium">Cant.</th>
                    <th className="pb-3 text-right font-medium pr-4 md:pr-8">Precio</th>
                    <th className="pb-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {ticket.items.map((item) => (
                    <tr key={item.id} className="group">
                      <td className="py-4 text-sm font-medium pr-2">
                        {item.producto}
                      </td>
                      <td className="py-4 text-sm text-right text-muted-foreground pr-2">
                        {parseNumber(item.cantidad)}
                      </td>
                      <td className="py-4 text-sm text-right text-muted-foreground pr-4 md:pr-8">
                        {formatCurrency(parseNumber(item.precioUnitario))}
                      </td>
                      <td className="py-4 text-base font-serif font-medium text-right">
                        {formatCurrency(parseNumber(item.subtotal))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="bg-secondary/40 border-t border-dashed border-border flex flex-col items-end pt-6 pb-6 px-6">
            <div className="flex justify-between w-full sm:w-1/2">
              <span className="text-muted-foreground font-medium">Total Ticket</span>
              <span className="text-3xl font-serif text-brand-croissant drop-shadow-sm font-semibold tracking-tight">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
