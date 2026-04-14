/**
 * Email utility using Nodemailer.
 * Configure via .env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * If SMTP is not configured, the OTP is printed to console (dev mode).
 */

import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const isConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
)

let transporter = null

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: parseInt(process.env.SMTP_PORT || '587') === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

/**
 * @param {string} to
 * @param {string} otp
 * @param {string} name
 * @param {'reset'|'verify'} type
 * @returns {Promise<boolean>} true if sent via SMTP
 */
export async function sendResetOtpEmail(to, otp, name = 'Khách hàng', type = 'reset') {
  const isVerify = type === 'verify'
  const subject  = isVerify ? 'Xác thực tài khoản – Mã OTP của bạn' : 'Đặt lại mật khẩu – Mã OTP của bạn'
  const headline = isVerify ? 'Xác thực tài khoản' : 'Đặt lại mật khẩu'
  const body     = isVerify
    ? `Cảm ơn bạn đã đăng ký! Vui lòng dùng mã OTP bên dưới để kích hoạt tài khoản.`
    : `Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.`
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0d0d0d;color:#f0f0f0;border-radius:12px;padding:32px">
      <h2 style="color:#c9a96e;margin:0 0 8px">LUMIÈRE</h2>
      <p style="color:#999;font-size:13px;margin:0 0 24px">Cửa hàng nước hoa cao cấp</p>
      <h3 style="color:#fff;margin:0 0 16px">${headline}</h3>
      <p>Xin chào <strong>${name}</strong>,</p>
      <p>${body}</p>
      <p>Mã xác nhận (OTP) của bạn là:</p>
      <div style="text-align:center;margin:24px 0">
        <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#c9a96e;background:#1a1a1a;padding:16px 24px;border-radius:8px;display:inline-block">
          ${otp}
        </span>
      </div>
      <p style="color:#aaa;font-size:13px">Mã OTP có hiệu lực trong <strong>15 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
      <hr style="border:none;border-top:1px solid #333;margin:24px 0"/>
      <p style="color:#555;font-size:11px;text-align:center">© ${new Date().getFullYear()} LUMIÈRE. All rights reserved.</p>
    </div>
  `

  if (!isConfigured) {
    console.log(`\n[DEV MODE] OTP (${type}) for ${to}: ${otp}\n`)
    return false
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"LUMIÈRE" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  })

  return true
}
