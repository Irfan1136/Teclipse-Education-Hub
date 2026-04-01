// api/sendemail.js
// ─────────────────────────────────────────────────────────────
//  Called by: script.js  →  POST https://teclipse-weld.vercel.app/api/sendemail
//
//  Set in Vercel Dashboard → Settings → Environment Variables:
//    BREVO_API_KEY  = your Brevo (Sendinblue) API key
//    CONTACT_EMAIL  = teclipseeducationhub@gmail.com
//                    (must be a verified sender in your Brevo account)
// ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {

    // ── CORS: allow Hostinger frontend ──
    const allowedOrigins = [
        'https://teclipse-weld.vercel.app',
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { name, email, message, rating } = req.body;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "Teclipse", email: "teclipseeducationhub@gmail.com" },
        to: [{ email: "irsparks011@gmail.com" }],
        subject: "New Feedback Received",
        htmlContent: `
          <h2>New Feedback</h2>
          <p><b>Name:</b> ${name}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Rating:</b> ${rating} ⭐</p>
          <p><b>Message:</b> ${message}</p>
        `,
      }),
    });

    const data = await response.json();
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: "Mail failed" });
  }
}

        'https://teclipseeducationhub.com',   // ← your Hostinger domain
        'http://localhost:5500',
        'http://127.0.0.1:5500',
    ];
    const origin = req.headers.origin || '';
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, message, rating } = req.body || {};

        if (!name || !email || !message || !rating) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const BREVO_API_KEY  = process.env.BREVO_API_KEY;
        const CONTACT_EMAIL  = process.env.CONTACT_EMAIL;

        if (!BREVO_API_KEY || !CONTACT_EMAIL) {
            console.error('❌ BREVO_API_KEY or CONTACT_EMAIL not set in Vercel env vars');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const stars = '⭐'.repeat(Math.min(parseInt(rating) || 0, 5));

        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': BREVO_API_KEY,
            },
            body: JSON.stringify({
                sender: { name: 'Teclipse Feedback', email: "teclipseeducationhub@gmail.com" },
                to: [{ email: CONTACT_EMAIL, name: 'Teclipse Team' }],
                subject: `⭐ New Feedback from ${name} — ${rating}/5 stars`,
                htmlContent: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;
                            border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                    <div style="background:#1e293b;padding:24px;text-align:center;">
                        <h2 style="color:#fff;margin:0;">📬 New Student Feedback</h2>
                        <p style="color:#94a3b8;margin:4px 0 0;">Teclipse Education Hub</p>
                    </div>
                    <div style="padding:24px;background:#f9fafb;">
                        <table style="width:100%;border-collapse:collapse;">
                            <tr>
                                <td style="padding:10px 0;color:#6b7280;width:110px;"><b>Name</b></td>
                                <td style="padding:10px 0;color:#111827;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;color:#6b7280;"><b>Email</b></td>
                                <td style="padding:10px 0;">
                                    <a href="mailto:${email}" style="color:#3b82f6;">${email}</a>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;color:#6b7280;"><b>Rating</b></td>
                                <td style="padding:10px 0;font-size:18px;">${stars} (${rating}/5)</td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;color:#6b7280;vertical-align:top;"><b>Message</b></td>
                                <td style="padding:10px 0;color:#111827;line-height:1.6;">${message}</td>
                            </tr>
                        </table>
                    </div>
                    <div style="padding:14px 24px;background:#1e293b;text-align:center;">
                        <p style="color:#64748b;font-size:12px;margin:0;">
                            Auto-generated by Teclipse Feedback System
                        </p>
                    </div>
                </div>`
            })
        });

        const brevoData = await brevoRes.json();

        if (!brevoRes.ok) {
            console.error('Brevo error:', brevoData);
            return res.status(500).json({ error: 'Failed to send email', details: brevoData });
        }

        return res.status(200).json({ success: true, message: 'Email sent' });

    } catch (err) {
        console.error('Send email error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}
