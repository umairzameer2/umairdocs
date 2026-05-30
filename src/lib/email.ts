import nodemailer from 'nodemailer'
import { Resend } from 'resend'

// ─── Configuration ────────────────────────────────────────────────
// Option 1: Resend API (recommended — free 100 emails/day)
//   RESEND_API_KEY=re_xxxxxxxx
//   EMAIL_FROM=UmairDocs <onboarding@yourdomain.com>
//
// Option 2: SMTP (fallback)
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_USER=your-email@gmail.com
//   SMTP_PASS=your-app-password
//   SMTP_FROM="UmairDocs <your-email@gmail.com>"
// ────────────────────────────────────────────────────────────────────

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const EMAIL_FROM = process.env.EMAIL_FROM || 'UmairDocs <noreply@umairdocs.com>'

const SMTP_HOST = process.env.SMTP_HOST || ''
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10)
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const SMTP_FROM = process.env.SMTP_FROM || EMAIL_FROM

// ─── Resend client (lazy init) ────────────────────────────────────
let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  if (!RESEND_API_KEY) return null
  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY)
  }
  return resendClient
}

// ─── SMTP transporter (lazy init) ─────────────────────────────────
let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST || 'localhost',
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER && SMTP_PASS ? {
        user: SMTP_USER,
        pass: SMTP_PASS,
      } : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
    })
  }
  return transporter
}

// ─── Check if email is configured ─────────────────────────────────
type EmailProvider = 'resend' | 'smtp' | 'none'

export function getEmailProvider(): EmailProvider {
  if (RESEND_API_KEY) return 'resend'
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) return 'smtp'
  return 'none'
}

export function isEmailConfigured(): boolean {
  return getEmailProvider() !== 'none'
}

// ─── Send email ────────────────────────────────────────────────────
interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  const provider = getEmailProvider()

  // No provider configured — log to console
  if (provider === 'none') {
    console.log('\n' + '='.repeat(60))
    console.log(`📧 EMAIL (not sent — no email provider configured)`)
    console.log(`   To: ${to}`)
    console.log(`   Subject: ${subject}`)
    console.log(`   Body preview: ${text || html.replace(/<[^>]*>/g, '').slice(0, 100)}...`)
    console.log(`   💡 Configure RESEND_API_KEY or SMTP settings in .env to send real emails`)
    console.log('='.repeat(60) + '\n')
    return true // Return true so the flow doesn't break
  }

  // Try Resend first
  if (provider === 'resend') {
    try {
      const resend = getResendClient()!
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      })

      if (error) {
        console.error('📧 Resend error:', error)
        return false
      }

      console.log(`📧 Email sent via Resend to ${to}: ${subject}`)
      return true
    } catch (error) {
      console.error('📧 Resend send error:', error)
      return false
    }
  }

  // Try SMTP
  if (provider === 'smtp') {
    try {
      const transport = getTransporter()
      await transport.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      })
      console.log(`📧 Email sent via SMTP to ${to}: ${subject}`)
      return true
    } catch (error) {
      console.error('📧 SMTP send error:', error)
      return false
    }
  }

  return false
}

// ─── Email Templates ───────────────────────────────────────────────

export function invitationEmailTemplate({
  orgName,
  orgIcon,
  inviterName,
  role,
  acceptUrl,
}: {
  orgName: string
  orgIcon: string
  inviterName: string
  role: string
  acceptUrl: string
}): { html: string; text: string } {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)
  const text = `You've been invited to join "${orgName}" on UmairDocs as a ${roleLabel} by ${inviterName}. Accept the invitation: ${acceptUrl}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">
                ${orgIcon} ${orgName}
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">
                Organization Invitation
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px 40px;">
              <p style="margin: 0 0 16px; color: #334155; font-size: 16px; line-height: 1.5;">
                Hi there! 👋
              </p>
              <p style="margin: 0 0 16px; color: #334155; font-size: 16px; line-height: 1.5;">
                <strong style="color: #1e293b;">${inviterName}</strong> has invited you to join the organization
                <strong style="color: #1e293b;">${orgIcon} ${orgName}</strong> on UmairDocs.
              </p>
              <!-- Role Badge -->
              <table cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td style="background-color: #f1f5f9; border-radius: 8px; padding: 10px 16px;">
                    <p style="margin: 0; color: #64748b; font-size: 13px;">
                      Your role: <strong style="color: #7c3aed; text-transform: capitalize;">${roleLabel}</strong>
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 24px; color: #64748b; font-size: 14px; line-height: 1.5;">
                UmairDocs is a modern document platform where teams collaborate on documents, share ideas, and create together.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #7c3aed, #9333ea); border-radius: 10px;">
                    <a href="${acceptUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; letter-spacing: 0.01em;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0; color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5;">
                Or copy this link to your browser:<br>
                <a href="${acceptUrl}" style="color: #7c3aed; word-break: break-all;">${acceptUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore it.
              </p>
              <p style="margin: 8px 0 0; color: #cbd5e1; font-size: 11px; text-align: center;">
                © ${new Date().getFullYear()} UmairDocs · Secured with encryption
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { html, text }
}
