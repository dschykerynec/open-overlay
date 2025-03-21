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
  window.electronAPI.sendMessage({ name: 'windows-draggable', value: isDraggable.value })
}

onMounted(() => {})
</script>

<style lang="scss" scoped></style>
