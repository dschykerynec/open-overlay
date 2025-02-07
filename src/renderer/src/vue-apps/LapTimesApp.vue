<template>
    <div class="lap-times">
        <h2>Lap Times .vue</h2>
    </div>
</template>

<script setup lang="ts">
import { onMounted, /*ref*/ } from 'vue'

// import { TelemetryValue } from 'src/preload/index.d'

// const lapTimes = ref<Array<TelemetryValue>>([])

onMounted(() => {
    // window.electronAPI.onSdkTelemetryUpdate((lapTime: TelemetryValue) => {
    //   console.log(lapTime);
    //   lapTimes.value.unshift(lapTime)
    // })
})

</script>

<style lang="scss" scoped>
.no-lap-times {
    color: red;
}
</style>