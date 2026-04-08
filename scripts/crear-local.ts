import prisma from "../lib/prisma";
import { auth } from "../lib/auth";
import readline from "node:readline/promises";

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n========================================");
  console.log("🏢 CREADOR DE SUCURSALES (LOCALES)");
  console.log("========================================\n");

  const nombre = await rl.question("1. Nombre del local (Ej: Panaderia Centro): ");
  let telefono = await rl.question("2. Teléfono receptor de WhatsApp (Ej: 2235555555 o +549223...): ");

  if (!nombre.trim() || !telefono.trim()) {
    console.log("❌ Error: Todos los datos del local son obligatorios.");
    process.exit(1);
  }

  // Normalizamos el telefono para guardar solo números
  telefono = telefono.replace(/\D/g, '');

  console.log(`\n⏳ Generando el local '${nombre}' en la base de datos...`);

  let localGuardado;
  try {
    localGuardado = await prisma.local.create({
      data: {
        nombre: nombre,
        telefonos: {
          create: [{ numero: telefono }]
        }
      }
    });
    console.log("✅ ¡Local registrado exitosamente!");
    console.log(`📌 ID del Local Generado Oculto: ${localGuardado.id}`);
  } catch (error: any) {
    if (error.code === 'P2002') {
        console.error("❌ Error: Ya existe un local cobrando con ese número de WhatsApp.");
    } else {
        console.error("❌ Error guardando el local:", error.message);
    }
    process.exit(1);
  }

  console.log("\n----------------------------------------");
  const crearUsuario = await rl.question("¿Querés crear su usuario de ingreso al Dashboard ahora mismo? (s/N): ");

  if (crearUsuario.toLowerCase() === 's' || crearUsuario.toLowerCase() === 'si') {
    console.log("\n--- GENERANDO ACCESO WEB ---");
    const username = await rl.question("Username para login (Ej: centro): ");
    const password = await rl.question("Contraseña (mínimo 8 caracteres): ");
    
    console.log("⏳ Encriptando accesos...");
    try {
        const dummyEmail = `${username}@panaderia.local`;
        const res = await auth.api.signUpEmail({
            body: {
                email: dummyEmail,
                password: password,
                name: nombre,
                username: username,
                localId: localGuardado.id, 
            },
            asResponse: true
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }

        console.log("\n🎉 ¡ÉXITO TOTAL!");
        console.log(`El local '${nombre}' fue configurado 100%.`);
        console.log(`Ya pueden enviar fotos al ${telefono}`);
        console.log(`Y acceder a su dashboard web logueandose como '${username}'.\n`);

    } catch(err: any) {
       console.error("❌ Hubo un error creando el usuario. Podés intentarlo manualmente más tarde usando el otro script.", err.message);
    }
  } else {
      console.log("\n👍 Entendido. Solo se creó el local. Podés crear usuarios manuales después con bun scripts/crear-usuario.ts");
  }

  rl.close();
  process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
