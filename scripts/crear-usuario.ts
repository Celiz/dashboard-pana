import { auth } from "../lib/auth";
import readline from "node:readline/promises";

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n==================================");
  console.log("🛠️  CREADOR DE USUARIOS DASHBOARD");
  console.log("==================================\n");

  const name = await rl.question("1. Nombre para mostrar (Ej: Administrador, Tía Marta): ");
  const username = await rl.question("2. Nombre de usuario para login (Ej: marta, admin): ");
  const password = await rl.question("3. Contraseña (mínimo 8 caracteres idealmente): ");
  
  console.log("\n(Importante: Para crear un Administrador General que vea TODOS los datos, dejá esto vacío y pulsá ENTER)");
  const localId = await rl.question("4. Pega el ID del Local aquí o dale ENTER para dejarlo vacío: ");

  console.log("\n⏳ Creando perfil segura en base de datos...");

  try {
    const dummyEmail = `${username}@panaderia.local`;
    
    // Generando via Better Auth para forzar el Hashing y guardado seguro en DB
    const res = await auth.api.signUpEmail({
      body: {
        email: dummyEmail,
        password: password,
        name: name,
        username: username,
        localId: localId.trim() !== "" ? localId.trim() : undefined, 
      },
      asResponse: true
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }

    console.log("\n✅ ¡Éxito absoluto!");
    console.log(`👤 Usuario de login: ${username}`);
    console.log(`🔑 Contraseña hasheada y almacenada con seguridad guardada.`);
    console.log(`🏢 Nivel de Acceso: ${localId.trim() !== "" ? `Asignado al Local ${localId}` : 'ADMINISTRADOR GENERAL MASTER'}`);

  } catch (error: any) {
    if(error.message.includes("already exists")){
       console.log("\n❌ OJO: Este nombre de usuario ya está tomado.");
    } else {
       console.error("\n❌ Error inesperado: ", error.message);
    }
  } finally {
    rl.close();
    process.exit(0);
  }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
