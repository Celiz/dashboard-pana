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
  Sos un asistente automatizado para una panadería. Analizá esta imagen que contiene el registro de ventas del día escrito a mano.
  
  Puede haber dos escenarios:
  1. Que anoten el producto y el precio (ej: "Pan 2000").
  2. Que anoten SOLAMENTE los números finales de cada venta (ej: "1500", "3000").

  Devolveme ÚNICAMENTE un arreglo JSON válido con la siguiente estructura exacta, sin markdown ni texto adicional:
  [
    {
      "producto": "string",
      "cantidad": numero,
      "precioUnitario": numero,
      "subtotal": numero
    }
  ]
  
  Regla vital: Si en la imagen SOLO hay montos sueltos sin nombre de producto, poné "Venta General" en el campo producto, cantidad 1, y usá el monto leído tanto en precioUnitario como en subtotal.
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

        const jsonText = response.text || "[]";
        const ventasExtraidas = JSON.parse(jsonText);

        if (ventasExtraidas.length === 0) {
            throw new Error("La IA devolvió un array vacío");
        }

        // 7. Guardar en Prisma (Nested write: creamos el ticket y sus items de una)
        let totalDelDia = 0;

        await prisma.ticketDiario.create({
            data: {
                localId: local.id,
                estado: "procesado",
                items: {
                    create: ventasExtraidas.map((item: any) => {
                        totalDelDia += Number(item.subtotal);
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

        // 8. Confirmación final por WhatsApp
        await sendKapsoText(
            senderPhone,
            `✅ ¡Listo! Registré ${ventasExtraidas.length} productos.\nTotal del día: $${totalDelDia.toFixed(2)}.\nYa podés verlo en el dashboard.`
        );
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