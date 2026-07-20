import { defineStore } from 'pinia'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: string
  is_2fa_enabled: boolean
  phone_verified: boolean
  profile_verified?: boolean
}

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null as UserProfile | null,
    isLoading: false,
    error: null as string | null
  }),
  
  actions: {
    async fetchProfile() {
      this.isLoading = true
      this.error = null
      
      const user = useSupabaseUser()
      if (!user.value) {
        this.profile = null
        this.isLoading = false
        return
      }

      const supabase = useSupabaseClient<any>()
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.value.id)
          .single()

        if (error) throw error
        
        const isVerified = user.value.user_metadata?.profile_verified === true

        if (data) {
          this.profile = {
            ...data,
            profile_verified: isVerified
          }
        }
      } catch (e: any) {
        console.error('Failed to fetch user profile:', e.message)
        this.error = e.message
      } finally {
        this.isLoading = false
      }
    },
    
    async updateProfile(updates: Partial<UserProfile>) {
      const user = useSupabaseUser()
      if (!user.value) return false
      
      const supabase = useSupabaseClient<any>()
      try {
        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.value.id)
          
        if (error) throw error
        
        if (this.profile) {
          this.profile = { ...this.profile, ...updates }
        }
        return true
      } catch (e: any) {
        console.error('Failed to update user profile:', e.message)
        return false
      }
    }
  }
})
