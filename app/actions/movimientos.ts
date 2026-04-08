"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

async function checkLocalPermission(localId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("No autorizado")

  const isAdmin = !session.user.localId
  const isUserLocal = session.user.localId === localId

  if (!isAdmin && !isUserLocal) {
    throw new Error("No tienes permiso para realizar esta acción.")
  }

  return { session, isAdmin, isUserLocal }
}

export async function createManualGasto(data: { localId: string, fecha: Date, concepto: string, monto: number }) {
  await checkLocalPermission(data.localId)

  await prisma.gasto.create({
    data: {
      localId: data.localId,
      fecha: data.fecha,
      concepto: data.concepto,
      monto: data.monto
    }
  })

  revalidatePath("/")
  revalidatePath("/ventas")
}

export async function createManualVenta(data: { localId: string, fecha: Date, producto: string, cantidad: number, precioUnitario: number }) {
  await checkLocalPermission(data.localId)

  await prisma.ticketDiario.create({
    data: {
      localId: data.localId,
      fecha: data.fecha,
      estado: "manual",
      items: {
        create: {
          producto: data.producto,
          cantidad: data.cantidad,
          precioUnitario: data.precioUnitario,
          subtotal: data.cantidad * data.precioUnitario
        }
      }
    }
  })

  revalidatePath("/")
  revalidatePath("/ventas")
}

export async function updateGasto(id: string, data: { fecha?: Date, concepto?: string, monto?: number }) {
  const gasto = await prisma.gasto.findUnique({ where: { id } })
  if (!gasto) throw new Error("Gasto no encontrado")
  
  await checkLocalPermission(gasto.localId)

  await prisma.gasto.update({
    where: { id },
    data: {
      fecha: data.fecha,
      concepto: data.concepto,
      monto: data.monto
    }
  })

  revalidatePath("/")
  revalidatePath("/gastos")
}

export async function deleteGasto(id: string) {
  const gasto = await prisma.gasto.findUnique({ where: { id } })
  if (!gasto) throw new Error("Gasto no encontrado")
  
  await checkLocalPermission(gasto.localId)

  await prisma.gasto.delete({
    where: { id }
  })

  revalidatePath("/")
  revalidatePath("/gastos")
}
