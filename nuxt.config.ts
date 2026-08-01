// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@vee-validate/nuxt',
    'nuxt-security',
    '@nuxtjs/i18n',
  ],

  i18n: {
    locales: [
      { code: 'id', name: 'Bahasa Indonesia', file: 'id.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'id',
    langDir: '../app/locales/',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_lang',
      fallbackLocale: 'id',
    },
  },

  // Security Configuration
  security: {
    sri: false,
    csrf: true,
    requestSizeLimiter: {
      maxRequestSizeInBytes: 15000000,
      maxUploadFileRequestInBytes: 25000000,
    },
    headers: {
      crossOriginEmbedderPolicy: 'unsafe-none',
      crossOriginResourcePolicy: 'cross-origin',
      xFrameOptions: 'DENY',
      contentSecurityPolicy: {
        'img-src': ["'self'", "data:", "https://pjmsnphhnporuownasxe.supabase.co"],
      }
    },
    corsHandler: {
      origin: process.env.NODE_ENV === 'production' ? ['https://member.tentaklik.com'] : '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['*'],
      credentials: true
    },
    rateLimiter: {
      tokensPerInterval: 150,
      interval: 60000,
      headers: false,
    }
  },

  // Supabase config
  supabase: {
    redirect: false, // We'll handle auth redirects manually
    url: 'https://pjmsnphhnporuownasxe.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbXNucGhobnBvcnVvd25hc3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxODU0NDcsImV4cCI6MjA5OTc2MTQ0N30.nqxxJD-KqRcQjDrwEbyNBcKEiCY151_kNaBwk1APhbA',
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    types: false, // Disable database type generation to suppress warning
  },

  // Konfigurasi Nitro untuk deployment ke Cloudflare Pages
  nitro: {
    preset: 'cloudflare-pages',
  },

  // App metadata
  app: {
    head: {
      title: 'Member Tentaklik',
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
    metaTargetAccountId: '',
    tiktokAppSecret: '',
    tiktokAccessToken: '',
    googleAdsDevToken: '',
    googleClientId: '',
    googleClientSecret: '',
    googleRefreshToken: '',
    // Public keys (exposed to client)
    public: {
      appName: 'Tentaklik',
      supabaseUrl: '',
      supabaseKey: '',
      pricingMonthly: 150000,
      pricingQuarterly: 350000,
      pricingQuarterlyOriginal: 450000,
      pricingSemiannual: 792000,
      pricingSemiannualOriginal: 900000,
      managementFeeInfo: 'Rp 555.000,- per akun per bulan termasuk PPN',
      tiktokAdsEnabled: false,
    },
  },

  // Pre-bundle known dependencies to avoid runtime discovery warnings
  vite: {
    optimizeDeps: {
      include: [
        'lucide-vue-next',
        'pinia',
      ],
    },
  },
})
