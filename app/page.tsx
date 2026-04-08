import { DashboardClient } from "../components/DashboardClient"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/LogoutButton"
import { startOfMonth, endOfMonth, parseISO } from "date-fns"

export type Telefono = { id: string; numero: string };
export type Local = { id: string; nombre: string; telefonos: Telefono[] };
export type VentaItem = { id: string; producto: string; cantidad: number; precioUnitario: number; subtotal: number };
export type TicketDiario = { id: string; localId: string; fecha: string; estado: string; items: VentaItem[] };
export type Gasto = { id: string; localId: string; fecha: string; concepto: string; monto: number };

export const dynamic = "force-dynamic";

export default async function DashboardPage(props: {
    searchParams: Promise<{ from?: string; to?: string }>
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const { from, to } = await props.searchParams

    // Por defecto, mostrar el mes actual
    const now = new Date()
    const startDate = from ? parseISO(from) : startOfMonth(now)
    const endDate = to ? parseISO(to) : endOfMonth(now)

    // Filtros por local y fecha
    const localFilter = session.user.localId ? { id: session.user.localId } : {};
    const ticketFilter: any = {
        fecha: {
            gte: startDate,
            lte: endDate
        }
    }

    if (session.user.localId) {
        ticketFilter.localId = session.user.localId
    }

    const dbLocales = await prisma.local.findMany({
        where: localFilter,
        include: { telefonos: true }
    })
    const dbTickets = await prisma.ticketDiario.findMany({
        where: ticketFilter,
        include: { items: true }
    })
    const dbGastos = await prisma.gasto.findMany({
        where: ticketFilter, // El filtro de fecha y localId es el mismo
    })

    // Format data for Client Component (converting Dates to strings and Decimals to numbers)
    const locales: Local[] = dbLocales.map((local: any) => ({
        id: local.id,
        nombre: local.nombre,
        telefonos: local.telefonos.map((t: any) => ({
            id: t.id,
            numero: t.numero,
        })),
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

    const gastos: Gasto[] = dbGastos.map((gasto: any) => ({
        id: gasto.id,
        localId: gasto.localId,
        fecha: gasto.fecha.toISOString(),
        concepto: gasto.concepto,
        monto: Number(gasto.monto),
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
                            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-secondary text-secondary-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors font-medium border border-border"
                        >
                            Ver Ventas
                        </a>
                        <a
                            href="/gastos"
                            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-brand-croissant text-white hover:bg-brand-croissant/90 transition-colors font-medium shadow-sm"
                        >
                            Ver Gastos
                        </a>
                        <LogoutButton />
                    </div>
                </header>

                <DashboardClient
                    locales={locales}
                    tickets={tickets}
                    gastos={gastos}
                    userLocalId={session.user.localId || undefined}
                />
            </main>
        </div>
    )
}
