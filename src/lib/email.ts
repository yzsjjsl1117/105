import nodemailer from "nodemailer";

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    return nodemailer.createTransport({
      host,
      port: parseInt(port),
      auth: { user, pass },
    });
  }

  return null;
}

const transport = createTransport();

const FROM = process.env.SMTP_FROM || "noreply@yueling.tea";

interface SendOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendOptions): Promise<boolean> {
  if (!transport) {
    // 未配置 SMTP，开发阶段打印到控制台
    console.log("──────────────────────────────");
    console.log(`📧 TO: ${to}`);
    console.log(`📝 SUBJECT: ${subject}`);
    console.log("──────────────────────────────");
    console.log(html);
    console.log("──────────────────────────────");
    return true;
  }

  try {
    const info = await transport.sendMail({
      from: FROM,
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (e) {
    console.error("Failed to send email:", e);
    return false;
  }
}
