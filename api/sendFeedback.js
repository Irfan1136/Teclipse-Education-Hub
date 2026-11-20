const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

function getRequestOrigin(req) {
  if (req.headers.origin) return req.headers.origin;
  if (req.headers.referer) {
    try {
      return new URL(req.headers.referer).origin;
    } catch {
      return null;
    }
  }
  return null;
}

function setCorsHeaders(res, origin) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
  if (allowedOrigins.length === 0) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
}

module.exports = async (req, res) => {
  const origin = getRequestOrigin(req);
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

  if (allowedOrigins.length > 0 && (!origin || !allowedOrigins.includes(origin))) {
    return res.status(403).json({ error: 'Origin not permitted. Configure ALLOWED_ORIGINS on Vercel.' });
  }

  setCorsHeaders(res, origin);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const body = req.body || {};
  const { name, email, rating, message } = body;

  if (!name || !email || !rating || !message) {
    return res.status(400).json({ error: 'Missing required fields: name, email, rating, message.' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Brevo API key is not configured.' });
  }

  const payload = {
    sender: {
      name: 'Teclipse Feedback System',
      email: 'teclipseeducationhub@gmail.com'
    },
    to: [
      {
        email: 'esaiyazhini2020@gmail.com',
        name: 'Admin'
      }
    ],
    subject: `New Student Feedback: ${name}`,
    htmlContent: `
      <h2>New Student Feedback</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Rating:</strong> ${rating} Stars out of 5</p>
      <p><strong>Message:</strong></p>
      <blockquote style="background:#f4f4f4; border-left:4px solid #1E3A8A; padding:10px;">${message}</blockquote>
      <br>
      <p>You can view all feedbacks by logging into the Teclipse Admin Dashboard.</p>
    `,
    replyTo: {
      email,
      name
    }
  };

  try {
    const response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({ status: response.status }));

    if (!response.ok) {
      return res.status(502).json({ error: 'Brevo service error', details: result });
    }

    return res.status(200).json({ success: true, detail: result });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send email via Brevo.', details: error.message });
  }
};
