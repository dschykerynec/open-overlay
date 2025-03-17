<template>
  <div>general settings</div>
  <button @click="toggleDraggable">
    {{ isDraggable ? 'turn off drag' : 'turn on drag' }}
  </button>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const isDraggable = ref<boolean>(false)

function toggleDraggable() {
  isDraggable.value = !isDraggable.value
  console.log('sending message to turn off draggable')
  window.electronAPI.sendMessage({ name: 'windows-draggable', value: isDraggable.value })
}

onMounted(() => {
  console.log('General Settings mounted')
})
</script>

<style lang="scss" scoped></style>
