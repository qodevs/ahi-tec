import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, message, honeypot } = body;

    // Honeypot spam trap
    if (honeypot) {
      return NextResponse.json({ success: true, message: "OK" });
    }

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Bitte geben Sie einen gültigen Namen an." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Bitte geben Sie eine gültige E-Mail-Adresse an." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json(
        { error: "Bitte geben Sie eine Nachricht mit mindestens 5 Zeichen ein." },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";
    const cleanMessage = message.trim();

    // SMTP Configuration
    const smtpHost = process.env.SMTP_HOST || "smtp.ionos.de";
    const rawPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const toEmail = process.env.CONTACT_TO_EMAIL || "info@ahi-tec.de";

    if (!smtpUser || !smtpPass) {
      console.error(
        "[Contact API] SMTP_USER oder SMTP_PASS ist in den Umgebungsvariablen nicht konfiguriert."
      );
      return NextResponse.json(
        {
          error:
            "Der E-Mail-Dienst ist zurzeit nicht konfiguriert. Bitte kontaktieren Sie uns direkt unter info@ahi-tec.de oder +49 2354 9429870.",
        },
        { status: 503 }
      );
    }

    const receivedDate = new Date().toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: #0B192C; color: #ffffff; padding: 24px; text-align: left; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em; }
          .header p { margin: 4px 0 0 0; font-size: 13px; color: #94a3b8; }
          .content { padding: 24px; }
          .field-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .field-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .field-table td.label { font-weight: 600; width: 140px; color: #64748b; }
          .field-table td.value { color: #0f172a; font-weight: 500; }
          .message-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #EF4444; border-radius: 4px; padding: 16px; margin-top: 12px; }
          .message-title { font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
          .message-text { font-size: 15px; color: #1e293b; white-space: pre-wrap; word-break: break-word; }
          .footer { background: #f8fafc; padding: 16px 24px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Neue Kontaktanfrage über die Website</h1>
            <p>Eingegangen am ${receivedDate} Uhr (ahi-tec.de)</p>
          </div>
          <div class="content">
            <table class="field-table">
              <tr>
                <td class="label">Name / Firma:</td>
                <td class="value">${escapeHtml(cleanName)}</td>
              </tr>
              <tr>
                <td class="label">E-Mail:</td>
                <td class="value"><a href="mailto:${escapeHtml(cleanEmail)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(cleanEmail)}</a></td>
              </tr>
              <tr>
                <td class="label">Telefon:</td>
                <td class="value">${cleanPhone ? escapeHtml(cleanPhone) : '<span style="color: #94a3b8;">Nicht angegeben</span>'}</td>
              </tr>
            </table>

            <div class="message-box">
              <div class="message-title">Nachricht:</div>
              <div class="message-text">${escapeHtml(cleanMessage)}</div>
            </div>
          </div>
          <div class="footer">
            Diese E-Mail wurde automatisch vom Kontaktformular der AHI-TEC Website (ahi-tec.de) versendet.<br>
            Sie können direkt auf diese E-Mail antworten, um dem Interessenten zu schreiben.
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Neue Kontaktanfrage über ahi-tec.de:

Datum: ${receivedDate}
Name / Firma: ${cleanName}
E-Mail: ${cleanEmail}
Telefon: ${cleanPhone || "Nicht angegeben"}

Nachricht:
${cleanMessage}
    `.trim();

    const mailOptions = {
      from: `"AHI-TEC Website" <${smtpUser}>`,
      to: toEmail,
      replyTo: cleanEmail,
      subject: `[ahi-tec.de] Neue Anfrage von ${cleanName}`,
      text: textContent,
      html: htmlContent,
    };

    const sendWithConfig = async (port: number, secure: boolean) => {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      return await transporter.sendMail(mailOptions);
    };

    const isPort465 = rawPort === 465;
    const initialSecure = isPort465;

    try {
      await sendWithConfig(rawPort, initialSecure);
    } catch (primaryErr: unknown) {
      console.warn(
        `[Contact API] Primary attempt failed on port ${rawPort} (secure: ${initialSecure}):`,
        primaryErr
      );

      // If initial was 465 and failed, try port 587 (STARTTLS)
      if (rawPort === 465) {
        console.log("[Contact API] Attempting fallback on port 587 (STARTTLS)...");
        await sendWithConfig(587, false);
      } else if (rawPort === 587) {
        // If initial was 587 and failed, try port 465 (SSL)
        console.log("[Contact API] Attempting fallback on port 465 (SSL)...");
        await sendWithConfig(465, true);
      } else {
        throw primaryErr;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Ihre Anfrage wurde erfolgreich übermittelt.",
    });
  } catch (error: unknown) {
    console.error("[Contact API] Fehler beim E-Mail-Versand:", error);

    let clientMessage = "Beim Versenden der E-Mail ist ein Fehler aufgetreten.";
    if (error instanceof Error) {
      const msg = error.message;
      if (
        msg.includes("535") ||
        msg.includes("EAUTH") ||
        msg.includes("BadCredentials") ||
        msg.includes("Invalid login")
      ) {
        clientMessage =
          "SMTP-Authentifizierung fehlgeschlagen: Bitte überprüfen Sie das E-Mail-Passwort und den Benutzernamen (info@ahi-tec.de) in Vercel.";
      } else if (
        msg.includes("ETIMEDOUT") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("ESOCKET")
      ) {
        clientMessage =
          "Verbindungs-Timeout zum Mailserver (Port blockiert oder nicht erreichbar).";
      } else {
        clientMessage = `Fehler: ${msg}`;
      }
    }

    return NextResponse.json(
      {
        error: clientMessage,
      },
      { status: 500 }
    );
  }
}
