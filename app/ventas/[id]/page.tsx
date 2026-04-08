import { VentaDetailClient } from "@/components/VentaDetailClient"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function VentaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/login")
  }
  
  const { id } = await params

  // Verify access 
  const localFilter = session.user.localId ? { localId: session.user.localId } : {}

  const ticket = await prisma.ticketDiario.findFirst({
    where: {
      id,
      ...localFilter
    },
    include: {
      items: true,
      local: true
    }
  })

  if (!ticket) {
    notFound()
  }

  const ticketData = {
    id: ticket.id,
    date: ticket.fecha.toISOString(),
    status: ticket.estado,
    localName: ticket.local.nombre,
    items: ticket.items.map((item: any) => ({
      ...item,
      // Pass these directly as numbers since prisma adapter might return instances of Decimal
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precioUnitario),
      subtotal: Number(item.subtotal)
    }))
  }

  return (
    <div className="min-h-screen relative z-10 selection:bg-brand-croissant selection:text-white pb-20">
      <main className="container mx-auto p-4 md:p-8 lg:p-12 max-w-7xl">
        <VentaDetailClient ticket={ticketData} />
      </main>
    </div>
  )
}
