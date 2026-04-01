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
