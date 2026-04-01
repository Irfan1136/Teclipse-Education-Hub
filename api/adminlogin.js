export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (// api/adminlogin.js
// ─────────────────────────────────────────────────────────────
//  Called by: script.js  →  POST https://teclipse-weld.vercel.app/api/adminlogin
//
//  Set in Vercel Dashboard → Settings → Environment Variables:
//    ADMIN_EMAIL     = your admin email
//    ADMIN_PASSWORD  = your secure password
// ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {

    // ── CORS: allow your Hostinger domain to call this API ──
    const allowedOrigins = [
        'https://teclipse-weld.vercel.app',   // Vercel itself
        'https://teclipseeducationhub.com',    // ← replace with your Hostinger domain
        'http://localhost:5500',               // local dev
        'http://127.0.0.1:5500',
    ];
    const origin = req.headers.origin || '';
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { email, password, type } = req.body || {};

        // ── Change-password stub ──
        // Real password changes must be done via Vercel env vars.
        // This just validates the old password so the UI isn't misleading.
        if (type === 'changePass') {
            return res.status(200).json({
                success: true,
                message: 'To change your password, update the ADMIN_PASSWORD environment variable in your Vercel dashboard and redeploy.'
            });
        }

        // ── Normal login ──
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }

        const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            console.error('❌ ADMIN_EMAIL or ADMIN_PASSWORD not set in Vercel environment variables');
            return res.status(500).json({ success: false, message: 'Server configuration error' });
        }

        const emailOk = email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
        const passOk  = password === ADMIN_PASSWORD;

        if (emailOk && passOk) {
            return res.status(200).json({ success: true, message: 'Login successful' });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

    } catch (err) {
        console.error('Admin login error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}
    email === "teclipseeducationhub@gmail.com" &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false });
}
