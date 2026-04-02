import fetch from "node-fetch";

export default async function handler(req, res){
    if(req.method === "POST"){
        const { name, email, rating, message } = req.body;

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": process.env.BREVO_API_KEY
            },
            body: JSON.stringify({
                sender: { name: "Teclipse", email: "teclipseeducationhub@gmail.com" },
                to: [{ email: "irsparks011@gmail.com", name: "Admin" }],
                subject: `New Feedback from ${name}`,
                htmlContent: `<p><strong>Name:</strong> ${name}</p>
                              <p><strong>Email:</strong> ${email}</p>
                              <p><strong>Rating:</strong> ${rating}</p>
                              <p><strong>Message:</strong> ${message}</p>`
            })
        });

        if(response.ok){
            res.status(200).json({ success: true });
        } else {
            res.status(500).json({ success: false });
        }
    } else {
        res.status(405).json({ success: false, message: "Method not allowed" });
    }
}
