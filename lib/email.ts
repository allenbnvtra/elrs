import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  await transporter.sendMail({
    from:    `"BSAU ELRS" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject: "Reset Your Password — BSAU ELRS",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#7d1a1a;margin:0;">BSAU ELRS</h2>
        </div>
        <p style="font-size:16px;color:#1a1a1a;">Hi <strong>${name}</strong>,</p>
        <p style="color:#4b5563;">
          We received a request to reset your password. Click the button below to create a new one.
          This link expires in <strong>1 hour</strong>.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetUrl}"
             style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7d1a1a,#5a1313);color:#fff;font-weight:bold;border-radius:10px;text-decoration:none;font-size:15px;">
            Reset Password
          </a>
        </div>
        <p style="font-size:13px;color:#6b7280;">
          If you didn't request this, you can safely ignore this email. Your password won't change.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="font-size:12px;color:#9ca3af;text-align:center;">
          © 2026 Academia Educational System. All rights reserved.
        </p>
      </div>
    `,
  });
}