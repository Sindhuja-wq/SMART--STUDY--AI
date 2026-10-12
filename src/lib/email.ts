import nodemailer from "nodemailer";
import dns from "dns";

// Ensure Node prioritizes IPv4 over IPv6 to prevent ETIMEDOUT issues on networks with incomplete IPv6 routing
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignore in environments where this API is unavailable
}

export async function sendOtpEmail(to: string, otp: string) {
  if (!process.env.SMTP_HOST && !process.env.SMTP_SERVICE && !process.env.SMTP_USER) {
    console.warn("Email provider is not fully configured in environment variables.");
    throw new Error("Email provider configuration is missing (SMTP_HOST, SMTP_USER, SMTP_PASS).");
  }

  const isGmail =
    process.env.SMTP_SERVICE?.toLowerCase() === "gmail" ||
    process.env.SMTP_HOST?.toLowerCase().includes("gmail");

  const transporter = isGmail
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

  const fromAddress =
    process.env.SMTP_FROM ||
    (process.env.SMTP_USER ? `"Smart Study AI" <${process.env.SMTP_USER}>` : '"Smart Study AI" <noreply@smartstudyai.com>');

  const mailOptions = {
    from: fromAddress,
    to,
    subject: "Your Verification Code - Smart Study AI",
    text: `Your one-time verification code is: ${otp}. It will expire in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #3b82f6;">Smart Study AI</h2>
        <p>Thank you for registering! Please use the following One-Time Password (OTP) to complete your account verification:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="margin: 0; letter-spacing: 5px; color: #1f2937;">${otp}</h1>
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
