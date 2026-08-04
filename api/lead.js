export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { nombre, telefono, interes } = req.body || {};
  if (!nombre || !telefono) {
    return res.status(400).json({ error: "Falta nombre o teléfono." });
  }

  const leadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const data = {
    nombre: String(nombre).slice(0, 120),
    telefono: String(telefono).slice(0, 40),
    interes: String(interes || "").slice(0, 120),
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
    return res.status(500).json({ error: "No se pudo guardar el dato." });
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
          subject: `🤖 Nuevo lead del chat: ${data.nombre}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
            <h2 style="color:#0A2540;">Nuevo lead desde el chat del sitio</h2>
            <p><b>Nombre:</b> ${data.nombre}</p>
            <p><b>Teléfono:</b> ${data.telefono}</p>
            <p><b>Interés:</b> ${data.interes || "No especificado"}</p>
            <p><a href="https://wa.me/${data.telefono.replace(/[^\d]/g,"")}" style="color:#1857C9;">Escribirle por WhatsApp</a></p>
          </div>`
        })
      });
    } catch (e) {
      // no bloquea la respuesta si falla el correo
    }
  }

  return res.status(200).json({ ok: true });
}
