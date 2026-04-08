"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

export async function addTelefono(localId: string, numero: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("No autorizado")

  // Si tiene localId, debe coincidir con el localId proporcionado. Si es null, es admin.
  const isUserLocal = session.user.localId === localId
  const isAdmin = !session.user.localId

  if (!isAdmin && !isUserLocal) {
    throw new Error("No tienes permiso para agregar números a este local.")
  }

  // Limpiar el número de espacios y caracteres extra
  const cleanNumero = numero.replace(/\D/g, "")

  if (!cleanNumero) {
    throw new Error("El número no es válido.")
  }

  await prisma.telefonoLocal.create({
    data: { 
      localId, 
      numero: cleanNumero 
    }
  })

  revalidatePath("/")
}

export async function removeTelefono(telefonoId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("No autorizado")

  const tel = await prisma.telefonoLocal.findUnique({
    where: { id: telefonoId }
  })

  if (!tel) throw new Error("Teléfono no encontrado")

  const isUserLocal = session.user.localId === tel.localId
  const isAdmin = !session.user.localId

  if (!isAdmin && !isUserLocal) {
    throw new Error("No tienes permiso para eliminar este número.")
  }

  await prisma.telefonoLocal.delete({
    where: { id: telefonoId }
  })

  revalidatePath("/")
}
