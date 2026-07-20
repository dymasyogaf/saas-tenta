import { defineStore } from 'pinia'

export interface AppNotification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as AppNotification[],
    isLoading: false,
    subscription: null as any
  }),
  
  getters: {
    unreadCount: (state) => state.notifications.filter(n => !n.is_read).length,
    allNotifications: (state) => state.notifications
  },
  
  actions: {
    async fetchNotifications() {
      this.isLoading = true
      const user = useSupabaseUser()
      if (!user.value) {
        this.isLoading = false
        return
      }

      const supabase = useSupabaseClient<any>()
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.value.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        
        if (data) {
          this.notifications = data
        }
      } catch (e: any) {
        console.error('Failed to fetch notifications:', e.message)
      } finally {
        this.isLoading = false
      }
    },

    async markAsRead(notificationId: string) {
      const supabase = useSupabaseClient<any>()
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId)
          
        if (error) throw error
        
        const notif = this.notifications.find(n => n.id === notificationId)
        if (notif) {
          notif.is_read = true
        }
      } catch (e: any) {
        console.error('Failed to mark notification as read:', e.message)
      }
    },
    
    async markAllAsRead() {
      const user = useSupabaseUser()
      if (!user.value) return
      
      const supabase = useSupabaseClient<any>()
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.value.id)
          .eq('is_read', false)
          
        if (error) throw error
        
        this.notifications.forEach(n => n.is_read = true)
      } catch (e: any) {
        console.error('Failed to mark all notifications as read:', e.message)
      }
    },

    setupRealtimeSubscription() {
      const user = useSupabaseUser()
      if (!user.value || this.subscription) return

      const supabase = useSupabaseClient<any>()
      const userId = user.value.id
      
      this.subscription = supabase
        .channel('public:notifications')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, (payload: any) => {
          this.notifications.unshift(payload.new as AppNotification)
          
          try {
            const toast = useToast()
            toast.addToast(`Notifikasi Baru: ${payload.new.title}`, 'success')
          } catch (e) {}
        })
        .subscribe()
    },

    unsubscribeRealtime() {
      if (this.subscription) {
        const supabase = useSupabaseClient<any>()
        supabase.removeChannel(this.subscription)
        this.subscription = null
      }
    }
  }
})
