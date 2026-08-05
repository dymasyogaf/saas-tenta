import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    // PROTECT: Pastikan hanya pengguna terautentikasi yang bisa trigger webhook
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const body = await readBody(event)
    
    // Webhook URL dari Google Apps Script
    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzMwmKui5wpknkTOGZfjvKhdq66g4hx9BgYBDy72uNyFw2yuinT9w6n0rr7Q6yuVCkE/exec'
    
    const response = await $fetch(WEBHOOK_URL, {
      method: 'POST',
      body: body // body sudah berupa JSON object (nama, nik, tgl lahir, email, no_hp)
    })
    
    return {
      success: true,
      data: response
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengirim data ke webhook'
    })
  }
})
