export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { nombre, telefono, correo, servicio, mensaje, fecha, hora, horaFin } = req.body;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f8fc;padding:20px;border-radius:12px;">
      <div style="background:linear-gradient(135deg,#1857C9,#4FC3F7);padding:28px;border-radius:10px;text-align:center;margin-bottom:20px;">
        <h1 style="color:white;margin:0;font-size:22px;">📅 Nueva Cita Agendada</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Tu Empresa Fácil</p>
      </div>
      <div style="background:white;border-radius:10px;padding:24px;margin-bottom:16px;">
        <h2 style="color:#0A2540;font-size:16px;margin:0 0 16px;">Detalles de la cita</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #EEF3FA;">
            <td style="padding:10px 0;color:#5B6472;font-size:14px;width:40%;">📆 Fecha</td>
            <td style="padding:10px 0;font-weight:600;color:#1E2530;font-size:14px;">${fecha}</td>
          </tr>
          <tr style="border-bottom:1px solid #EEF3FA;">
            <td style="padding:10px 0;color:#5B6472;font-size:14px;">🕐 Hora</td>
            <td style="padding:10px 0;font-weight:600;color:#1E2530;font-size:14px;">${hora} – ${horaFin} hrs</td>
          </tr>
          <tr style="border-bottom:1px solid #EEF3FA;">
            <td style="padding:10px 0;color:#5B6472;font-size:14px;">👤 Cliente</td>
            <td style="padding:10px 0;font-weight:600;color:#1E2530;font-size:14px;">${nombre}</td>
          </tr>
          <tr style="border-bottom:1px solid #EEF3FA;">
            <td style="padding:10px 0;color:#5B6472;font-size:14px;">📞 Teléfono</td>
            <td style="padding:10px 0;font-weight:600;color:#1E2530;font-size:14px;">${telefono}</td>
          </tr>
          ${correo ? `<tr style="border-bottom:1px solid #EEF3FA;"><td style="padding:10px 0;color:#5B6472;font-size:14px;">✉️ Correo</td><td style="padding:10px 0;font-weight:600;color:#1E2530;font-size:14px;">${correo}</td></tr>` : ""}
          <tr style="border-bottom:1px solid #EEF3FA;">
            <td style="padding:10px 0;color:#5B6472;font-size:14px;">📋 Servicio</td>
            <td style="padding:10px 0;font-weight:600;color:#1E2530;font-size:14px;">${servicio}</td>
          </tr>
          ${mensaje ? `<tr><td style="padding:10px 0;color:#5B6472;font-size:14px;">💬 Comentario</td><td style="padding:10px 0;font-weight:600;color:#1E2530;font-size:14px;">${mensaje}</td></tr>` : ""}
        </table>
      </div>
      <div style="background:#1857C9;border-radius:10px;padding:16px;text-align:center;">
        <a href="https://wa.me/56995932848?text=${encodeURIComponent(`Hola ${nombre}, confirmamos tu cita el ${fecha} a las ${hora} hrs. ¡Te esperamos! - Tu Empresa Fácil`)}"
           style="color:white;font-weight:600;font-size:14px;text-decoration:none;">
          💬 Responder por WhatsApp al cliente
        </a>
      </div>
      <p style="color:#9FB0C7;font-size:12px;text-align:center;margin-top:16px;">Tu Empresa Fácil · tuempresafacil.cl</p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Tu Empresa Fácil <onboarding@resend.dev>",
        to: ["davidmorgado.n@gmail.com"],
        subject: `📅 Nueva cita: ${nombre} — ${fecha} ${hora} hrs`,
        html
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
