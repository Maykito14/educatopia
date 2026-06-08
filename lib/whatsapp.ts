/**
 * Envía notificaciones de WhatsApp vía Meta Cloud API.
 * Si las variables de entorno no están configuradas, la función retorna silenciosamente.
 *
 * Para activar: agregar en Vercel → Settings → Environment Variables:
 *   WHATSAPP_TOKEN               → token permanente de Meta
 *   WHATSAPP_PHONE_ID            → Phone Number ID de la app en Meta Business
 *   WHATSAPP_TEMPLATE_NAME       → plantilla de confirmación (default: turno_confirmado_educatopia)
 *   WHATSAPP_TEMPLATE_REPROGRAMADO → plantilla de reprogramación (default: turno_reprogramado_educatopia)
 *
 * Plantilla confirmado (turno_confirmado_educatopia):
 *   "Hola {{1}}! Tu turno en Educatopía fue confirmado para {{2}}.
 *    Ante cualquier consulta escribinos al 3576481630. ¡Te esperamos! 📚"
 *
 * Plantilla reprogramado (turno_reprogramado_educatopia):
 *   "Hola {{1}}! Tu turno en Educatopía fue reprogramado para {{2}}.
 *    Ante cualquier consulta escribinos al 3576481630. ¡Te esperamos! 📚"
 */

function formatPhoneAR(raw: string): string {
  // Normaliza a formato E.164 para Argentina: 549XXXXXXXXXX
  let digits = raw.replace(/\D/g, "");
  // Quitar prefijo internacional si ya está presente
  if (digits.startsWith("549")) return digits;
  if (digits.startsWith("54")) digits = digits.slice(2);
  // Quitar 0 inicial de código de área o 15 de celular
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10 && digits.startsWith("15")) digits = digits.slice(2);
  return `549${digits}`;
}

export async function sendTurnoConfirmado(params: {
  phone: string;
  nombreContacto: string;
  detalle: string; // ej: "el martes 10/06 a las 15:00" o "2 turnos confirmados"
}): Promise<void> {
  const token        = process.env.WHATSAPP_TOKEN;
  const phoneId      = process.env.WHATSAPP_PHONE_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME ?? "turno_confirmado_educatopia";

  if (!token || !phoneId) {
    console.log("WhatsApp: env vars no configuradas, se omite notificación");
    return;
  }

  if (!params.phone) {
    console.log("WhatsApp: sin número de teléfono, se omite notificación");
    return;
  }

  const to = formatPhoneAR(params.phone);

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: "es_AR" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: params.nombreContacto || "responsable" },
                  { type: "text", text: params.detalle },
                ],
              },
            ],
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("WhatsApp API error:", res.status, err);
    }
  } catch (err) {
    console.error("WhatsApp: error al enviar notificación:", err);
  }
}

export async function sendTurnoReprogramado(params: {
  phone: string;
  nombreContacto: string;
  detalle: string; // ej: "10/06/2026 a las 15:00"
}): Promise<void> {
  const token        = process.env.WHATSAPP_TOKEN;
  const phoneId      = process.env.WHATSAPP_PHONE_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_REPROGRAMADO ?? "turno_reprogramado_educatopia";

  if (!token || !phoneId) {
    console.log("WhatsApp: env vars no configuradas, se omite notificación de reprogramación");
    return;
  }
  if (!params.phone) return;

  const to = formatPhoneAR(params.phone);

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: "es_AR" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: params.nombreContacto || "responsable" },
                  { type: "text", text: params.detalle },
                ],
              },
            ],
          },
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("WhatsApp API error (reprogramado):", res.status, err);
    }
  } catch (err) {
    console.error("WhatsApp: error al enviar notificación de reprogramación:", err);
  }
}
