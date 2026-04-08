"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Wallet, Store, Search, Trash2, Edit2, Check, X, Calendar, FileDown, FileText } from "lucide-react"
import { updateGasto, deleteGasto } from "@/app/actions/movimientos"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DateFilter } from "./DateFilter"
import { exportToCSV, exportToPDF } from "@/lib/exportUtils"


interface GastoData {
  id: string
  localId: string
  localName: string
  date: string
  concepto: string
  monto: number
}

interface GastosListClientProps {
  gastos: GastoData[]
}

export function GastosListClient({ gastos }: GastosListClientProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ fecha: string, concepto: string, monto: number }>({
    fecha: "",
    concepto: "",
    monto: 0
  })

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este gasto? Esta acción no se puede deshacer.")) return
    
    setIsDeleting(id)
    try {
      await deleteGasto(id)
      router.refresh()
    } catch (error) {
      alert("Error al eliminar el gasto")
    } finally {
      setIsDeleting(null)
    }
  }

  const startEditing = (gasto: GastoData) => {
    setEditingId(gasto.id)
    setEditForm({
      fecha: format(new Date(gasto.date), "yyyy-MM-dd'T'HH:mm"),
      concepto: gasto.concepto,
      monto: gasto.monto
    })
  }

  const handleUpdate = async (id: string) => {
    try {
      await updateGasto(id, {
        fecha: new Date(editForm.fecha),
        concepto: editForm.concepto,
        monto: editForm.monto
      })
      setEditingId(null)
      router.refresh()
    } catch (error) {
      alert("Error al actualizar el gasto")
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
    const headers = ["Fecha", "Local", "Concepto", "Monto"]
    const rows = gastos.map(g => [
      format(new Date(g.date), "dd/MM/yyyy HH:mm"),
      g.localName,
      g.concepto,
      g.monto
    ])
    exportToCSV({ headers, rows, filename: `gastos_${format(new Date(), "yyyy-MM-dd")}`, title: "Registro de Gastos" })
  }

  const handleExportPDF = () => {
    const headers = ["Fecha", "Local", "Concepto", "Monto"]
    const rows = gastos.map(g => [
      format(new Date(g.date), "dd/MM/yyyy HH:mm"),
      g.localName,
      g.concepto,
      formatCurrency(g.monto)
    ])
    exportToPDF({ 
      headers, 
      rows, 
      filename: `gastos_${format(new Date(), "yyyy-MM-dd")}`, 
      title: "Registro de Gastos" 
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
            <h2 className="text-3xl font-serif tracking-tight">Registro de Gastos</h2>
            <p className="text-muted-foreground mt-1 text-sm">Historial de salidas de caja.</p>
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
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Concepto</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-muted-foreground text-right">Monto</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-muted-foreground text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {gastos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No hay gastos registrados en este período.
                  </td>
                </tr>
              ) : (
                gastos.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-secondary/20 transition-colors group">
                    {editingId === gasto.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <input
                            type="datetime-local"
                            className="bg-background border border-border rounded px-2 py-1 text-xs"
                            value={editForm.fecha}
                            onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-brand-croissant" />
                            <span className="font-medium text-foreground">{gasto.localName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            className="w-full bg-background border border-border rounded px-2 py-1 text-sm"
                            value={editForm.concepto}
                            onChange={(e) => setEditForm({ ...editForm, concepto: e.target.value })}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <input
                            type="number"
                            className="w-24 bg-background border border-border rounded px-2 py-1 text-sm text-right"
                            value={editForm.monto}
                            onChange={(e) => setEditForm({ ...editForm, monto: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                          <button
                            onClick={() => handleUpdate(gasto.id)}
                            className="p-2 rounded-full hover:bg-brand-matcha/20 text-emerald-600 transition-colors"
                            title="Guardar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 rounded-full hover:bg-black/5 text-muted-foreground transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm uppercase tracking-tighter text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{format(new Date(gasto.date), "dd/MM/yyyy", { locale: es })}</span>
                            <span>{format(new Date(gasto.date), "HH:mm 'hs'", { locale: es })}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-brand-croissant opacity-70" />
                            <span className="font-medium text-foreground">{gasto.localName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium">{gasto.concepto}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-serif font-medium text-base text-red-600 dark:text-red-400">
                          - {formatCurrency(gasto.monto)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center space-x-1">
                          <button
                            onClick={() => startEditing(gasto)}
                            className="inline-flex items-center justify-center p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-brand-croissant"
                            title="Editar gasto"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(gasto.id)}
                            disabled={isDeleting === gasto.id}
                            className="inline-flex items-center justify-center p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-600 disabled:opacity-50"
                            title="Eliminar gasto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </>
                    )}
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
