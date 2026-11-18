import nodemailer from 'nodemailer';

// SMTP real configurável. Mailpit funciona apenas no ambiente local.
// A validação é adiada até o envio/verificação: a ausência de SMTP não pode
// derrubar o backend nem transformar todas as rotas /api em HTTP 502.
let transporter: ReturnType<typeof nodemailer.createTransport> | undefined;
function mailClient() {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) throw new Error('SMTP_HOST não configurado. Configure o .env (em desenvolvimento: SMTP_HOST=mailpit).');
  const port = Number(process.env.SMTP_PORT || '587');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT inválida');
  const from = process.env.SMTP_FROM || 'OtakuVault <nao-responda@otakuvault.local>';
  const publicUrl = new URL(process.env.APP_PUBLIC_URL || 'http://localhost:5173');
  if (!['http:', 'https:'].includes(publicUrl.protocol)) throw new Error('APP_PUBLIC_URL deve ser HTTP ou HTTPS');
  if (process.env.APP_ENV === 'production') {
    if (publicUrl.protocol !== 'https:') throw new Error('APP_PUBLIC_URL deve usar HTTPS em produção');
    if (process.env.COOKIE_SECURE !== 'true') throw new Error('COOKIE_SECURE deve ser true em produção');
    if (host === 'mailpit') throw new Error('Configure um serviço SMTP real em produção');
  }
  transporter ??= nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: process.env.SMTP_REQUIRE_TLS === 'true',
    ...(process.env.SMTP_USER ? {auth: {user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || ''}} : {}),
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  return {transporter, from, publicUrl};
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]!));
export type EmailPurpose = 'verify' | 'reset';
export async function sendAccountEmail(email: string, name: string, purpose: EmailPurpose, token: string) {
  const {transporter, from, publicUrl} = mailClient();
  const path = purpose === 'verify' ? '/verificar-email' : '/redefinir-senha';
  const link = new URL(path, publicUrl);
  // O fragmento não é enviado ao servidor web nem incluído no access log HTTP.
  link.hash = 'token=' + token;
  const confirmation = purpose === 'verify';
  const title = confirmation ? 'Confirme seu e-mail no OtakuVault' : 'Redefina sua senha do OtakuVault';
  const button = confirmation ? 'Confirmar meu e-mail' : 'Redefinir minha senha';
  const minutes = confirmation ? '24 horas' : '30 minutos';
  const text = `Olá, ${name}!\n\n${confirmation ? 'Para ativar sua conta, confirme seu e-mail:' : 'Para criar uma nova senha, acesse:'}\n${link.toString()}\n\nEste link vale por ${minutes} e só pode ser usado uma vez.\nSe você não solicitou isso, ignore esta mensagem.\n\nEquipe OtakuVault`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="background:#0c101e;color:#e8eaf3;font-family:Arial,sans-serif;padding:30px"><div style="max-width:580px;margin:auto;background:#182036;border-radius:18px;padding:32px"><h1 style="color:#f6a2d3">✦ OtakuVault</h1><p>Olá, <strong>${escapeHtml(name)}</strong>!</p><p>${confirmation ? 'Confirme seu e-mail para ativar sua conta e acessar os recursos sociais.' : 'Você recebeu um pedido para redefinir sua senha.'}</p><p><a href="${escapeHtml(link.toString())}" style="display:inline-block;padding:14px 20px;border-radius:10px;background:#dc62a4;color:#fff;text-decoration:none;font-weight:bold">${button}</a></p><p>O link expira em ${minutes} e só funciona uma vez.</p><p style="font-size:13px;word-break:break-all">Se o botão não funcionar, copie o link: ${escapeHtml(link.toString())}</p><p style="font-size:13px;color:#b4bdd0">Não solicitou? Ignore este e-mail. Nunca compartilhe este link.</p></div></body></html>`;
  await transporter.sendMail({from, to: email, subject: title, text, html});
}

export async function verifyMailConnection() {
  await mailClient().transporter.verify();
}
