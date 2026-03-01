import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail(to: string, body: string) {
  try {
    const info = await transporter.sendMail({
      from: `"Zap System" <${process.env.EMAIL_USER}>`,
      to: to,
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
