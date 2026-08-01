import { serverSupabaseClient } from '#supabase/server'
import { requireUser } from '../../utils/requireUser'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const body = await readBody(event)
  const { accountId, dailyLimit } = body

  if (!accountId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Account ID is required',
    })
  }
  const supabase = await serverSupabaseClient<any>(event)
  // Verify ownership
  const { data: account, error: accError } = await supabase
    .from('ad_accounts')
    .select('id, user_id')
    .eq('id', accountId)
    .single()

  if (accError || !account) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Account not found',
    })
  }
  const userId = user.id || (user as any).sub
  
  if (String(account.user_id) !== String(userId)) {
    console.error('Forbidden error:', { accountUserId: account.user_id, userId })
    throw createError({
      statusCode: 403,
      statusMessage: `Forbidden: Account owner ${account.user_id} !== current user ${userId}`,
    })
  }

  // Update daily limit
  const { error: updateError } = await supabase
    .from('ad_accounts')
    .update({ daily_limit: dailyLimit })
    .eq('id', accountId)

  if (updateError) {
    console.error('Error updating daily limit:', updateError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update daily limit',
    })
  }

  return {
    success: true,
    message: 'Limit harian berhasil diatur',
  }
})
