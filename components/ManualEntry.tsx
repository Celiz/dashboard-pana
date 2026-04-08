"use client"

import { useState } from "react"
import { Plus, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { createManualGasto, createManualVenta } from "@/app/actions/movimientos"
import { Local } from "@/app/page"

interface ManualEntryProps {
    locales: Local[]
    userLocalId?: string
}

export function ManualEntry({ locales, userLocalId }: ManualEntryProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState<"venta" | "gasto">("venta")
    
    const [localId, setLocalId] = useState(userLocalId || locales[0]?.id || "")
    const [fecha, setFecha] = useState<Date>(new Date())
    
    // Form fields
    const [concepto, setConcepto] = useState("")
    const [monto, setMonto] = useState("")
    const [producto, setProducto] = useState("")
    const [cantidad, setCantidad] = useState("1")
    const [precioUnitario, setPrecioUnitario] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (type === "gasto") {
                await createManualGasto({
                    localId,
                    fecha,
                    concepto,
                    monto: Number(monto)
                })
                toast.success("Gasto registrado correctamente")
            } else {
                await createManualVenta({
                    localId,
                    fecha,
                    producto,
                    cantidad: Number(cantidad),
                    precioUnitario: Number(precioUnitario)
                })
                toast.success("Venta registrada correctamente")
            }
            setOpen(false)
            resetForm()
        } catch (error: any) {
            toast.error(error.message || "Error al registrar el movimiento")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setConcepto("")
        setMonto("")
        setProducto("")
        setCantidad("1")
        setPrecioUnitario("")
        setFecha(new Date())
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full bg-brand-croissant hover:bg-brand-croissant/90 shadow-lg gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Carga
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Carga Manual</DialogTitle>
                    <DialogDescription>
                        Registrá una venta o un gasto manualmente.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex bg-secondary/50 p-1 rounded-2xl mb-4 border border-border/40">
                    <Button
                        variant={type === "venta" ? "default" : "ghost"}
                        className={cn("flex-1 rounded-xl h-10 transition-all", type === "venta" ? "bg-emerald-500 hover:bg-emerald-600 shadow-md text-white" : "text-muted-foreground")}
                        onClick={() => setType("venta")}
                    >
                        Ingreso (Venta)
                    </Button>
                    <Button
                        variant={type === "gasto" ? "default" : "ghost"}
                        className={cn("flex-1 rounded-xl h-10 transition-all", type === "gasto" ? "bg-rose-500 hover:bg-rose-600 shadow-md text-white" : "text-muted-foreground")}
                        onClick={() => setType("gasto")}
                    >
                        Egreso (Gasto)
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {!userLocalId && locales.length > 1 && (
                        <div className="space-y-2">
                            <Label htmlFor="local">Local</Label>
                            <select
                                id="local"
                                className="w-full h-10 rounded-xl bg-background border border-input px-3 py-1 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
                                value={localId}
                                onChange={(e) => setLocalId(e.target.value)}
                            >
                                {locales.map(l => (
                                    <option key={l.id} value={l.id}>{l.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Fecha</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full h-12 justify-start text-left font-normal rounded-xl border-border/40 bg-secondary/20",
                                        !fecha && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                    {fecha ? format(fecha, "PPP", { locale: es }) : <span>Seleccioná una fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start">
                                <Calendar
                                    mode="single"
                                    selected={fecha}
                                    onSelect={(d) => d && setFecha(d)}
                                    initialFocus
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {type === "venta" ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="producto">Producto / Concepto</Label>
                                <Input id="producto" placeholder="Ej: Pan Galleta" value={producto} onChange={e => setProducto(e.target.value)} required className="rounded-xl h-12 border-border/40 bg-secondary/20" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cantidad">Cantidad</Label>
                                    <Input id="cantidad" type="number" step="0.01" value={cantidad} onChange={e => setCantidad(e.target.value)} required className="rounded-xl h-12 border-border/40 bg-secondary/20" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="precio">Precio Unit.</Label>
                                    <Input id="precio" type="number" step="0.01" value={precioUnitario} onChange={e => setPrecioUnitario(e.target.value)} required className="rounded-xl h-12 border-border/40 bg-secondary/20" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="concepto">Concepto del Gasto</Label>
                                <Input id="concepto" placeholder="Ej: Harina / Leña / Luz" value={concepto} onChange={e => setConcepto(e.target.value)} required className="rounded-xl h-12 border-border/40 bg-secondary/20" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="monto">Monto Total</Label>
                                <Input id="monto" type="number" step="0.01" value={monto} onChange={e => setMonto(e.target.value)} required className="rounded-xl h-12 border-border/40 bg-secondary/20" />
                            </div>
                        </>
                    )}

                    <DialogFooter className="pt-4 flex-row gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl flex-1 border border-border/40">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className={cn("rounded-xl flex-1", type === "venta" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600")}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Registrar {type === "venta" ? "Venta" : "Gasto"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
