import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    const user_id = user.id || (user as any).sub

    const body = await readBody(event)
    const { amount, ad_account_id, description } = body

    if (!amount || amount < 10000) {
      throw createError({ statusCode: 400, message: 'Nominal alokasi minimal Rp 10.000' })
    }

    if (!ad_account_id) {
      throw createError({ statusCode: 400, message: 'Target Akun Iklan wajib dipilih' })
    }

    const supabaseAdmin = serverSupabaseServiceRole<any>(event)

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('allocate_balance', {
      p_user_id: user_id,
      p_ad_account_id: ad_account_id,
      p_amount: amount,
      p_description: description || null
    })

    if (rpcError) {
      throw createError({ statusCode: 500, message: rpcError.message || 'Gagal mengalokasikan saldo' })
    }

    if (!rpcResult?.success) {
      throw createError({ statusCode: 400, message: rpcResult?.error || 'Gagal mengalokasikan saldo' })
    }

    return {
      success: true,
      message: 'Alokasi saldo otomatis berhasil',
      new_balance: rpcResult.new_balance
    }
    
  } catch (error: any) {
    console.error('Transfer API Error:', error)
    return createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Terjadi kesalahan pada server'
    })
  }
})
