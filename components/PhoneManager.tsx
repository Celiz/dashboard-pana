"use client"

import { useState } from "react"
import { Plus, Trash2, Settings2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Local } from "@/app/page"
import { addTelefono, removeTelefono } from "@/app/actions/telefonos"

interface PhoneManagerProps {
  local: Local
}

export function PhoneManager({ local }: PhoneManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newNumber, setNewNumber] = useState("")
  const [isPending, setIsPending] = useState(false)

  const handleAdd = async () => {
    if (!newNumber.trim()) return
    setIsPending(true)
    try {
      await addTelefono(local.id, newNumber)
      setNewNumber("")
      toast.success("Número agregado correctamente")
    } catch (error: any) {
      toast.error(error.message || "Error al agregar el número")
    } finally {
      setIsPending(false)
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm("¿Estás seguro de que querés eliminar este número?")) return
    setIsPending(true)
    try {
      await removeTelefono(id)
      toast.success("Número eliminado")
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el número")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-brand-croissant/10 hover:text-brand-croissant">
          <Settings2 className="h-3.5 w-3.5" />
          <span className="sr-only">Configurar WhatsApp</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Administrar WhatsApp</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Agregá o quitá números para <strong>{local.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <Label htmlFor="number" className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Nuevo Número</Label>
            <div className="flex gap-2">
              <Input
                id="number"
                placeholder="Ej: 5492231234567"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                disabled={isPending}
                className="rounded-xl border-border focus-visible:ring-brand-croissant"
              />
              <Button 
                onClick={handleAdd} 
                disabled={isPending || !newNumber.trim()}
                className="bg-brand-croissant hover:bg-brand-croissant/90 text-white rounded-xl px-4"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Números Registrados</Label>
            <div className="space-y-2">
              {local.telefonos.length === 0 ? (
                <p className="text-sm text-muted-foreground italic bg-secondary/30 p-4 rounded-xl text-center">
                  No hay números registrados para este local.
                </p>
              ) : (
                local.telefonos.map((tel) => (
                  <div key={tel.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                    <span className="font-mono text-sm">+{tel.numero}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
                      onClick={() => handleRemove(tel.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
