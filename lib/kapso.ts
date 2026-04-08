import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';

const KAPSO_BASE_URL = 'https://api.kapso.ai/meta/whatsapp';

function getKapsoApiKey() {
    const apiKey = process.env.KAPSO_API_KEY;
    if (!apiKey) {
        throw new Error("Falta la variable de entorno KAPSO_API_KEY");
    }
    return apiKey;
}

export function getKapsoPhoneId() {
    const phoneId = process.env.KAPSO_PHONE_ID;
    if (!phoneId) {
        console.warn("Falta la variable de entorno KAPSO_PHONE_ID (requerida para mandar mensajes)");
    }
    return phoneId || "";
}

// Singleton instance del cliente de Kapso
export const kapsoClient = new WhatsAppClient({
    baseUrl: KAPSO_BASE_URL,
    kapsoApiKey: getKapsoApiKey(),
});

/**
 * Envía un mensaje de texto por WhatsApp.
 * Lo vamos a usar para devolver el "✅ Procesado con éxito" a los locales.
 */
export async function sendKapsoText(to: string, text: string) {
    const phoneId = getKapsoPhoneId();
    if (!phoneId) {
        throw new Error("No se puede enviar el mensaje: falta KAPSO_PHONE_ID.");
    }

    return kapsoClient.messages.sendText({
        phoneNumberId: phoneId,
        to,
        body: text
    });
}

/**
 * Marca el mensaje como leído y activa el indicador de "escribiendo..."
 */
export async function markKapsoMessageReadWithTyping(messageId: string) {
    const phoneId = getKapsoPhoneId();
    if (!phoneId) return;

    return kapsoClient.messages.markRead({
        phoneNumberId: phoneId,
        messageId,
        typingIndicator: { type: 'text' }
    });
}

/**
 * NUEVO: Descarga una imagen (o cualquier media) usando su ID.
 * Fundamental para agarrar la foto de las ventas manuscritas.
 * * @param mediaId - El ID del adjunto que nos llega en el webhook
 * @returns Un Buffer con la imagen, listo para mandar a la IA (Gemini)
 */
export async function downloadKapsoMedia(mediaId: string): Promise<Buffer> {
    try {
        const phoneId = getKapsoPhoneId();
        if (!phoneId) {
            throw new Error("No se puede descargar la imagen: falta KAPSO_PHONE_ID.");
        }

        // El SDK de Kapso debería exponer un método de descarga.
        // Usualmente devuelve un stream o un array buffer que convertimos a Buffer para NodeJS
        const response = await kapsoClient.media.download({
            mediaId,
            phoneNumberId: phoneId,
            as: 'response'
        });

        // Asumiendo que la respuesta es un Blob o ArrayBuffer (depende de la versión del SDK)
        // Si el SDK ya devuelve un Buffer de Node, podés retornar 'response' directo.
        const arrayBuffer = await (response as Response).arrayBuffer();
        return Buffer.from(arrayBuffer);

    } catch (error) {
        console.error(`Error descargando la imagen con ID ${mediaId} de Kapso:`, error);
        throw new Error("No se pudo descargar la foto del ticket.");
    }
}



/**
 * NUEVO: Función helper para convertir el Buffer a Base64.
 * A la API de Gemini le encanta recibir las imágenes en Base64.
 */
export function bufferToBase64(buffer: Buffer, mimeType: string = 'image/jpeg') {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Utility to track performance of processing stages.
 */
export function createTimer() {
    const start = performance.now();
    return {
        stop: () => ((performance.now() - start) / 1000).toFixed(2) + "s"
    };
}