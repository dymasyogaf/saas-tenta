// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@vee-validate/nuxt',
  ],

  // Supabase config (keys will come from .env)
  supabase: {
    redirect: false, // We'll handle auth redirects manually
  },

  // App metadata
  app: {
    head: {
      title: 'Tentaklik SaaS',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Platform manajemen iklan digital — Meta, Google, TikTok Ads' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap',
        },
      ],
    },
  },

  // Runtime config for server-side API keys
  runtimeConfig: {
    // Server-only keys (never exposed to client)
    duidkuMerchantCode: '',
    duidkuApiKey: '',
    duidkuSecretKey: '',
    fonnteApiToken: '',
    metaAppSecret: '',
    metaAccessToken: '',
    tiktokAppSecret: '',
    googleAdsDevToken: '',
    googleClientSecret: '',
    // Public keys (exposed to client)
    public: {
      appName: 'Tentaklik',
      supabaseUrl: '',
      supabaseKey: '',
    },
  },
})
