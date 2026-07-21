export const getValidGoogleAccessToken = async (): Promise<string> => {
  const config = useRuntimeConfig()
  const clientId = config.googleClientId as string
  const clientSecret = config.googleClientSecret as string
  const refreshToken = config.googleRefreshToken as string
  
  // Jika config OAuth2 belum diset, return kosong agar API proxy tahu
  if (!clientId || !clientSecret || !refreshToken || refreshToken === 'your_google_refresh_token') {
    return ''
  }

  try {
    const response = await $fetch<any>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }).toString()
    })
    
    return response.access_token || ''
  } catch (error) {
    console.error('Gagal me-refresh token Google:', error)
    return ''
  }
}
