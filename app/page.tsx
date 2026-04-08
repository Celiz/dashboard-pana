import { DashboardClient } from "../components/DashboardClient"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/LogoutButton"
export type Local = { id: string; nombre: string; telefonos: string[] };
export type VentaItem = { id: string; producto: string; cantidad: number; precioUnitario: number; subtotal: number };
export type TicketDiario = { id: string; localId: string; fecha: string; estado: string; items: VentaItem[] };

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  // Si el usuario no tiene un localId asignado (ej un admin maestro), mostramos todos, sino filtramos
  const localFilter = session.user.localId ? { id: session.user.localId } : {};
  const ticketFilter = session.user.localId ? { localId: session.user.localId } : {};

  const dbLocales = await prisma.local.findMany({ 
    where: localFilter,
    include: { telefonos: true } 
  })
  const dbTickets = await prisma.ticketDiario.findMany({ 
    where: ticketFilter,
    include: { items: true } 
  })

  // Format data for Client Component (converting Dates to strings and Decimals to numbers)
  const locales: Local[] = dbLocales.map((local: any) => ({
    id: local.id,
    nombre: local.nombre,
    telefonos: local.telefonos.map((t: any) => t.numero),
  }))

  const tickets: TicketDiario[] = dbTickets.map((ticket: any) => ({
    id: ticket.id,
    localId: ticket.localId,
    fecha: ticket.fecha.toISOString(),
    estado: ticket.estado,
    items: ticket.items.map((item: any) => ({
      id: item.id,
      producto: item.producto,
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precioUnitario),
      subtotal: Number(item.subtotal),
    }))
  }))

  return (
    <div className="min-h-screen relative z-10 selection:bg-brand-croissant selection:text-white">
      <main className="container mx-auto p-4 md:p-8 lg:p-12 max-w-7xl">
        <header className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-foreground tracking-tight drop-shadow-sm">Dashboard Panaderías</h1>
            <p className="text-muted-foreground mt-3 font-medium sm:text-lg">Resumen mensual de ventas e ingresos por local.</p>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="/ventas" 
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-brand-croissant text-white hover:bg-brand-croissant/90 transition-colors font-medium shadow-sm"
            >
              Ver Todas las Ventas
            </a>
            <LogoutButton />
          </div>
        </header>

        <DashboardClient locales={locales} tickets={tickets} />
      </main>
    </div>
  )
}
