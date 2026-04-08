"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"

export function DateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  const [date, setDate] = useState<DateRange | undefined>(() => {
    const from = fromParam ? parseISO(fromParam) : undefined
    const to = toParam ? parseISO(toParam) : undefined
    
    if (from && isValid(from)) {
      return { from, to: to && isValid(to) ? to : undefined }
    }
    return undefined
  })

  // Actualizar estado local si cambian los params de la URL (ej. por botones de presets)
  useEffect(() => {
    const from = fromParam ? parseISO(fromParam) : undefined
    const to = toParam ? parseISO(toParam) : undefined
    
    if (from && isValid(from)) {
      setDate({ from, to: to && isValid(to) ? to : undefined })
    } else {
      setDate(undefined)
    }
  }, [fromParam, toParam])

  const applyFilter = (range: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (range?.from) {
      params.set("from", format(range.from, "yyyy-MM-dd"))
    } else {
      params.delete("from")
    }
    
    if (range?.to) {
      params.set("to", format(range.to, "yyyy-MM-dd"))
    } else {
      params.delete("to")
    }
    
    router.push(`?${params.toString()}`)
  }

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate)
    // Aplicamos automáticamente si tenemos un rango completo o si se limpia
    if (!newDate || (newDate.from && newDate.to)) {
      applyFilter(newDate)
    }
  }

  const setPreset = (type: "week" | "month") => {
    const now = new Date()
    let start, end
    
    if (type === "week") {
      start = startOfWeek(now, { weekStartsOn: 1 })
      end = endOfWeek(now, { weekStartsOn: 1 })
    } else {
      start = startOfMonth(now)
      end = endOfMonth(now)
    }
    
    const newRange = { from: start, to: end }
    setDate(newRange)
    applyFilter(newRange)
  }

  const clearFilters = () => {
    setDate(undefined)
    router.push(window.location.pathname)
  }

  return (
    <Card className="p-4 bg-card/40 backdrop-blur-md border-border/40 rounded-2xl shadow-sm mb-6 overflow-visible">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-brand-croissant/10 text-brand-croissant">
            <Filter className="h-4 w-4" />
          </div>
          <h3 className="font-serif text-lg">Filtros de Fecha</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-secondary/40 p-1 rounded-xl border border-border/30">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPreset("week")}
              className={`rounded-lg px-4 h-8 text-xs font-medium ${fromParam === format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd") ? 'bg-background shadow-sm' : ''}`}
            >
              Esta Semana
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPreset("month")}
              className={`rounded-lg px-4 h-8 text-xs font-medium ${(fromParam === format(startOfMonth(new Date()), "yyyy-MM-dd")) ? 'bg-background shadow-sm' : ''}`}
            >
              Este Mes
            </Button>
          </div>

          <DatePickerWithRange 
            date={date} 
            onDateChange={handleDateChange} 
          />

          {(fromParam || toParam) && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearFilters}
              className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors border border-border/40"
              title="Limpiar filtros"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
