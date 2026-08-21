<template>
  <Teleport to="body">
    <div v-if="isOpen" class="invoice-overlay" @click.self="closeModal">
      <div class="invoice-modal">
        <!-- Close Button -->
        <button @click="closeModal" class="invoice-close">
          <LucideX class="w-4 h-4" />
        </button>

        <!-- Scrollable content area -->
        <div class="invoice-scroll">
        <!-- Printable Invoice Area -->
        <div id="invoice-print-area" class="invoice-body">
          <!-- Header: Logo + INVOICE -->
          <div class="invoice-header">
            <img src="/logo-full.png" alt="Tentaklik" class="invoice-logo" />
            <div class="invoice-header-right">
              <h1 class="invoice-title">INVOICE</h1>
              <span class="invoice-badge-lunas">✓ LUNAS</span>
            </div>
          </div>

          <!-- Meta Info Row -->
          <div class="invoice-meta">
            <div class="invoice-meta-item">
              <span class="invoice-meta-label">No. Invoice</span>
              <span class="invoice-meta-value">{{ transaction?.payment_data?.merchantOrderId || transaction?.id?.substring(0,8) || '-' }}</span>
            </div>
            <div class="invoice-meta-item">
              <span class="invoice-meta-label">Tanggal</span>
              <span class="invoice-meta-value">{{ formatDate(transaction?.created_at) }}</span>
            </div>
            <div class="invoice-meta-item">
              <span class="invoice-meta-label">Metode Bayar</span>
              <span class="invoice-meta-value">{{ transaction?.payment_data?.paymentName || transaction?.payment_data?.method || 'Transfer' }}</span>
            </div>
          </div>

          <hr class="invoice-divider" />

          <!-- Table-like Item List -->
          <table class="invoice-table">
            <thead>
              <tr>
                <th class="text-left">Deskripsi Layanan</th>
                <th class="text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ transaction?.description || 'Layanan Manajemen Iklan Digital' }}</td>
                <td class="text-right">{{ formatRupiah(transaction?.amount) }}</td>
              </tr>
              <tr v-if="Number(transaction?.fee_amount) > 0">
                <td>Biaya Layanan</td>
                <td class="text-right">{{ formatRupiah(transaction?.fee_amount) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="invoice-total-row">
                <td>Total Dibayar</td>
                <td class="text-right">{{ formatRupiah(Number(transaction?.amount || 0) + Number(transaction?.fee_amount || 0)) }}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Footer -->
          <div class="invoice-footer">
            <p>Dokumen ini merupakan bukti pembayaran yang sah.</p>
            <p>© {{ new Date().getFullYear() }} Tentaklik — tentaklik.com</p>
          </div>
        </div>
        </div> <!-- /invoice-scroll -->

        <!-- Action Buttons (sticky at bottom) -->
        <div class="invoice-actions">
          <button @click="downloadPdf" class="invoice-btn invoice-btn--outline">
            <LucideDownload class="w-4 h-4" />
            Download PDF
          </button>
          <button @click="shareInvoice" :disabled="isSharing" class="invoice-btn invoice-btn--primary" :style="isSharing ? 'opacity:0.7;cursor:wait' : ''">
            <svg v-if="isSharing" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
            <LucideShare2 v-else class="w-4 h-4" />
            {{ isSharing ? 'Memproses...' : 'Bagikan' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { LucideX, LucideDownload, LucideShare2 } from 'lucide-vue-next'
import { useToast } from '#imports'

const props = defineProps({
  isOpen: Boolean,
  transaction: {
    type: Object as () => any,
    required: false,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])
const toast = useToast()

const closeModal = () => emit('close')

const formatRupiah = (amount: number | string | undefined) => {
  if (amount === undefined || amount === null) return 'Rp0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount))
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateString))
}

const downloadPdf = () => {
  const t = props.transaction
  const orderId = t?.payment_data?.merchantOrderId || t?.id?.substring(0,8) || '-'
  const total = formatRupiah(Number(t?.amount || 0) + Number(t?.fee_amount || 0))
  const feeRow = Number(t?.fee_amount) > 0
    ? `<tr><td style="padding:10px 0;color:#374151;border-bottom:1px solid #f3f4f6">Biaya Layanan</td><td style="padding:10px 0;color:#374151;border-bottom:1px solid #f3f4f6;text-align:right">${formatRupiah(t?.fee_amount)}</td></tr>`
    : ''

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice ${orderId}</title>
<style>
  @page { margin: 1.5cm; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #111827; margin: 0; padding: 2rem; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
  .logo { height: 32px; }
  .title { font-size: 2rem; font-weight: 900; letter-spacing: 0.08em; margin: 0; }
  .badge { display: inline-block; padding: 3px 10px; background: #dcfce7; color: #15803d; font-size: 0.75rem; font-weight: 700; border-radius: 99px; margin-top: 4px; }
  .meta { margin-bottom: 1.5rem; }
  .meta-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.875rem; }
  .meta-label { color: #6b7280; }
  .meta-value { font-weight: 600; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 0 0 1rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th { text-align: left; padding: 8px 0; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #111827; color: #374151; }
  th:last-child { text-align: right; }
  td { padding: 10px 0; color: #374151; border-bottom: 1px solid #f3f4f6; }
  .total td { padding-top: 12px; font-weight: 800; font-size: 1.1rem; color: #111827; border-top: 2px solid #111827; border-bottom: none; }
  .footer { margin-top: 2rem; text-align: center; font-size: 0.75rem; color: #9ca3af; }
</style>
</head><body>
<div class="header">
  <img src="${window.location.origin}/logo-full.png" class="logo" alt="Tentaklik" />
  <div style="text-align:right">
    <p class="title">INVOICE</p>
    <span class="badge">✓ LUNAS</span>
  </div>
</div>
<div class="meta">
  <div class="meta-row"><span class="meta-label">No. Invoice</span><span class="meta-value">${orderId}</span></div>
  <div class="meta-row"><span class="meta-label">Tanggal</span><span class="meta-value">${formatDate(t?.created_at)}</span></div>
  <div class="meta-row"><span class="meta-label">Metode Bayar</span><span class="meta-value">${t?.payment_data?.paymentName || t?.payment_data?.method || 'Transfer'}</span></div>
</div>
<hr />
<table>
  <thead><tr><th>Deskripsi Layanan</th><th>Jumlah</th></tr></thead>
  <tbody>
    <tr><td style="padding:10px 0;color:#374151;border-bottom:1px solid #f3f4f6">${t?.description || 'Layanan Manajemen Iklan Digital'}</td><td style="padding:10px 0;color:#374151;border-bottom:1px solid #f3f4f6;text-align:right">${formatRupiah(t?.amount)}</td></tr>
    ${feeRow}
  </tbody>
  <tfoot><tr class="total"><td>Total Dibayar</td><td style="text-align:right">${total}</td></tr></tfoot>
</table>
<div class="footer">
  <p>Dokumen ini merupakan bukti pembayaran yang sah.</p>
  <p>© ${new Date().getFullYear()} Tentaklik — tentaklik.com</p>
</div>
</body></html>`

  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
      // Auto-close after print dialog closes
      printWindow.onafterprint = () => printWindow.close()
      // Fallback: close after a short delay if onafterprint doesn't fire
      setTimeout(() => {
        try { if (!printWindow.closed) printWindow.close() } catch {}
      }, 1000)
    }
  }
}

const isSharing = ref(false)

const shareInvoice = async () => {
  if (!props.transaction) return
  isSharing.value = true

  try {
    const { toPng } = await import('html-to-image')
    const invoiceEl = document.getElementById('invoice-print-area')
    if (!invoiceEl) throw new Error('Invoice element not found')

    const dataUrl = await toPng(invoiceEl, {
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      quality: 0.95
    })

    // Convert data URL to blob
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const file = new File([blob], `invoice-tentaklik-${props.transaction.payment_data?.merchantOrderId || 'receipt'}.png`, { type: 'image/png' })

    // Try Web Share API with file (works on mobile)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Invoice Tentaklik',
        text: `Bukti Pembayaran - ${formatRupiah(Number(props.transaction.amount || 0) + Number(props.transaction.fee_amount || 0))}`,
        files: [file]
      })
    } else {
      // Desktop fallback: download the image
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = file.name
      link.click()
      toast.addToast('Invoice berhasil diunduh sebagai gambar!', 'success')
    }
  } catch (err: any) {
    if (err.name === 'AbortError') return
    console.error('Share error:', err)
    toast.addToast('Gagal membagikan invoice', 'error')
  } finally {
    isSharing.value = false
  }
}
</script>

<style scoped>
/* ─── Overlay ─────────────────────────────────────────── */
.invoice-overlay {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.5); padding: 1rem;
}

/* ─── Modal Card ──────────────────────────────────────── */
.invoice-modal {
  position: relative;
  width: 100%; max-width: 520px;
  background: white; border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  overflow: hidden;
  display: flex; flex-direction: column;
  max-height: 90vh;
}

/* Close button */
.invoice-close {
  position: absolute; top: 12px; right: 12px; z-index: 10;
  background: white; border: 1px solid #e5e7eb; border-radius: 50%;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  color: #9ca3af; cursor: pointer; transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.invoice-close:hover { color: #111; border-color: #111; background: #f9fafb; }

/* Scrollable area */
.invoice-scroll {
  flex: 1; overflow-y: auto;
}

/* ─── Invoice Body ────────────────────────────────────── */
.invoice-body { padding: 2.5rem 2rem 1.25rem; }

/* Header */
.invoice-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 1.25rem;
}
.invoice-logo { height: 28px; }
.invoice-header-right { text-align: right; }
.invoice-title {
  font-size: 1.75rem; font-weight: 900; color: #111827;
  letter-spacing: 0.08em; line-height: 1; margin-bottom: 0.375rem;
}
.invoice-badge-lunas {
  display: inline-block;
  padding: 0.2rem 0.625rem;
  background: #dcfce7; color: #15803d;
  font-size: 0.6875rem; font-weight: 700;
  border-radius: 99px; letter-spacing: 0.04em;
}

/* Meta */
.invoice-meta {
  display: grid; grid-template-columns: 1fr; gap: 0.5rem;
  margin-bottom: 1rem;
}
.invoice-meta-item { display: flex; justify-content: space-between; }
.invoice-meta-label { font-size: 0.8125rem; color: #6b7280; }
.invoice-meta-value { font-size: 0.8125rem; font-weight: 600; color: #111827; text-align: right; }

.invoice-divider { border: none; border-top: 1px solid #e5e7eb; margin: 0 0 1rem; }

/* Table */
.invoice-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
.invoice-table th {
  padding: 0.5rem 0; font-weight: 700; color: #374151;
  border-bottom: 2px solid #111827; font-size: 0.75rem;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.invoice-table td {
  padding: 0.625rem 0; color: #374151; border-bottom: 1px solid #f3f4f6;
}
.invoice-table .text-right { text-align: right; }
.invoice-table .text-left { text-align: left; }

/* Total Row */
.invoice-total-row td {
  padding-top: 0.75rem;
  font-weight: 800; font-size: 1rem; color: #111827;
  border-bottom: none; border-top: 2px solid #111827;
}

/* Footer */
.invoice-footer {
  margin-top: 1.5rem; text-align: center;
  font-size: 0.6875rem; color: #9ca3af; line-height: 1.5;
}

/* ─── Actions ─────────────────────────────────────────── */
.invoice-actions {
  display: flex; gap: 0.75rem;
  padding: 1rem 2rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.invoice-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.625rem 1rem; border-radius: 0.75rem;
  font-size: 0.8125rem; font-weight: 700; cursor: pointer;
  transition: all 0.2s; border: none;
}
.invoice-btn--outline {
  background: white; border: 1px solid #d1d5db; color: #374151;
}
.invoice-btn--outline:hover { background: #f9fafb; }
.invoice-btn--primary {
  background: #f97316; color: white;
}
.invoice-btn--primary:hover { background: #ea580c; }
</style>
