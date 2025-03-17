<template>
  <div class="main-menu-window">
    <div class="side-bar">
      <h2 style="margin-top: 0">Open Overlay</h2>

      <div class="side-bar-item">
        <button @click="selectSettingsWindow('GeneralSettings')">General</button>
      </div>
      <div class="side-bar-item">
        <button @click="selectSettingsWindow('TelemetryOverlaySettings')">Telemetry Overlay</button>
      </div>
    </div>
    <div class="settings-window">
      <component :is="windows[selectedWindow]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import GeneralSettings from '@components/mainMenu/GeneralSettings.vue'
import TelemetryOverlaySettings from '@components/mainMenu/TelemetryOverlaySettings.vue'

const selectedWindow = ref<string>('GeneralSettings')
const windows = {
  GeneralSettings,
  TelemetryOverlaySettings
}

function selectSettingsWindow(window: string) {
  selectedWindow.value = window
}

onMounted(() => {})
</script>

<style lang="scss" scoped>
.main-menu-window {
  height: 100%;
  width: 100%;
  display: flex;

  .side-bar {
    width: 20%;
    background-color: #333;
    padding: 10px;
    box-sizing: border-box;

    display: flex;
    flex-direction: column;
    row-gap: 10px;

    color: white;
  }

  .settings-window {
    flex-grow: 1;
    padding: 10px;
    box-sizing: border-box;
  }
}
</style>
