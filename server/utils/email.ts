// ─── Resend via HTTP API (tanpa SDK) ─────────────────────────────────────────
// SDK `resend` tidak kompatibel dengan Cloudflare Pages karena dependency
// `@react-email/render`. Sebagai gantinya, kita gunakan Resend REST API
// langsung via fetch().

const RESEND_API_URL = 'https://api.resend.com/emails'

async function sendEmail(payload: {
  from: string
  to: string[]
  subject: string
  html: string
}): Promise<void> {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey || process.env.NUXT_RESEND_API_KEY
  if (!apiKey) throw new Error('Resend API Key tidak ditemukan di environment variables.')

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Resend API Error (${response.status}): ${errorBody}`)
  }
}

// ─── HELPER: Format angka ke Rupiah ─────────────────────────────────────────
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const LOGO_URL = 'https://member.tentaklik.com/logo-full.png'
const BRAND_ORANGE = '#f97316'       // orange-500
const BRAND_ORANGE_DARK = '#ea580c'  // orange-600
const BRAND_ORANGE_LIGHT = '#fff7ed' // orange-50
const BRAND_ORANGE_BORDER = '#fed7aa' // orange-200

// ─── EMAIL: Notifikasi VA / Pembayaran Top Up ────────────────────────────────
export interface VaEmailPayload {
  to: string
  customerName: string
  paymentName: string   // e.g. "Mandiri Virtual Account"
  vaNumber: string | null
  paymentCode: string | null
  netAmount: number
  feeAmount: number
  paymentAmount: number
  packageType: string
  merchantOrderId: string
  expiryMinutes: number
  productDetails: string // e.g. "Top Up Saldo Iklan" | "Sewa Akun Iklan"
}

export async function sendVaEmail(payload: VaEmailPayload): Promise<void> {
  const {
    to, customerName, paymentName, vaNumber, paymentCode,
    netAmount, feeAmount, paymentAmount, packageType,
    merchantOrderId, expiryMinutes, productDetails
  } = payload

  const displayCode = vaNumber || paymentCode || '-'
  const isVirtualAccount = !!(vaNumber)
  const expiryText = expiryMinutes >= 60
    ? `${expiryMinutes / 60} jam`
    : `${expiryMinutes} menit`

  const packageLabel: Record<string, string> = {
    starter: 'Starter',
    growth: 'Growth',
    scale: 'Scale',
  }

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Instruksi Pembayaran — Tentaklik</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo Bar -->
          <tr>
            <td style="background:#ffffff;border-radius:16px 16px 0 0;padding:24px 40px;text-align:center;border-bottom:1px solid #f5f5f4;">
              <img src="${LOGO_URL}" alt="Tentaklik" width="150" style="display:block;margin:0 auto;max-width:150px;height:auto;" />
            </td>
          </tr>
          <!-- Orange Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_ORANGE} 0%,${BRAND_ORANGE_DARK} 100%);padding:24px 40px;text-align:center;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Instruksi Pembayaran</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">

              <p style="margin:0 0 6px;font-size:15px;color:#78716c;">Halo, <strong style="color:#1c1917;">${customerName}</strong> 👋</p>
              <p style="margin:0 0 28px;font-size:15px;color:#44403c;line-height:1.6;">Berikut adalah instruksi pembayaran untuk <strong>${productDetails}</strong> Anda. Selesaikan pembayaran sebelum batas waktu berakhir.</p>

              <!-- Metode Pembayaran Badge -->
              <div style="background:${BRAND_ORANGE_LIGHT};border:1px solid ${BRAND_ORANGE_BORDER};border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                <table cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="padding-right:10px;"><span style="background:${BRAND_ORANGE};color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:99px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;">${paymentName}</span></td>
                  <td><span style="font-size:13px;color:${BRAND_ORANGE_DARK};font-weight:500;">Metode pembayaran yang dipilih</span></td>
                </tr></table>
              </div>

              <!-- Kode VA / Kode Bayar -->
              <div style="background:#fafaf9;border:2px dashed #d6d3d1;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#78716c;text-transform:uppercase;letter-spacing:1px;">${isVirtualAccount ? 'Nomor Virtual Account' : 'Kode Pembayaran'}</p>
                <p style="margin:0;font-size:32px;font-weight:800;color:${BRAND_ORANGE_DARK};letter-spacing:4px;">${displayCode}</p>
                <p style="margin:8px 0 0;font-size:12px;color:#a8a29e;">Salin kode ini untuk melanjutkan pembayaran</p>
              </div>

              <!-- Rincian Pembayaran -->
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#44403c;text-transform:uppercase;letter-spacing:0.5px;">Rincian Pembayaran</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e7e5e4;margin-bottom:28px;">
                <tr style="background:#fafaf9;">
                  <td style="padding:12px 16px;font-size:14px;color:#78716c;">Order ID</td>
                  <td style="padding:12px 16px;font-size:14px;color:#1c1917;font-weight:600;text-align:right;">${merchantOrderId}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;font-size:14px;color:#78716c;border-top:1px solid #f5f5f4;">Produk</td>
                  <td style="padding:12px 16px;font-size:14px;color:#1c1917;font-weight:500;text-align:right;border-top:1px solid #f5f5f4;">${productDetails}${packageType && packageType !== 'subscription' ? ` (Paket ${packageLabel[packageType] || packageType})` : ''}</td>
                </tr>
                <tr style="background:#fafaf9;">
                  <td style="padding:12px 16px;font-size:14px;color:#78716c;border-top:1px solid #f5f5f4;">Jumlah Saldo</td>
                  <td style="padding:12px 16px;font-size:14px;color:#1c1917;font-weight:500;text-align:right;border-top:1px solid #f5f5f4;">${formatRupiah(netAmount)}</td>
                </tr>
                ${feeAmount > 0 ? `
                <tr>
                  <td style="padding:12px 16px;font-size:14px;color:#78716c;border-top:1px solid #f5f5f4;">Biaya Layanan</td>
                  <td style="padding:12px 16px;font-size:14px;color:#1c1917;font-weight:500;text-align:right;border-top:1px solid #f5f5f4;">${formatRupiah(feeAmount)}</td>
                </tr>` : ''}
                <tr style="background:${BRAND_ORANGE};">
                  <td style="padding:14px 16px;font-size:15px;color:#ffffff;font-weight:700;">Total Bayar</td>
                  <td style="padding:14px 16px;font-size:18px;color:#ffffff;font-weight:800;text-align:right;">${formatRupiah(paymentAmount)}</td>
                </tr>
              </table>

              <!-- Warning Waktu -->
              <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
                <p style="margin:0;font-size:13px;color:#92400e;">⏳ <strong>Segera selesaikan pembayaran</strong> dalam <strong>${expiryText}</strong>. Lewat dari batas waktu, pesanan akan otomatis dibatalkan.</p>
              </div>

              <!-- Cara Bayar -->
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#44403c;text-transform:uppercase;letter-spacing:0.5px;">Cara Pembayaran via ${paymentName}</p>
              <ol style="margin:0;padding-left:20px;color:#44403c;font-size:14px;line-height:2;">
                <li>Buka aplikasi mobile banking atau ATM bank Anda.</li>
                <li>Pilih menu <strong>Transfer</strong> atau <strong>Pembayaran</strong>.</li>
                <li>Masukkan ${isVirtualAccount ? 'Nomor Virtual Account' : 'Kode Pembayaran'}: <strong style="color:${BRAND_ORANGE_DARK};">${displayCode}</strong></li>
                <li>Masukkan jumlah: <strong style="color:${BRAND_ORANGE_DARK};">${formatRupiah(paymentAmount)}</strong></li>
                <li>Konfirmasi dan selesaikan pembayaran.</li>
              </ol>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafaf9;border-top:1px solid #e7e5e4;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#a8a29e;">Ada pertanyaan? Hubungi kami di <a href="mailto:support@tentaklik.com" style="color:${BRAND_ORANGE};text-decoration:none;font-weight:600;">support@tentaklik.com</a></p>
              <p style="margin:0;font-size:11px;color:#d6d3d1;">© ${new Date().getFullYear()} Tentaklik. Seluruh hak dilindungi.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  try {
    await sendEmail({
      from: 'Tentaklik <no-reply@tentaklik.com>',
      to: [to],
      subject: `Instruksi Pembayaran ${paymentName} — ${formatRupiah(paymentAmount)}`,
      html,
    })
    console.log(`[Email] Email VA berhasil dikirim ke ${to}`)
  } catch (error) {
    console.error('[Email] Gagal mengirim email VA:', error)
    // Tidak throw error agar flow utama tidak terganggu jika email gagal
  }
}

// ─── EMAIL: Notifikasi Pembayaran Berhasil ───────────────────────────────────
export async function sendPaymentSuccessEmail(payload: {
  to: string
  customerName: string
  productDetails: string
  paymentAmount: number
  merchantOrderId: string
}): Promise<void> {
  const { to, customerName, productDetails, paymentAmount, merchantOrderId } = payload

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pembayaran Berhasil — Tentaklik</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo Bar -->
          <tr>
            <td style="background:#ffffff;border-radius:16px 16px 0 0;padding:24px 40px;text-align:center;border-bottom:1px solid #f5f5f4;">
              <img src="${LOGO_URL}" alt="Tentaklik" width="150" style="display:block;margin:0 auto;max-width:150px;height:auto;" />
            </td>
          </tr>
          <!-- Green Success Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669 0%,#047857 100%);padding:28px 40px;text-align:center;">
              <div style="font-size:48px;margin-bottom:8px;">✅</div>
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">Pembayaran Berhasil!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">
              <p style="margin:0 0 20px;font-size:15px;color:#44403c;line-height:1.6;">Halo <strong>${customerName}</strong>, pembayaran Anda untuk <strong>${productDetails}</strong> telah kami terima. Saldo akan segera dikreditkan ke akun Anda.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e7e5e4;margin-bottom:28px;">
                <tr style="background:#fafaf9;">
                  <td style="padding:12px 16px;font-size:14px;color:#78716c;">Order ID</td>
                  <td style="padding:12px 16px;font-size:14px;color:#1c1917;font-weight:600;text-align:right;">${merchantOrderId}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;font-size:14px;color:#78716c;border-top:1px solid #f5f5f4;">Produk</td>
                  <td style="padding:12px 16px;font-size:14px;color:#1c1917;font-weight:500;text-align:right;border-top:1px solid #f5f5f4;">${productDetails}</td>
                </tr>
                <tr style="background:#059669;">
                  <td style="padding:14px 16px;font-size:15px;color:#ffffff;font-weight:700;">Total Dibayar</td>
                  <td style="padding:14px 16px;font-size:18px;color:#ffffff;font-weight:800;text-align:right;">${formatRupiah(paymentAmount)}</td>
                </tr>
              </table>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:20px;">
                <a href="https://member.tentaklik.com/dashboard" style="display:inline-block;background:${BRAND_ORANGE};color:#ffffff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">Buka Dashboard Tentaklik →</a>
              </div>

              <p style="margin:0;font-size:14px;color:#44403c;text-align:center;">Terima kasih telah menggunakan layanan Tentaklik! 🎉</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafaf9;border-top:1px solid #e7e5e4;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#a8a29e;">Ada pertanyaan? Hubungi kami di <a href="mailto:support@tentaklik.com" style="color:${BRAND_ORANGE};text-decoration:none;font-weight:600;">support@tentaklik.com</a></p>
              <p style="margin:0;font-size:11px;color:#d6d3d1;">© ${new Date().getFullYear()} Tentaklik. Seluruh hak dilindungi.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  try {
    await sendEmail({
      from: 'Tentaklik <no-reply@tentaklik.com>',
      to: [to],
      subject: `✅ Pembayaran Berhasil — ${formatRupiah(paymentAmount)}`,
      html,
    })
    console.log(`[Email] Email sukses berhasil dikirim ke ${to}`)
  } catch (error) {
    console.error('[Email] Gagal mengirim email sukses:', error)
  }
}
