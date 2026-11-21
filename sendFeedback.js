const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

const DEFAULT_ORIGINS = [
  'https://teclipse.in',
  'https://www.teclipse.in',
  'https://teclipse-11.vercel.app',
  'https://teclipse-weld.vercel.app'
];

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function getAllowedOrigins() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_ORIGINS;
}

function getRequestOrigin(req) {
  if (req.headers.origin) return req.headers.origin;
  if (req.headers.referer) {
    try { return new URL(req.headers.referer).origin; } catch { return null; }
  }
  return null;
}

module.exports = async (req, res) => {
  const origin = getRequestOrigin(req);
  const allowed = getAllowedOrigins();

  if (!origin || !allowed.includes(origin)) {
    return res.status(403).json({ error: 'Origin not permitted.' });
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  const { name, email, rating, message } = req.body || {};
  if (!name || !email || !rating || !message) {
    return res.status(400).json({ error: 'Missing required fields: name, email, rating, message.' });
  }

  const r = Number(rating);
  if (
    !Number.isInteger(r) || r < 1 || r > 5 ||
    String(name).length > 80 ||
    String(message).length > 5000 ||
    String(email).length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))
  ) {
    return res.status(400).json({ error: 'Invalid input.' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Email service is not configured.' });

  const safeName = esc(String(name).slice(0, 80));
  const safeEmail = esc(email);
  const safeMessage = esc(message);

  const payload = {
    sender: { name: 'Teclipse Feedback System', email: 'teclipseeducationhub@gmail.com' },
    to: [{ email: 'esaiyazhini2020@gmail.com', name: 'Admin' }],
    subject: `New Student Feedback: ${safeName}`,
    htmlContent: `
      <h2>New Student Feedback</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Rating:</strong> ${r} Stars out of 5</p>
      <p><strong>Message:</strong></p>
      <blockquote style="background:#f4f4f4; border-left:4px solid #1E3A8A; padding:10px;">${safeMessage}</blockquote>
      <br>
      <p>You can view all feedbacks by logging into the Teclipse Admin Dashboard.</p>
    `,
    replyTo: { email: String(email), name: String(name).slice(0, 80) }
  };

  try {
    const response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Brevo error status:', response.status);
      return res.status(502).json({ error: 'Email service error.' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to send email.' });
  }
};
