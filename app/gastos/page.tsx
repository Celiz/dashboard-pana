import { GastosListClient } from "@/components/GastosListClient"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { startOfMonth, endOfMonth, parseISO, startOfDay, endOfDay } from "date-fns"

export const dynamic = "force-dynamic"

export default async function GastosPage(props: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/login")
  }

  const { from, to } = await props.searchParams

  // Por defecto, mostrar el mes actual
  const now = new Date()
  const startDate = from ? startOfDay(parseISO(from)) : startOfMonth(now)
  const endDate = to ? endOfDay(parseISO(to)) : endOfMonth(now)

  // Filtrar por localId si no es administrador maestro
  const gastoFilter: any = {
    fecha: {
      gte: startDate,
      lte: endDate,
    }
  }

  if (session.user.localId) {
    gastoFilter.localId = session.user.localId
  }

  // Obtener gastos en el rango de fechas
  const dbGastos = await prisma.gasto.findMany({
    where: gastoFilter,
    include: { 
      local: true 
    },
    orderBy: {
      fecha: 'desc'
    }
  })

  // Format data for Client Component
  const gastosData = dbGastos.map((gasto: any) => ({
    id: gasto.id,
    localId: gasto.localId,
    localName: gasto.local.nombre,
    date: gasto.fecha.toISOString(),
    concepto: gasto.concepto,
    monto: Number(gasto.monto)
  }))

  return (
    <div className="min-h-screen relative z-10 selection:bg-brand-croissant selection:text-white pb-20">
      <main className="container mx-auto p-4 md:p-8 lg:p-12 max-w-7xl">
        <GastosListClient gastos={gastosData} />
      </main>
    </div>
  )
}
