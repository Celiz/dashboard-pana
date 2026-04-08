"use client"

import { useMemo } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Store, Receipt, TrendingUp, DollarSign, Settings2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Local, TicketDiario } from "@/app/page"
import { PhoneManager } from "./PhoneManager"
import { DateFilter } from "./DateFilter"

interface DashboardClientProps {
    locales: Local[]
    tickets: TicketDiario[]
    userLocalId?: string
}

export function DashboardClient({ locales, tickets, userLocalId }: DashboardClientProps) {
    // Cálculos derivados
    const stats = useMemo(() => {
        let totalRevenue = 0
        let totalItems = 0

        tickets.forEach(ticket => {
            ticket.items.forEach(item => {
                totalRevenue += item.subtotal
                totalItems += item.cantidad
            })
        })

        return {
            revenue: totalRevenue,
            ticketsCount: tickets.length,
            itemsCount: totalItems,
        }
    }, [tickets])

    const chartData = useMemo(() => {
        const revenueByLocal = locales.map(local => {
            const localTickets = tickets.filter(t => t.localId === local.id)
            const revenue = localTickets.reduce((acc, t) => {
                return acc + t.items.reduce((sum, item) => sum + item.subtotal, 0)
            }, 0)

            return {
                name: local.nombre,
                revenue
            }
        })

        return revenueByLocal.sort((a, b) => b.revenue - a.revenue)
    }, [locales, tickets])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
        }).format(value)
    }

    return (
        <div className="space-y-6">
            <DateFilter />
            {/* Resumen General */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Ingresos Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-brand-croissant" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif text-foreground mt-2">{formatCurrency(stats.revenue)}</div>
                        <p className="text-xs text-muted-foreground mt-4 font-medium">
                            Ventas acumuladas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Tickets Procesados</CardTitle>
                        <Receipt className="h-4 w-4 text-brand-matcha" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif text-foreground mt-2">+{stats.ticketsCount}</div>
                        <p className="text-xs text-muted-foreground mt-4 font-medium">
                            Generados por el bot
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Locales Activos</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif text-foreground mt-2">{locales.length}</div>
                        <p className="text-xs text-muted-foreground mt-4 font-medium">
                            Puntos de venta registrados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Productos Vendidos</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif text-foreground mt-2">{stats.itemsCount}</div>
                        <p className="text-xs text-muted-foreground mt-4 font-medium">
                            Unidades despachadas
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Gráfico principal */}
                <Card className="col-span-1 lg:col-span-4 rounded-3xl">
                    <CardHeader className="pt-8 px-8">
                        <CardTitle className="font-serif text-2xl">Ventas por Local</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Comparativa de ingresos generados entre sucursales
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] px-8 pb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 0, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10 dark:opacity-5" />
                                <XAxis
                                    dataKey="name"
                                    stroke="currentColor"
                                    className="opacity-60 text-xs font-semibold"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="currentColor"
                                    className="opacity-60 text-xs font-semibold"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--color-brand-croissant)', opacity: 0.05 }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--card-foreground)', fontSize: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                                    formatter={(value: any) => [formatCurrency(value), "Ingresos"]}
                                />
                                <Bar
                                    dataKey="revenue"
                                    radius={[6, 6, 0, 0]}
                                    className="fill-brand-croissant"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Listado de Locales */}
                <Card className="col-span-1 lg:col-span-3 rounded-3xl flex flex-col">
                    <CardHeader className="pt-8 px-8">
                        <CardTitle className="font-serif text-2xl">Directorio de Locales</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Información de contacto de las sucursales
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 flex-1">
                        <div className="space-y-6">
                            {locales.map(local => (
                                <div key={local.id} className="group flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-border hover:bg-secondary/50 transition-all">
                                    <div className="flex items-center space-x-5">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-latte dark:bg-brand-cocoa text-foreground border border-border group-hover:scale-105 transition-transform duration-300">
                                            <Store className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-base font-serif font-medium leading-none">{local.nombre}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {local.telefonos.length > 0 ? (
                                                    local.telefonos.map(t => (
                                                        <span key={t.id} className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-latte border border-border">
                                                            +{t.numero}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Sin números</span>
                                                )}
                                                {(userLocalId === undefined || userLocalId === local.id) && (
                                                    <PhoneManager local={local} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-serif text-lg font-medium tracking-tight">
                                        {formatCurrency(chartData.find(c => c.name === local.nombre)?.revenue || 0)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
