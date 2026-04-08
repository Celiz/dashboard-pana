// app/api/webhook/kapso/route.ts
import { NextRequest, NextResponse, after } from "next/server";
import { normalizeWebhook, verifySignature } from "@kapso/whatsapp-cloud-api/server";
import { sendKapsoText, downloadKapsoMedia, markKapsoMessageReadWithTyping, createTimer } from "@/lib/kapso";
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
        const totalTimer = createTimer();
        console.log("[webhook] Kapso: Iniciando procesamiento de fondo...");

        try {
            let messagesToProcess: any[] = [];

            // Manejo de la estructura de Kapso
            if (payload.type === "whatsapp.message.received" && Array.isArray(payload.data)) {
                messagesToProcess = payload.data.filter((item: any) => item.message).map((item: any) => item.message);
            } else {
                const events = normalizeWebhook(payload);
                messagesToProcess = events.messages;
            }

            if (messagesToProcess.length > 0) {
                console.log(`[webhook] Kapso: Procesando ${messagesToProcess.length} mensajes en paralelo...`);
                // PROCESAMIENTO EN PARALELO 🚀
                await Promise.all(messagesToProcess.map(msg => handleKapsoMessage(msg)));
            }
        } catch (err) {
            console.error("[webhook] Error procesando evento de Kapso de fondo:", err);
        } finally {
            console.log(`[webhook] Kapso: Procesamiento total completado en ${totalTimer.stop()}`);
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
        const downloadTimer = createTimer();
        const imageBuffer = await downloadKapsoMedia(incomingMsg.image.id);
        const mimeType = incomingMsg.image.mime_type || "image/jpeg";
        console.log(`[webhook] Media descargada (${(imageBuffer.length / 1024).toFixed(2)} KB) en ${downloadTimer.stop()}`);

        // 5. Armar el Prompt para Gemini
        const prompt = `
  Sos un asistente automatizado para una panadería. Analizá esta imagen que contiene el registro de ventas y gastos escritos a mano en un cuaderno.
  
  Estructura del Cuaderno:
  El cuaderno sigue un patrón de tres columnas verticales (aunque no siempre tengan títulos explícitos):
  [Concepto / Producto] | [Ingreso (Ventas)] | [Egreso (Gastos/Salidas)]

  Note que una sola hoja puede contener registros de VARIOS DÍAS (ej: Lunes 09, Martes 10) o de un solo día.
  
  Extraé la información agrupada por fecha. Si hay varios días en una sola hoja, separalos claramente.
  
  Reglas de Extracción Basadas en Columnas:
  1. Concepto (Columna Izquierda): Es el nombre del producto vendido o el motivo del gasto.
  2. Columna del Medio (Ingreso): Todo monto ubicado en esta columna debe ser clasificado como VENTA.
  3. Columna Derecha (Egreso): Todo monto ubicado en esta columna debe ser clasificado como GASTO.

  Devolveme ÚNICAMENTE un objeto JSON válido con la siguiente estructura (un array de reportes), sin markdown ni texto adicional:
  {
    "reportes": [
      {
        "fecha": "YYYY-MM-DD or null if not found",
        "ventas": [
          {
            "producto": "string (nombre del concepto)",
            "cantidad": numero (1 si no se especifica),
            "precioUnitario": numero (monto en col. medio),
            "subtotal": numero (monto en col. medio)
          }
        ],
        "gastos": [
          {
            "concepto": "string (nombre del concepto)",
            "monto": numero (monto en col. derecha)
          }
        ]
      }
    ]
  }
  
  Reglas vitales:
  - Para la fecha, usa el año actual (2026) si no se especifica. El formato DEBE ser YYYY-MM-DD.
  - El criterio principal es la POSICIÓN: si el monto está a la derecha, es GASTO. Si está al medio, es VENTA.
  - Si en la imagen SOLO hay montos al medio sin nombre de producto, poné "Venta General" en el campo producto de "ventas".
  - Si no encontrás una fecha para un bloque de información, poné null en el campo "fecha".
`;

        // 6. Consultar a la IA (Usamos flash porque es rápido y barato)
        const aiTimer = createTimer();
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
        console.log(`[webhook] Gemini procesó la imagen en ${aiTimer.stop()}`);

        const reportes = extraido.reportes || [];
        
        if (reportes.length === 0) {
            throw new Error("La IA no detectó ni ventas ni gastos en ningún reporte");
        }

        const resumenResultados = [];

        // 7. Procesar cada reporte encontrado (soporte para múltiples fechas por foto)
        for (const reporte of reportes) {
            const ventas = reporte.ventas || [];
            const gastos = reporte.gastos || [];
            
            if (ventas.length === 0 && gastos.length === 0) continue;

            // Manejo de fecha con Zona Horaria de Argentina (GMT-3)
            let fechaDetectada: Date;
            if (reporte.fecha && typeof reporte.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(reporte.fecha)) {
                // Si viene YYYY-MM-DD, le forzamos 12:00 en Argentina para evitar saltos de día por horas
                fechaDetectada = new Date(`${reporte.fecha}T12:00:00-03:00`);
            } else {
                // Si no detecta, usamos el "ahora" en Argentina (o podrías intentar heredar la fecha del reporte anterior si esto es una lista)
                fechaDetectada = new Date();
            }

            let totalVentasDia = 0;
            let totalGastosDia = 0;

            // Guardar en Prisma dentro de una transacción por cada día
            await prisma.$transaction(async (tx) => {
                // Guardar Ticket de Ventas si hay
                if (ventas.length > 0) {
                    await tx.ticketDiario.create({
                        data: {
                            localId: local.id,
                            fecha: fechaDetectada,
                            estado: "procesado",
                            items: {
                                create: ventas.map((item: any) => {
                                    totalVentasDia += Number(item.subtotal);
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
                    const gastosData = gastos.map((gasto: any) => {
                        totalGastosDia += Number(gasto.monto);
                        return {
                            localId: local.id,
                            fecha: fechaDetectada,
                            concepto: gasto.concepto,
                            monto: Number(gasto.monto)
                        };
                    });
                    await tx.gasto.createMany({ data: gastosData });
                }
            });

            resumenResultados.push({
                fecha: fechaDetectada,
                ventas: totalVentasDia,
                gastos: totalGastosDia
            });
        }

        if (resumenResultados.length === 0) {
            throw new Error("No se procesaron datos válidos de los reportes");
        }

        // 8. Confirmación final por WhatsApp resumida
        let mensajeConfirmacion = `✅ ¡Procesado correctamente!`;
        
        if (resumenResultados.length > 1) {
            mensajeConfirmacion += `\nDetecté ${resumenResultados.length} días en la hoja:`;
        }

        for (const res of resumenResultados) {
            const fechaStr = res.fecha.toLocaleDateString('es-AR', { 
                timeZone: 'America/Argentina/Buenos_Aires',
                day: '2-digit',
                month: '2-digit'
            });
            
            mensajeConfirmacion += `\n\n📅 *Día ${fechaStr}*`;
            if (res.ventas > 0) mensajeConfirmacion += `\n💰 Ventas: $${res.ventas.toLocaleString('es-AR')}`;
            if (res.gastos > 0) mensajeConfirmacion += `\n💸 Gastos: $${res.gastos.toLocaleString('es-AR')}`;
            mensajeConfirmacion += `\n📈 Neto: $${(res.ventas - res.gastos).toLocaleString('es-AR')}`;
        }

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