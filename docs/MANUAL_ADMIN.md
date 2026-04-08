# Manual del Administrador: Dashboard Panaderías

Este documento detalla cómo administrar y gestionar los datos del sistema, incluyendo la creación de nuevos locales (panaderías) y la gestión de usuarios.

## ⚙️ 1. Panel de Administración de Base de Datos (Prisma Studio)

Dado que este proyecto está pensado para un circuito cerrado familiar, el **"Panel de Admin"** oficial para editar datos en bruto (corregir montos, eliminar tickets fallidos, etc.) es **Prisma Studio**.

bunx prisma generate para generar el cliente de prisma

bunx prisma db push para actualizar la base de datos


### ¿Cómo acceder?
1. En tu consola, con el proyecto abierto, ejecutá:
   ```bash
   npx prisma studio
   ```
2. Abrí tu navegador y entrá a `http://localhost:5555`.

### Modificar Tickets o Ventas leídas por la IA
Si el bot de WhatsApp leyó una foto y guardó mal un número:
1. En Prisma Studio abrí la tabla `VentaItem`.
2. Buscá el registro, modificale la cantidad, el precio o el subtotal.
3. Hacé click verde en "Save x changes".

---

## 🏢 2. ¿Cómo agregar un Local / Panadería nueva?

Olvídense de crearlo a mano desde la base de datos para no tener que lidiar con los identificadores. Se armó un comando interactivo que te guía para crear el Local, asignar su teléfono, ¡y de paso generarle un usuario con contraseña listos para entrar al sistema en menos de 10 segundos!

Abrí la consola y ejecutá:
```bash
bun scripts/crear-local.ts
```
La terminal te irá preguntando nombre, teléfono exacto del bot (ideal sin el +54, ej: `2231234567`) y opcionalmente te dejará ahí mismo setearle los datos de acceso al sistema (usuario y contraseña encriptada).

---

## 🧑‍💻 3. Creación de Usuarios (El Sistema de Hasheo)

> ⚠️ ATENCIÓN: Las contraseñas en *Better Auth* están fuertemente encriptadas por seguridad. ¡Nunca crees un usuario manualmente desde Prisma Studio porque si ponés la contraseña en texto normal el sistema no funcionaría! Siempre debes usar los comandos (scripts) que hashean la pass. ⚠️

### Cómo crear una Cuenta para un Local
Abrí una nueva consola de comando en tu proyecto y ejecutá:
```bash
bun scripts/crear-usuario.ts
```
*(Mirá la sección "El Script Interactivo" más abajo para ver cómo funciona).*

### Cómo crear un Perfil de Administrador Maestro (Tu usuario)
El sistema reconoce como **Administrador Supremo** a cualquier persona que **NO tenga vinculado un ID de Local**. 
1. Ejecutá el mismo comando: `bun scripts/crear-usuario.ts`.
2. Cuando el script te pregunte el `localId`, simplemente **dejalo vacío** apretando <ENTER>. 
3. Cuando inicies sesión en el navegador con este usuario, vas a ver los tickets consolidados de ABSOLUTAMENTE TODOS los locales existentes a la vez.

---

## 💡 El Archivo `crear-usuario.ts` (Referencia)
Hemos diseñado un pequeño script de la consola para gestionar todo esto fácilmente. Ver el script en `scripts/crear-usuario.ts`.
