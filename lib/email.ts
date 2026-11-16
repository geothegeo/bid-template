/** Sends via Resend when RESEND_API_KEY is set; otherwise logs (R-NTC-02). */
export async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] to=${to} subject=${subject}\n${text}`);
    return true;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Directory <noreply@example.com>", to, subject, text }),
  });
  return response.ok;
}
