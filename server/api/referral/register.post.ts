import { serverSupabaseServiceRole } from '#supabase/server'
import { requireUser } from '../../utils/requireUser'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const uid = user.id || (user as any).sub
  if (!uid) {
    throw createError({ statusCode: 401, message: 'User ID not found' })
  }

  const host = getRequestHost(event) || ''
  const isGlobal = host.startsWith('area.')

  const supabase = await serverSupabaseServiceRole(event)

  const body = await readBody(event)
  const { fullName, bankName, bankAccount, accountName, payoutType, walletAddress } = body || {}

  const isCrypto = payoutType === 'crypto' || isGlobal || (walletAddress && walletAddress.startsWith('T'))

  if (isCrypto) {
    if (!fullName || !walletAddress) {
      throw createError({ statusCode: 400, message: isGlobal ? 'Please provide Full Name and USDT TRC-20 Wallet Address' : 'Harap lengkapi Nama Lengkap dan Alamat Wallet USDT TRC-20' })
    }
    if (!walletAddress.startsWith('T') || walletAddress.length < 25) {
      throw createError({ statusCode: 400, message: isGlobal ? 'Invalid TRON (TRC-20) address format. Must start with T' : 'Alamat TRC-20 tidak valid. Harus diawali dengan huruf T' })
    }
  } else {
    if (!fullName || !bankName || !bankAccount || !accountName) {
      throw createError({ statusCode: 400, message: 'Harap lengkapi semua data formulir (Nama, Bank, No. Rekening, Atas Nama)' })
    }
  }

  try {
    // Save bank details or crypto wallet to affiliate_profiles (UPSERT)
    const profilePayload: any = {
      user_id: uid,
      full_name: fullName,
      bank_name: isCrypto ? 'USDT TRC-20' : bankName,
      bank_account: isCrypto ? walletAddress : bankAccount,
      account_name: isCrypto ? fullName : accountName
    }

    const { error: profileError } = await (supabase as any)
      .from('affiliate_profiles')
      .upsert(profilePayload, { onConflict: 'user_id' })

    if (profileError) {
      console.error('Profile Insert Error:', profileError)
      throw createError({ statusCode: 500, message: isGlobal ? `Failed to save affiliate profile: ${profileError.message}` : `Gagal menyimpan profil afiliasi: ${profileError.message}` })
    }

    // Check if user already has a referral code
    const { data: existingCode } = await (supabase as any)
      .from('referral_codes')
      .select('code')
      .eq('user_id', uid)
      .single()

    if (existingCode) {
      return { success: true, code: existingCode.code }
    }

    // Generate code using Postgres function
    const { data: newCode, error: rpcError } = await (supabase as any).rpc('generate_referral_code')
    
    if (rpcError) {
      console.error('RPC Error:', rpcError)
      throw createError({ statusCode: 500, message: isGlobal ? 'Failed to generate referral code' : 'Gagal membuat kode referral' })
    }

    // Save to referral_codes table
    const { error: insertError } = await (supabase as any)
      .from('referral_codes')
      .insert({
        user_id: uid,
        code: newCode
      })

    if (insertError) {
      console.error('Insert Error:', insertError)
      throw createError({ statusCode: 500, message: isGlobal ? `Failed to save code: ${insertError.message}` : `Gagal menyimpan kode: ${insertError.message}` })
    }

    return {
      success: true,
      code: newCode
    }
  } catch (error: any) {
    console.error('Referral Register Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || (isGlobal ? 'Server error processing registration' : 'Terjadi kesalahan pada server')
    })
  }
})
