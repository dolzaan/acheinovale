import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export type EmailMessage = {
  to: string | string[];
  subject: string;
  /** Parágrafos em texto simples; o HTML é gerado com escape. */
  paragraphs: string[];
  /** Lista de itens com link, usada nos resumos de alertas. */
  items?: Array<{ title: string; detail: string; path: string }>;
  action?: { label: string; path: string };
  footer?: string;
};

let transporter: Transporter | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass || !process.env.EMAIL_FROM) {
    transporter = null;
    return transporter;
  }
  const port = Number.parseInt(process.env.SMTP_PORT || "587", 10);
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export function isEmailConfigured() {
  return getTransporter() !== null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]!);
}

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function render(message: EmailMessage) {
  const actionUrl = message.action ? absoluteUrl(message.action.path) : null;
  const items = message.items ?? [];
  const text = [
    ...message.paragraphs,
    ...items.map(item => `${item.title} — ${item.detail}\n${absoluteUrl(item.path)}`),
    ...(message.action && actionUrl ? [`${message.action.label}: ${actionUrl}`] : []),
    "",
    message.footer ?? `${SITE_NAME} — ${SITE_URL}`,
  ].join("\n\n");
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:24px;background:#fff9ec;font-family:Arial,sans-serif;color:#1b2a22">
<div style="max-width:560px;margin:0 auto;padding:28px;border-radius:14px;background:#ffffff">
<p style="margin:0 0 18px;font-weight:700;color:#1d402d">${escapeHtml(SITE_NAME)}</p>
${message.paragraphs.map(paragraph => `<p style="margin:0 0 14px;line-height:1.55">${escapeHtml(paragraph)}</p>`).join("\n")}
${items.length ? `<ul style="margin:0 0 14px;padding:0;list-style:none">${items.map(item => `<li style="margin:0 0 12px;padding:12px;border:1px solid #e0e7e2;border-radius:10px"><a href="${escapeHtml(absoluteUrl(item.path))}" style="color:#1d402d;font-weight:700">${escapeHtml(item.title)}</a><br><span style="color:#4b5a51;font-size:14px">${escapeHtml(item.detail)}</span></li>`).join("")}</ul>` : ""}
${message.action && actionUrl ? `<p style="margin:22px 0"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#1d402d;color:#ffffff;font-weight:700;text-decoration:none">${escapeHtml(message.action.label)}</a></p>` : ""}
<p style="margin:24px 0 0;color:#6b766f;font-size:12px;line-height:1.5">${escapeHtml(message.footer ?? `${SITE_NAME} — ${SITE_URL}`)}</p>
</div></body></html>`;
  return { text, html };
}

/**
 * Envia um e-mail transacional. Nunca lança erro: falhas e a ausência de
 * configuração SMTP são registradas e o fluxo principal continua.
 */
export async function sendEmail(message: EmailMessage) {
  const recipients = (Array.isArray(message.to) ? message.to : [message.to]).filter(Boolean);
  if (!recipients.length) return false;
  const mailer = getTransporter();
  if (!mailer) {
    console.warn(JSON.stringify({ level: "warning", message: "email_not_configured", subject: message.subject }));
    return false;
  }
  try {
    await mailer.sendMail({ from: process.env.EMAIL_FROM, to: recipients, subject: message.subject, ...render(message) });
    return true;
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "email_send_failed", subject: message.subject, error: error instanceof Error ? error.message : String(error) }));
    return false;
  }
}
