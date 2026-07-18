import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    // Ambil semua request yang sudah disetujui (Approved) oleh Tim Audit
    // Karena hanya yang Approved yang boleh dibuatkan akun iklannya oleh Tim Ads Ops
    const { data, error } = await supabase
      .from('ad_account_requests')
      .select(`
        id, 
        user_id, 
        platform, 
        target_url, 
        status, 
        details, 
        created_at,
        users(full_name, email)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Jika foreign key users() gagal/tidak ada, kita bisa fetch manual
    let requests = data || []
    
    // Validasi apakah users() terisi. Jika tidak, fetch manual (jaga-jaga jika RLS/FK error)
    if (requests.length > 0 && !requests[0].users) {
      const userIds = [...new Set(requests.map(r => r.user_id))]
      const { data: usersData } = await supabase.from('users').select('id, full_name, email').in('id', userIds)
      
      requests = requests.map(r => {
        const u = usersData?.find(user => user.id === r.user_id)
        return { ...r, users: u || { full_name: 'Unknown', email: 'Unknown' } }
      })
    }

    return requests
  } catch (error: any) {
    console.error('Error fetching ads ops requests:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data antrean Ads Ops'
    })
  }
})
