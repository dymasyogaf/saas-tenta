<template>
  <div 
    class="inline-block relative"
    @mouseenter="show"
    @mouseleave="hide"
    ref="triggerRef"
  >
    <slot />
    
    <Teleport to="body">
      <Transition name="fade">
        <div 
          v-if="isVisible"
          class="fixed z-[9999] p-2.5 bg-ink-900 text-white text-xs font-normal rounded-lg shadow-lg whitespace-normal leading-relaxed pointer-events-none"
          :style="tooltipStyle"
          ref="tooltipRef"
        >
          {{ text }}
          <div class="absolute w-2 h-2 bg-ink-900 rotate-45" :style="arrowStyle"></div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onUnmounted } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  width: {
    type: String,
    default: '16rem'
  }
})

const isVisible = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)

const tooltipStyle = reactive({
  top: '0px',
  left: '0px',
  width: props.width
})

const arrowStyle = reactive({
  bottom: '-4px',
  top: 'auto',
  left: '50%',
  transform: 'translateX(-50%) rotate(45deg)'
})

const updatePosition = () => {
  if (!triggerRef.value || !tooltipRef.value) return
  
  const triggerRect = triggerRef.value.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()
  
  // Position above the trigger
  let top = triggerRect.top - tooltipRect.height - 8
  let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
  
  let arrowLeft = '50%'
  
  // Prevent left overflow
  if (left < 10) {
    const shift = 10 - left
    left = 10
    arrowLeft = `calc(50% - ${shift}px)`
  }
  
  // Prevent right overflow
  if (left + tooltipRect.width > window.innerWidth - 10) {
    const shift = (left + tooltipRect.width) - (window.innerWidth - 10)
    left -= shift
    arrowLeft = `calc(50% + ${shift}px)`
  }

  // Prevent top overflow
  if (top < 10) {
    // If it doesn't fit on top, put it below
    top = triggerRect.bottom + 8
    arrowStyle.bottom = 'auto'
    arrowStyle.top = '-4px'
  } else {
    arrowStyle.bottom = '-4px'
    arrowStyle.top = 'auto'
  }
  
  tooltipStyle.top = `${top}px`
  tooltipStyle.left = `${left}px`
  arrowStyle.left = arrowLeft
}

let scrollListener: () => void

const show = async () => {
  isVisible.value = true
  await nextTick()
  updatePosition()
  
  scrollListener = () => {
    if (isVisible.value) {
      updatePosition()
    }
  }
  window.addEventListener('scroll', scrollListener, true)
  window.addEventListener('resize', scrollListener, true)
}

const hide = () => {
  isVisible.value = false
  if (scrollListener) {
    window.removeEventListener('scroll', scrollListener, true)
    window.removeEventListener('resize', scrollListener, true)
  }
}

onUnmounted(() => {
  if (scrollListener) {
    window.removeEventListener('scroll', scrollListener, true)
    window.removeEventListener('resize', scrollListener, true)
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
