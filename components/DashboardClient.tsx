"use client"

import { useMemo } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Store, Receipt, TrendingUp, DollarSign, ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Local, TicketDiario, Gasto } from "@/app/page"
import { PhoneManager } from "./PhoneManager"
import { DateFilter } from "./DateFilter"
import { ManualEntry } from "./ManualEntry"

interface DashboardClientProps {
    locales: Local[]
    tickets: TicketDiario[]
    gastos: Gasto[]
    userLocalId?: string
}

export function DashboardClient({ locales, tickets, gastos, userLocalId }: DashboardClientProps) {
    // Cálculos derivados
    const stats = useMemo(() => {
        let totalRevenue = 0
        let totalItems = 0
        let totalExpenses = 0

        tickets.forEach(ticket => {
            ticket.items.forEach(item => {
                totalRevenue += item.subtotal
                totalItems += item.cantidad
            })
        })

        gastos.forEach(gasto => {
            totalExpenses += gasto.monto
        })

        return {
            revenue: totalRevenue,
            expenses: totalExpenses,
            netIncome: totalRevenue - totalExpenses,
            ticketsCount: tickets.length,
            itemsCount: totalItems,
        }
    }, [tickets, gastos])

    const chartData = useMemo(() => {
        const dataByLocal = locales.map(local => {
            const localTickets = tickets.filter(t => t.localId === local.id)
            const revenue = localTickets.reduce((acc, t) => {
                return acc + t.items.reduce((sum, item) => sum + item.subtotal, 0)
            }, 0)

            const localGastos = gastos.filter(g => g.localId === local.id)
            const expenses = localGastos.reduce((acc, g) => acc + g.monto, 0)

            return {
                name: local.nombre,
                revenue,
                expenses,
                net: revenue - expenses
            }
        })

        return dataByLocal.sort((a, b) => b.revenue - a.revenue)
    }, [locales, tickets, gastos])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
        }).format(value)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <DateFilter />
                </div>
                <div className="flex items-center gap-3">
                    <ManualEntry locales={locales} userLocalId={userLocalId} />
                </div>
            </div>
            {/* Resumen General */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Ingresos Brutos</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif text-foreground mt-2">{formatCurrency(stats.revenue)}</div>
                        <p className="text-xs text-muted-foreground mt-4 font-medium">
                            Total de ventas realizadas
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-rose-600 dark:text-rose-400">Gastos Totales</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif text-foreground mt-2">{formatCurrency(stats.expenses)}</div>
                        <p className="text-xs text-muted-foreground mt-4 font-medium">
                            Salidas de dinero registradas
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-brand-croissant/5 dark:bg-brand-croissant/10 border-brand-croissant/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-brand-croissant">Ingreso Neto</CardTitle>
                        <Wallet className="h-4 w-4 text-brand-croissant" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif text-foreground mt-2">{formatCurrency(stats.netIncome)}</div>
                        <p className="text-xs text-muted-foreground mt-4 font-medium">
                            Ganancia real del periodo
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
                                    formatter={(value: any, name: any) => {
                                        const label = name === 'revenue' ? 'Ingresos' : name === 'expenses' ? 'Gastos' : 'Neto'
                                        return [formatCurrency(Number(value)), label]
                                    }}
                                />
                                <Bar
                                    dataKey="revenue"
                                    name="revenue"
                                    radius={[4, 4, 0, 0]}
                                    fill="#10b981"
                                />
                                <Bar
                                    dataKey="expenses"
                                    name="expenses"
                                    radius={[4, 4, 0, 0]}
                                    fill="#ef4444"
                                />
                                <Bar
                                    dataKey="net"
                                    name="net"
                                    radius={[4, 4, 0, 0]}
                                    fill="var(--brand-croissant)"
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
                                    <div className="text-right">
                                        <div className="font-serif text-lg font-medium tracking-tight text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(chartData.find(c => c.name === local.nombre)?.revenue || 0)}
                                        </div>
                                        <div className="text-xs font-medium text-rose-500">
                                            -{formatCurrency(chartData.find(c => c.name === local.nombre)?.expenses || 0)}
                                        </div>
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
