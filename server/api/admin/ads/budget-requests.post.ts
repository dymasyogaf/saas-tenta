import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const { action, request_id, reason } = body

  if (!request_id || !action || !['approve', 'reject'].includes(action)) {
    throw createError({ statusCode: 400, statusMessage: 'Parameter tidak valid' })
  }

  if (action === 'reject' && (!reason || typeof reason !== 'string')) {
     throw createError({ statusCode: 400, statusMessage: 'Alasan penolakan wajib diisi' })
  }

  const supabase = await serverSupabaseServiceRole<any>(event)

  // 1. Get request
  const { data: request, error: reqErr } = await supabase
    .from('ad_budget_requests')
    .select('*, ad_accounts(saldo)')
    .eq('id', request_id)
    .single()

  if (reqErr || !request) {
    throw createError({ statusCode: 404, statusMessage: 'Request tidak ditemukan' })
  }

  if (request.status !== 'pending') {
    throw createError({ statusCode: 400, statusMessage: 'Request ini sudah diproses sebelumnya' })
  }

  // 2. Get user saldo
  const { data: saldoData, error: saldoErr } = await supabase
    .from('saldo')
    .select('*')
    .eq('user_id', request.user_id)
    .single()

  if (saldoErr || !saldoData) {
    throw createError({ statusCode: 500, statusMessage: 'Data saldo tidak ditemukan' })
  }

  const amount = Number(request.amount)
  
  if (action === 'approve') {
    // 3. Approve logic
    const newPending = Number(saldoData.pending_balance || 0) - amount
    const newBalance = Number(saldoData.balance) - amount
    
    // Update saldo
    await supabase.from('saldo').update({ pending_balance: newPending, balance: newBalance }).eq('user_id', request.user_id)
    
    // Update ad_account saldo
    const newAdSaldo = Number(request.ad_accounts.saldo || 0) + amount
    await supabase.from('ad_accounts').update({ saldo: newAdSaldo }).eq('id', request.ad_account_id)
    
    // Update request status
    await supabase.from('ad_budget_requests').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', request_id)
    
    // Update transaction if exists
    if (request.transaction_id) {
      await supabase.from('transactions').update({ status: 'success' }).eq('id', request.transaction_id)
    }

    // Create Notification
    await supabase.from('notifications').insert({
      user_id: request.user_id,
      type: 'budget_approved',
      title: 'Top Up Anggaran Disetujui',
      message: `Permintaan alokasi anggaran sebesar Rp ${amount.toLocaleString('id-ID')} telah berhasil dimasukkan ke akun iklan Anda.`,
      created_at: new Date().toISOString()
    })

    return { success: true, message: 'Anggaran berhasil disetujui dan ditambahkan.' }
  } else if (action === 'reject') {
    // 4. Reject logic
    const newPending = Number(saldoData.pending_balance || 0) - amount
    
    // Refund / release pending balance
    await supabase.from('saldo').update({ pending_balance: newPending }).eq('user_id', request.user_id)
    
    // Update request
    await supabase.from('ad_budget_requests').update({ status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() }).eq('id', request_id)
    
    // Update transaction if exists
    if (request.transaction_id) {
      await supabase.from('transactions').update({ status: 'failed' }).eq('id', request.transaction_id)
    }
    
    // Create Notification
    await supabase.from('notifications').insert({
      user_id: request.user_id,
      type: 'budget_rejected',
      title: 'Top Up Anggaran Ditolak',
      message: `<p>Permintaan alokasi sebesar <strong>Rp ${amount.toLocaleString('id-ID')}</strong> ditolak.</p><p><strong>Alasan:</strong></p>${reason}`,
      created_at: new Date().toISOString()
    })

    return { success: true, message: 'Pengajuan anggaran berhasil ditolak dan saldo dikembalikan.' }
  }
})
