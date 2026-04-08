"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Store, Calendar, Printer, CheckCircle2, Ticket, Trash2, Edit2, Check, X } from "lucide-react"
import { deleteTicket, updateVentaItem, deleteVentaItem, updateTicketDate } from "@/app/actions/ventas"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { DateTimePicker } from "@/components/ui/date-time-picker"

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
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [newDate, setNewDate] = useState<Date>(new Date(ticket.date))
  const [editForm, setEditForm] = useState<{producto: string, cantidad: number, precioUnitario: number}>({
    producto: "",
    cantidad: 0,
    precioUnitario: 0
  })

  const handleDeleteTicket = async () => {
    if (!confirm("¿Está seguro de que desea eliminar esta venta completa?")) return
    setIsDeleting(true)
    try {
      await deleteTicket(ticket.id)
      router.push("/ventas")
    } catch (error) {
      alert("Error al eliminar la venta")
      setIsDeleting(false)
    }
  }

  const startEditing = (item: VentaItem) => {
    setEditingItemId(item.id)
    setEditForm({
      producto: item.producto,
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precioUnitario)
    })
  }

  const handleUpdateItem = async (itemId: string) => {
    try {
      await updateVentaItem(itemId, editForm)
      setEditingItemId(null)
      router.refresh()
    } catch (error) {
      alert("Error al actualizar el ítem")
    }
  }

  const handleUpdateDate = async () => {
    try {
      await updateTicketDate(ticket.id, new Date(newDate))
      setIsEditingDate(false)
      router.refresh()
    } catch (error) {
      alert("Error al actualizar la fecha")
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este producto del ticket?")) return
    try {
      await deleteVentaItem(itemId)
      router.refresh()
    } catch (error) {
      alert("Error al eliminar el ítem")
    }
  }

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
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDeleteTicket}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-full transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Borrar Todo
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-sm font-medium">
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
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
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Fecha</span>
                <button 
                  onClick={() => setIsEditingDate(!isEditingDate)}
                  className="text-brand-croissant hover:underline text-[10px]"
                >
                  {isEditingDate ? 'Cancelar' : 'Editar'}
                </button>
              </p>
              {isEditingDate ? (
                <div className="space-y-4 pt-2">
                  <DateTimePicker 
                    date={newDate} 
                    onChange={setNewDate} 
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateDate}
                      className="flex-1 py-2 bg-brand-croissant text-white rounded-xl text-xs font-bold hover:bg-brand-croissant/90 transition-all shadow-sm"
                    >
                      Guardar Cambios
                    </button>
                    <button
                      onClick={() => setIsEditingDate(false)}
                      className="px-3 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-bold hover:bg-black/5 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium">
                    {format(new Date(ticket.date), "EEEE, d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(ticket.date), "HH:mm 'hs'", { locale: es })}
                  </p>
                </>
              )}
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
                    <th className="pb-3 text-right font-medium pr-4">Precio</th>
                    <th className="pb-3 text-right font-medium">Total</th>
                    <th className="pb-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {ticket.items.map((item) => (
                    <tr key={item.id} className="group">
                      {editingItemId === item.id ? (
                        <>
                          <td className="py-2 pr-2">
                            <input
                              type="text"
                              className="w-full bg-background border border-border rounded px-2 py-1 text-sm"
                              value={editForm.producto}
                              onChange={(e) => setEditForm({ ...editForm, producto: e.target.value })}
                            />
                          </td>
                          <td className="py-2 text-right pr-2">
                            <input
                              type="number"
                              className="w-16 bg-background border border-border rounded px-2 py-1 text-sm text-right"
                              value={editForm.cantidad}
                              onChange={(e) => setEditForm({ ...editForm, cantidad: Number(e.target.value) })}
                            />
                          </td>
                          <td className="py-2 text-right pr-4">
                            <input
                              type="number"
                              className="w-24 bg-background border border-border rounded px-2 py-1 text-sm text-right"
                              value={editForm.precioUnitario}
                              onChange={(e) => setEditForm({ ...editForm, precioUnitario: Number(e.target.value) })}
                            />
                          </td>
                          <td className="py-2 text-right font-serif font-medium">
                            {formatCurrency(editForm.cantidad * editForm.precioUnitario)}
                          </td>
                          <td className="py-2 text-right space-x-1">
                            <button
                              onClick={() => handleUpdateItem(item.id)}
                              className="p-1 rounded hover:bg-brand-matcha/20 text-emerald-600"
                              title="Guardar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingItemId(null)}
                              className="p-1 rounded hover:bg-black/5 text-muted-foreground"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-4 text-sm font-medium pr-2">
                            {item.producto}
                          </td>
                          <td className="py-4 text-sm text-right text-muted-foreground pr-2">
                            {parseNumber(item.cantidad)}
                          </td>
                          <td className="py-4 text-sm text-right text-muted-foreground pr-4">
                            {formatCurrency(parseNumber(item.precioUnitario))}
                          </td>
                          <td className="py-4 text-base font-serif font-medium text-right">
                            {formatCurrency(parseNumber(item.subtotal))}
                          </td>
                          <td className="py-4 text-right space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditing(item)}
                              className="p-1 rounded hover:bg-black/5 text-muted-foreground hover:text-brand-croissant"
                              title="Editar ítem"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
                              title="Eliminar ítem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}
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
