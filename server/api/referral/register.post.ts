import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const uid = user.id || (user as any).sub
  if (!uid) {
    throw createError({ statusCode: 401, message: 'User ID not found' })
  }

  const supabase = await serverSupabaseServiceRole(event)

  try {
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
      throw createError({ statusCode: 500, message: 'Gagal membuat kode referral' })
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
      throw createError({ statusCode: 500, message: `Gagal menyimpan kode: ${insertError.message}` })
    }

    return {
      success: true,
      code: newCode
    }
  } catch (error: any) {
    console.error('Referral Register Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Terjadi kesalahan pada server'
    })
  }
})
