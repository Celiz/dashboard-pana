"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

async function checkTicketPermission(ticketId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("No autorizado")

  const ticket = await prisma.ticketDiario.findUnique({
    where: { id: ticketId },
    select: { localId: true }
  })

  if (!ticket) throw new Error("Ticket no encontrado")

  const isUserLocal = session.user.localId === ticket.localId
  const isAdmin = !session.user.localId

  if (!isAdmin && !isUserLocal) {
    throw new Error("No tienes permiso para modificar esta venta.")
  }

  return { session, isAdmin, isUserLocal }
}

export async function deleteTicket(ticketId: string) {
  await checkTicketPermission(ticketId)

  await prisma.ticketDiario.delete({
    where: { id: ticketId }
  })

  revalidatePath("/ventas")
  revalidatePath("/")
}

export async function updateVentaItem(itemId: string, data: { producto?: string, cantidad?: number, precioUnitario?: number }) {
  const item = await prisma.ventaItem.findUnique({
    where: { id: itemId },
    select: { ticketId: true }
  })

  if (!item) throw new Error("Ítem no encontrado")

  await checkTicketPermission(item.ticketId)

  // Recalcular subtotal si cambian cantidad o precio
  let updateData: any = { ...data }
  
  if (data.cantidad !== undefined || data.precioUnitario !== undefined) {
    // Si uno de los dos no viene, lo buscamos en el ítem actual
    const currentItem = await prisma.ventaItem.findUnique({
      where: { id: itemId }
    })
    
    if (!currentItem) throw new Error("Error interno al recuperar ítem")
    
    const cantidad = data.cantidad !== undefined ? data.cantidad : Number(currentItem.cantidad)
    const precioUnitario = data.precioUnitario !== undefined ? data.precioUnitario : Number(currentItem.precioUnitario)
    
    updateData.subtotal = cantidad * precioUnitario
  }

  await prisma.ventaItem.update({
    where: { id: itemId },
    data: updateData
  })

  revalidatePath(`/ventas/${item.ticketId}`)
  revalidatePath("/ventas")
}

export async function deleteVentaItem(itemId: string) {
  const item = await prisma.ventaItem.findUnique({
    where: { id: itemId },
    select: { ticketId: true }
  })

  if (!item) throw new Error("Ítem no encontrado")

  await checkTicketPermission(item.ticketId)

  await prisma.ventaItem.delete({
    where: { id: itemId }
  })

  revalidatePath(`/ventas/${item.ticketId}`)
  revalidatePath("/ventas")
}
