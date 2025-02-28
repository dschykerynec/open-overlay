<template>
  <div class="telemetry-overlay">
    <div class="telemetry-row">
      <div class="input-container input-graph-container">
        <Line id="my-chart-id" class="graph" :options="chartOptions" :data="chartData" />
      </div>
      <div class="input-container input-bar-container">
        <div class="input-bar brake"
          :style="{ height: pedalInputs[pedalInputs.length - 1].brakeInputValue * 100 + '%', width: '100%' }"></div>
      </div>
      <div class="input-container input-bar-container">
        <div class="input-bar throttle"
          :style="{ height: pedalInputs[pedalInputs.length - 1].throttleInputValue * 100 + '%', width: '100%' }"></div>
      </div>
      <div class="input-container misc-container">
        <div class="misc-item steering-telemetry">
          <img :src="steeringWheelImage" alt="steering-wheel" width="52" height="52"
            :style="{ transform: `rotate(${steeringAngle})`, /*filter: `invert(100%) brightness(100%)`*/ }" />
        </div>
        <div class="misc-item" style="margin-bottom: -3px;">
          <div style="font-weight: bold; font-size: 2em;">{{ gear }}</div>
        </div>
        <div class="misc-item" style="margin-bottom: -2px;">
          <div style="font-size: 0.8em;">mph</div>
        </div>
        <div class="misc-item" style="margin-bottom: -1px;">
          <div style="font-size: 1.2em;">{{ speed }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'

import steeringWheelImage from '@renderer/assets/steering-wheel-colored.png'

import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale } from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale)

import { Telemetry } from '@preload/index.d'
// import log from 'electron-log/renderer'

const pedalInputs = ref<Array<{ brakeInputValue: number, throttleInputValue: number }>>(Array(200).fill({ brake: 0.00, throttle: 0.00 }))
const steeringAngle = ref('0rad')
const gear = ref('N')
const speed = ref(0)

const chartData = computed(() => {
  const last150Inputs = pedalInputs.value.slice(-150)
  return {
    labels: last150Inputs.map((_, index) => index),
    datasets: [
      {
        label: 'Brake Input',
        borderColor: 'red',
        borderWidth: 2.0,
        data: last150Inputs.map(input => input.brakeInputValue),
        fill: false,
        cubicInterpolationMode: 'monotone' as const,
      },
      {
        label: 'Throttle Input',
        borderColor: '#06ba12',
        borderWidth: 2.0,
        data: last150Inputs.map(input => input.throttleInputValue),
        fill: false,
        cubicInterpolationMode: 'monotone' as const,
      }
    ]
  }
})

const chartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  pointRadius: 0, // Remove points
  pointHoverRadius: 0, // Remove points on hover
  scales: {
    x: {
      display: false,
      ticks: {
        display: false // Hide x-axis labels
      },
      grid: {
        display: false // Remove x-axis grid
      },
      border: {
        display: false // Remove y-axis border
      }
    },
    y: {
      display: false,

      ticks: {
        display: false // Hide y-axis labels
      },
      grid: {
        display: false // Remove y-axis grid
      },
      min: 0, // Set minimum value of y-axis
      max: 1, // Set maximum value of y-axis
      border: {
        display: false // Remove y-axis border
      }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false }
  }
}

onMounted(() => {
  // process the incoming telemetry data being sent from the main process
  window.electronAPI.onSdkTelemetryUpdate((telemetry: Telemetry) => {
    // add the new telemetry data to the pedalInputs array, and remove the oldest data
    pedalInputs.value.push({ brakeInputValue: telemetry.BrakeInputValue, throttleInputValue: telemetry.ThrottleInputValue })
    pedalInputs.value.shift()

    // not sure why the steering angle is negative, but it is
    steeringAngle.value = `${telemetry.SteeringInputValue * -1}rad`

    // gear value is a positive integer when in gear, 0 when in neutral, and negative when in reverse
    if (telemetry.GearValue > 0) {
      gear.value = telemetry.GearValue.toString()
    }
    else if (telemetry.GearValue === 0) {
      gear.value = 'N'
    }
    else {
      gear.value = 'R'
    }

    // Convert m/s to mph
    speed.value = Math.floor(telemetry.SpeedValue * 2.23694)
  })
})

</script>

<style lang="scss" scoped>
.telemetry-overlay {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: black;
}

.telemetry-row {
  display: flex;
  justify-content: space-between;
  margin: 5px;
  height: 130px;
}

.input-graph-container {
  width: 210px;
  background-color: #404040;
}

.input-bar-container {
  width: 15px;
  background-color: #404040;

  position: relative;
  overflow: hidden;
}

.misc-container {
  width: 90px;
  display: flex;
  flex-direction: column;
  justify-content: start;
  padding: 5px 0px;
  color: white;
  background-color: #404040;
}

.misc-item {
  display: flex;
  justify-content: center;
}

.input-bar {
  position: absolute;
  bottom: 0;
}

.throttle {
  background-color: #06ba12;
}

.brake {
  background-color: red;
}
</style>