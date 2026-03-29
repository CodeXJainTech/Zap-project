import nodemailer from "nodemailer";

export async function sendEmail(
  to: string,
  body: string,
  fromEmail?: string,
  appPassword?: string
) {
  // Use per-action credentials if provided, else fall back to env vars
  const user = fromEmail || process.env.EMAIL_USER;
  const pass = appPassword || process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.error("No email credentials available — skipping send");
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Zap" <${user}>`,
      to,
      subject: "New Zap Notification",
      text: body,
    });
    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}