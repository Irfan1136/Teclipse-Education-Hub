export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { name, email, rating, message } = req.body;

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: "Teclipse",
                    email: "teclipseeducationhub@gmail.com"
                },
                to: [{
                    email: "esaiyazhini2020@gmail.com"
                }],
                subject: `Feedback from ${name}`,
                htmlContent: `<p>${message}</p>`,
                replyTo: { email, name }
            })
        });

        if (response.ok) {
            res.status(200).json({ success: true });
        } else {
            res.status(500).json({ error: 'Email failed' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}