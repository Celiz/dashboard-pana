import { VentasListClient } from "@/components/VentasListClient"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function VentasPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/login")
  }

  // Filtrar por localId si no es administrador maestro
  const ticketFilter = session.user.localId ? { localId: session.user.localId } : {}

  // Obtener tickets recientes usando prisma (limitado a 100 para no saturar inicial)
  const dbTickets = await prisma.ticketDiario.findMany({
    where: ticketFilter,
    include: { 
      items: true,
      local: true 
    },
    orderBy: {
      fecha: 'desc'
    },
    take: 100
  })

  // Format data for Client Component
  const ticketsData = dbTickets.map((ticket: any) => {
    // Calcular total y cantidad de ítems
    let total = 0
    let itemsCount = 0
    ticket.items.forEach((item: any) => {
      total += Number(item.subtotal)
      itemsCount += Number(item.cantidad)
    })

    return {
      id: ticket.id,
      localName: ticket.local.nombre,
      date: ticket.fecha.toISOString(),
      status: ticket.estado,
      total,
      itemsCount
    }
  })

  return (
    <div className="min-h-screen relative z-10 selection:bg-brand-croissant selection:text-white pb-20">
      <main className="container mx-auto p-4 md:p-8 lg:p-12 max-w-7xl">
        <VentasListClient tickets={ticketsData} />
      </main>
    </div>
  )
}
