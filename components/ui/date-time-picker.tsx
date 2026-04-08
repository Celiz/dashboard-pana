"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  date: Date
  onChange: (date: Date) => void
}

export function DateTimePicker({ date, onChange }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  
  // Update internal state if prop changes
  React.useEffect(() => {
    setSelectedDate(date)
  }, [date])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return
    
    // Preserve current time
    const updatedDate = new Date(newDate)
    updatedDate.setHours(selectedDate?.getHours() || 0)
    updatedDate.setMinutes(selectedDate?.getMinutes() || 0)
    
    setSelectedDate(updatedDate)
    onChange(updatedDate)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":").map(Number)
    const updatedDate = new Date(selectedDate || new Date())
    updatedDate.setHours(hours)
    updatedDate.setMinutes(minutes)
    
    setSelectedDate(updatedDate)
    onChange(updatedDate)
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal border-brand-croissant/20 bg-background/50 hover:bg-brand-croissant/5 transition-all rounded-xl",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-brand-croissant" />
            {selectedDate ? (
              format(selectedDate, "PPP", { locale: es })
            ) : (
              <span>Seleccionar fecha</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-brand-croissant/10" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-croissant">
          <Clock className="h-4 w-4" />
        </div>
        <input
          type="time"
          className="w-full bg-background/50 border border-brand-croissant/20 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-croissant/20 transition-all font-mono"
          value={selectedDate ? format(selectedDate, "HH:mm") : "00:00"}
          onChange={handleTimeChange}
        />
      </div>
    </div>
  )
}
