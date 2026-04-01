export default function handler(req, res) {
    const { email, password } = req.body;

    if (
        email === process.env.ADMIN_EMAIL &&
        password === process.env.ADMIN_PASS
    ) {
        return res.status(200).json({ success: true });
    } else {
        return res.status(401).json({ success: false });
    }
}