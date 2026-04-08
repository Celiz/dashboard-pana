"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Receipt, Store, Search, ChevronRight, Trash2, Download, FileText, FileDown } from "lucide-react"
import { deleteTicket } from "@/app/actions/ventas"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DateFilter } from "./DateFilter"
import { exportToCSV, exportToPDF } from "@/lib/exportUtils"


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
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar esta venta? Esta acción no se puede deshacer.")) return
    
    setIsDeleting(id)
    try {
      await deleteTicket(id)
      router.refresh()
    } catch (error) {
      alert("Error al eliminar la venta")
    } finally {
      setIsDeleting(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleExportCSV = () => {
    const headers = ["Fecha", "Local", "Estado", "Items", "Total"]
    const rows = tickets.map(t => [
      format(new Date(t.date), "dd/MM/yyyy HH:mm"),
      t.localName,
      t.status,
      t.itemsCount,
      t.total
    ])
    exportToCSV({ headers, rows, filename: `ventas_${format(new Date(), "yyyy-MM-dd")}`, title: "Registro de Ventas" })
  }

  const handleExportPDF = () => {
    const headers = ["Fecha", "Local", "Estado", "Items", "Total"]
    const rows = tickets.map(t => [
      format(new Date(t.date), "dd/MM/yyyy HH:mm"),
      t.localName,
      t.status,
      t.itemsCount,
      formatCurrency(t.total)
    ])
    exportToPDF({ 
      headers, 
      rows, 
      filename: `ventas_${format(new Date(), "yyyy-MM-dd")}`, 
      title: "Registro de Ventas" 
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-serif tracking-tight">Registro de Ventas</h2>
            <p className="text-muted-foreground mt-1 text-sm">Historial de tickets procesados.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            className="rounded-xl border-border/50 bg-card/50 hover:bg-secondary/50"
          >
            <FileDown className="h-4 w-4 mr-2 text-brand-matcha" />
            CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportPDF}
            className="rounded-xl border-border/50 bg-card/50 hover:bg-secondary/50"
          >
            <FileText className="h-4 w-4 mr-2 text-brand-croissant" />
            PDF
          </Button>
        </div>
      </div>


      <DateFilter />

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
                    <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                      <Link 
                        href={`/ventas/${ticket.id}`} 
                        className="inline-flex items-center justify-center p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-brand-croissant"
                        title="Ver detalle"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        disabled={isDeleting === ticket.id}
                        className="inline-flex items-center justify-center p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-600 disabled:opacity-50"
                        title="Eliminar venta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
