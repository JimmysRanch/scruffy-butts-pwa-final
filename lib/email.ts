import nodemailer from 'nodemailer'

/**
 * Creates a Nodemailer transporter using environment variables.  The SMTP
 * credentials must be configured for this to work (SMTP_HOST, SMTP_PORT,
 * SMTP_SECURE, SMTP_USER, SMTP_PASS, FROM_EMAIL).  If any of these are
 * missing the sendMail function will throw an error when invoked.
 */
function createTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const secure = (process.env.SMTP_SECURE || 'false') === 'true'
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined
  })
}

export async function sendEmail({
  to,
  subject,
  text,
  html
}: {
  to: string
  subject: string
  text: string
  html?: string
}) {
  const from = process.env.FROM_EMAIL
  if (!from) throw new Error('FROM_EMAIL is not configured')
  const transporter = createTransport()
  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  })
}
