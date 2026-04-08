// app/api/webhook/kapso/route.ts
import { NextRequest, NextResponse, after } from "next/server";
import { normalizeWebhook, verifySignature } from "@kapso/whatsapp-cloud-api/server";
import { sendKapsoText, downloadKapsoMedia, markKapsoMessageReadWithTyping } from "@/lib/kapso";
import prisma from "@/lib/prisma"; // Asegurate de ajustar esta ruta a donde tengas tu Prisma Client
import { GoogleGenAI } from "@google/genai";

// Inicializamos el cliente de la nueva SDK de Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
    const bodyText = await req.text();
    const signatureHeader = req.headers.get("x-hub-signature-256") || req.headers.get("x-kapso-signature-256") || "";

    // 1. Verificación HMac del Webhook (Lo dejamos igual, está perfecto)
    const secret = process.env.KAPSO_WEBHOOK_SECRET || process.env.KAPSO_API_KEY;
    if (secret && signatureHeader) {
        const isValid = verifySignature({
            appSecret: secret,
            rawBody: bodyText,
            signatureHeader,
        });

        if (!isValid) {
            console.warn("[webhook] Kapso: Firma inválida detectada");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    let payload: any;
    try {
        payload = JSON.parse(bodyText);
    } catch {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Devolvemos 200 INMEDIATAMENTE y procesamos la IA de fondo. 
    // Usamos after() de Next.js que es seguro para entornos Serverless como Vercel.
    after(async () => {
        try {
            // Manejo de la estructura de Kapso
            if (payload.type === "whatsapp.message.received" && Array.isArray(payload.data)) {
                for (const item of payload.data) {
                    if (item.message) {
                        await handleKapsoMessage(item.message);
                    }
                }
            } else {
                const events = normalizeWebhook(payload);
                for (const msg of events.messages) {
                    await handleKapsoMessage(msg);
                }
            }
        } catch (err) {
            console.error("[webhook] Error procesando evento de Kapso de fondo:", err);
        }
    });

    return NextResponse.json({ received: true }, { status: 200 });
}

async function handleKapsoMessage(incomingMsg: any) {
    const senderPhone = incomingMsg.from;

    // 1. Validar que el remitente sea uno de nuestros locales (Tu novia o tu abuelo)
    // Normalizamos el número por las dudas (como hacías con el cleanSender)
    const cleanSender = senderPhone.replace(/\D/g, '');

    const local = await prisma.local.findFirst({
        where: {
            telefonos: {
                some: {
                    numero: { endsWith: cleanSender.substring(cleanSender.length - 10) }
                }
            }
        }
    });

    if (!local) {
        // Si te escribe alguien que no está en la BD, lo ignoramos o le avisamos
        console.log(`Mensaje ignorado de ${senderPhone} - No es un local registrado.`);
        return;
    }

    // 2. Si mandan un texto cualquiera, les recordamos qué hacer
    if (incomingMsg.type === "text") {
        await sendKapsoText(
            senderPhone,
            `Hola ${local.nombre}! 👋 Por favor, mandame una foto de la hoja de ventas del día para procesarla.`
        );
        return;
    }

    // 3. Si mandan algo que NO es una imagen, cortamos
    if (incomingMsg.type !== "image" || !incomingMsg.image?.id) {
        await sendKapsoText(senderPhone, "⚠️ Solo puedo leer fotos. Por favor, sacale una foto a la hoja y mandala.");
        return;
    }

    // Avisamos que estamos en proceso para que no se desesperen
    await sendKapsoText(senderPhone, "⏳ Foto recibida. Leyendo los productos, dame un segundito...");

    try {
        // Mostramos "escribiendo..." en el chat durante el procesamiento (hasta 25s)
        if (incomingMsg.id) {
            await markKapsoMessageReadWithTyping(incomingMsg.id).catch(e => console.error("[webhook] Error al setear typing indicator:", e));
        }

        // 4. Descargar la imagen desde Kapso
        const imageBuffer = await downloadKapsoMedia(incomingMsg.image.id);
        const mimeType = incomingMsg.image.mime_type || "image/jpeg";

        // 5. Armar el Prompt para Gemini
        const prompt = `
  Sos un asistente automatizado para una panadería. Analizá esta imagen que contiene el registro de ventas y gastos del día escrito a mano.
  
  Buscamos extraer tres tipos de información:
  1. Ventas (Ingresos): Productos y sus precios, o montos finales de venta.
  2. Gastos (Salidas/Egresos): Conceptos como "Leña", "Harina", "Luz", "Sueldos" con sus montos. A veces anotados con signo menos o en una columna de "Salida".
  3. Fecha: Buscá si hay una fecha escrita en el papel (ej: "07/04/24" o "Lunes 7").

  Devolveme ÚNICAMENTE un objeto JSON válido con la siguiente estructura, sin markdown ni texto adicional:
  {
    "fecha": "YYYY-MM-DD or null if not found",
    "ventas": [
      {
        "producto": "string",
        "cantidad": numero,
        "precioUnitario": numero,
        "subtotal": numero
      }
    ],
    "gastos": [
      {
        "concepto": "string",
        "monto": numero
      }
    ]
  }
  
  Reglas vitales:
  - Para la fecha, usa el año actual (2026) si no se especifica. El formato DEBE ser YYYY-MM-DD.
  - Si una línea parece un gasto (ej: "Harina 5000" en columna de salida o con signo menos), ponelo en "gastos".
  - Si en la imagen SOLO hay montos sueltos sin nombre de producto, poné "Venta General" en el campo producto de "ventas".
  - Si no encontrás una fecha, poné null en el campo "fecha".
`;

        // 6. Consultar a la IA (Usamos flash porque es rápido y barato)
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: imageBuffer.toString("base64"),
                        mimeType: mimeType
                    }
                }
            ],
            config: {
                // Le forzamos a que devuelva un JSON limpio
                responseMimeType: "application/json",
            }
        });

        const jsonText = response.text || "{}";
        const extraido = JSON.parse(jsonText);

        const ventas = extraido.ventas || [];
        const gastos = extraido.gastos || [];
        
        // Manejo de fecha con Zona Horaria de Argentina (GMT-3)
        let fechaDetectada: Date;
        if (extraido.fecha && typeof extraido.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(extraido.fecha)) {
            // Si viene YYYY-MM-DD, le forzamos 12:00 en Argentina para evitar saltos de día por horas
            fechaDetectada = new Date(`${extraido.fecha}T12:00:00-03:00`);
        } else {
            // Si no detecta, usamos el "ahora" en Argentina
            const ahora = new Date();
            // Ajustamos a mediodía local para consistencia si es una creación nueva
            fechaDetectada = ahora;
        }

        if (ventas.length === 0 && gastos.length === 0) {
            throw new Error("La IA no detectó ni ventas ni gastos");
        }

        // 7. Guardar en Prisma
        let totalVentas = 0;
        let totalGastos = 0;

        // Guardar Ticket de Ventas si hay
        if (ventas.length > 0) {
            await prisma.ticketDiario.create({
                data: {
                    localId: local.id,
                    fecha: fechaDetectada,
                    estado: "procesado",
                    items: {
                        create: ventas.map((item: any) => {
                            totalVentas += Number(item.subtotal);
                            return {
                                producto: item.producto,
                                cantidad: Number(item.cantidad),
                                precioUnitario: Number(item.precioUnitario),
                                subtotal: Number(item.subtotal)
                            };
                        })
                    }
                }
            });
        }

        // Guardar Gastos si hay
        if (gastos.length > 0) {
            for (const gasto of gastos) {
                totalGastos += Number(gasto.monto);
                await prisma.gasto.create({
                    data: {
                        localId: local.id,
                        fecha: fechaDetectada,
                        concepto: gasto.concepto,
                        monto: Number(gasto.monto)
                    }
                });
            }
        }

        // 8. Confirmación final por WhatsApp
        let mensajeConfirmacion = `✅ ¡Procesado correctamente!`;
        if (ventas.length > 0) mensajeConfirmacion += `\n💰 Ventas: $${totalVentas.toFixed(2)} (${ventas.length} ítems).`;
        if (gastos.length > 0) mensajeConfirmacion += `\n💸 Gastos: $${totalGastos.toFixed(2)} (${gastos.length} conceptos).`;
        mensajeConfirmacion += `\n📈 Neto: $${(totalVentas - totalGastos).toFixed(2)}.`;
        mensajeConfirmacion += `\n📅 Fecha: ${fechaDetectada.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}.`;

        await sendKapsoText(senderPhone, mensajeConfirmacion);
        console.log(`✅ Ticket procesado para ${local.nombre}`);

    } catch (error) {
        console.error("Error procesando imagen/IA:", error);
        await sendKapsoText(
            senderPhone,
            "❌ Hubo un problema leyendo la foto o guardando los datos. ¿Podrías sacar la foto con un poco más de luz y mandarla de nuevo?"
        );
    }
}

// GET para el webhook verification de Meta (Igual que antes)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === process.env.KAPSO_WEBHOOK_VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
}