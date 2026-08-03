const SYSTEM_PROMPT = `Eres el asistente de ventas de "Tu Empresa Fácil", una empresa chilena que ayuda a emprendedores y empresas a formalizarse, tener presencia digital y llevar su contabilidad al día.

Tu objetivo: conversar de forma cercana y natural (español de Chile, tono cálido pero profesional, respuestas cortas, sin sonar robotico), entender qué necesita la persona, y recomendar el plan o servicio que mejor le calce. Cuando la persona muestre interés real (pregunta precio, dice "quiero", pide que la contacten, etc.), pídele su nombre y teléfono para que el equipo la contacte, y usa la herramienta guardar_lead para registrarlo. No inventes datos ni precios que no están aquí abajo.

SERVICIOS Y PLANES:

1) STARTER PACK — "Empresa Lista" (el plan más elegido, ideal para quien está partiendo)
   - Cuota inicial: $119.990 (pago único). Incluye: creación legal de empresa, inicio de actividades en SII, configuración inicial para facturar, página web base, conexión a WhatsApp/Instagram/formulario de contacto, tarjeta NFC personalizada incluida.
   - Mensualidad: $29.990/mes. Incluye: contabilidad mensual básica, soporte técnico de la web, monitoreo mensual, 4 imágenes publicitarias al mes para redes sociales, asesoría técnica básica.

2) PLANES WEB independientes (para quien ya tiene empresa y solo necesita página web):
   - Mini Página: $49.990 pago único. Creación rápida de página web + dominio en NIC Chile. Ideal para presencia online básica y urgente.
   - One Page Vendedor: $129.990 pago único. Página enfocada en vender y captar clientes, más completa que la Mini Página.
   - Multi Página Empresarial: $249.990 pago único. Estructura de sitio completa para empresas con más necesidades.
   - Todos los planes web incluyen tarjeta NFC personalizada.
   - Correo corporativo (hosting/cPanel) disponible desde $29.990 anual: plan 5GB (5 cuentas), 10GB (10 cuentas), 20GB (20 cuentas de correo).

3) LOS "PLUS" QUE MÁS DEBES DESTACAR (diferenciadores frente a la competencia):
   - Publicidad mensual: 4 imágenes publicitarias listas para publicar en redes sociales cada mes, incluidas en la mensualidad del Starter Pack.
   - Tarjeta de presentación digital NFC: tarjeta física con chip NFC + código QR en el reverso; al acercarla al celular de alguien, abre automáticamente una tarjeta de contacto digital (foto, datos, WhatsApp, redes, servicios) y permite guardar el contacto al instante. Incluida gratis en el Starter Pack y en todos los planes web; también se puede pedir por separado (cotizar por WhatsApp, no tenemos precio público para venta suelta).
   - Contador auditor — contabilidad y auditoría mensual: acompañamiento contable mensual recurrente, pensado también para empresas YA CONSTITUIDAS (no solo las que recién parten) que necesitan llevar su contabilidad al día y ordenada. No hay tarifa fija publicada para esto porque depende del tamaño y movimiento de cada empresa — siempre debes pedir que te dejen su nombre y teléfono para que el contador la contacte y cotice a la medida.

REGLAS DE CONVERSACIÓN:
- Nunca inventes precios ni servicios que no están listados arriba.
- Si preguntan algo que no sabes (ej. detalles legales muy específicos), sé honesto y ofrece derivar con el equipo por WhatsApp.
- Sé breve: 2-4 líneas por respuesta, evita párrafos largos.
- Cuando tengas nombre + teléfono de una persona interesada, SIEMPRE llama a la herramienta guardar_lead antes de responder, y luego confírmale que el equipo la contactará pronto.
- El WhatsApp de contacto directo es +56 9 9593 2848 si prefieren escribir ahí en vez de dejar sus datos.`;

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "guardar_lead",
        description: "Registra los datos de contacto de una persona interesada en algún plan o servicio, para que el equipo la contacte.",
        parameters: {
          type: "OBJECT",
          properties: {
            nombre: { type: "STRING", description: "Nombre de la persona" },
            telefono: { type: "STRING", description: "Teléfono de contacto" },
            interes: { type: "STRING", description: "Qué plan o servicio le interesa (ej: Starter Pack, Mini Página, contador auditor, tarjeta NFC, publicidad)" }
          },
          required: ["nombre", "telefono"]
        }
      }
    ]
  }
];

async function guardarLead(input) {
  const leadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const data = {
    nombre: input.nombre || "",
    telefono: input.telefono || "",
    interes: input.interes || "",
    origen: "chatbot",
    fecha: new Date().toISOString()
  };

  try {
    await fetch(`https://tuempresafacil-default-rtdb.firebaseio.com/leads/${leadId}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error("Error guardando lead en Firebase:", e.message);
  }

  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Tu Empresa Fácil <onboarding@resend.dev>",
          to: ["davidmorgado.n@gmail.com"],
          subject: `🤖 Nuevo lead del chatbot: ${data.nombre}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
            <h2 style="color:#0A2540;">Nuevo lead desde el chatbot</h2>
            <p><b>Nombre:</b> ${data.nombre}</p>
            <p><b>Teléfono:</b> ${data.telefono}</p>
            <p><b>Interés:</b> ${data.interes || "No especificado"}</p>
            <p><a href="https://wa.me/${data.telefono.replace(/[^\d]/g,"")}" style="color:#1857C9;">Escribirle por WhatsApp</a></p>
          </div>`
        })
      });
    } catch (e) {
      console.error("Error enviando email de lead:", e.message);
    }
  }

  return { ok: true };
}

function toGeminiContents(messages) {
  return messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Falta configurar GEMINI_API_KEY en el servidor." });
  }

  const { messages } = req.body;
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: "Falta el historial de mensajes." });
  }

  const MODEL = "gemini-2.0-flash";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  try {
    let contents = toGeminiContents(messages.slice(-20));
    let finalText = "";

    for (let round = 0; round < 3; round++) {
      const geminiRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          tools: TOOLS,
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: { maxOutputTokens: 400 }
        })
      });

      if (!geminiRes.ok) {
        const err = await geminiRes.text();
        return res.status(502).json({ error: `Error de Gemini: ${err}` });
      }

      const data = await geminiRes.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const functionCalls = parts.filter(p => p.functionCall);
      const textParts = parts.filter(p => p.text);
      finalText = textParts.map(p => p.text).join("\n").trim();

      if (!functionCalls.length) break;

      contents.push({ role: "model", parts });

      const responseParts = [];
      for (const fc of functionCalls) {
        if (fc.functionCall.name === "guardar_lead") {
          await guardarLead(fc.functionCall.args || {});
          responseParts.push({
            functionResponse: {
              name: "guardar_lead",
              response: { ok: true }
            }
          });
        } else {
          responseParts.push({
            functionResponse: {
              name: fc.functionCall.name,
              response: { error: "Herramienta no reconocida." }
            }
          });
        }
      }
      contents.push({ role: "user", parts: responseParts });
    }

    return res.status(200).json({ reply: finalText || "Perdona, ¿puedes repetir eso?" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
