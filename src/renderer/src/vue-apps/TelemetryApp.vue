<template>
  <div class="overlay-wrapper">
    <div class="p2p-wrapper" v-if="carHasP2P">
      <div :class="p2pClass"></div>
      <div class="p2p-row">
        <div class="p2p-col" style="justify-content: start">
          <div>OTS: {{ P2PStatusText }}</div>
        </div>
        <div class="p2p-col" style="justify-content: center">
          <div>{{ P2PCount }}s</div>
        </div>
        <div class="p2p-col" style="justify-content: end; margin-right: 20px">
          <div class="cooldown-container" v-if="showCooldownTimer || true">
            <div class="cooldown-circle">
              <div class="cooldown-mask" :style="maskStyle"></div>
              <!-- <div class="cooldown-counter">{{ Math.ceil(P2PCooldown) }}</div> -->
            </div>
          </div>
        </div>
      </div>
    </div>
    <div :class="{ 'telemetry-overlay': true, draggable: isDraggable }">
      <div class="telemetry-row">
        <div class="input-container input-graph-container">
          <Line id="my-chart-id" class="graph" :options="chartOptions" :data="chartData" />
        </div>
        <div class="input-container pedal-input">
          <div class="input-bar-label">{{ currentPedalInputs.brake }}</div>
          <div class="input-bar-container">
            <div
              class="input-bar brake"
              :style="{
                height: currentPedalInputs.brake + '%',
                width: '100%'
              }"
            ></div>
          </div>
        </div>
        <div class="input-container pedal-input">
          <div class="input-bar-label">
            {{ currentPedalInputs.throttle }}
          </div>
          <div class="input-bar-container">
            <div
              class="input-bar throttle"
              :style="{
                height: currentPedalInputs.throttle + '%',
                width: '100%'
              }"
            ></div>
          </div>
        </div>
        <div class="input-container speed-container">
          <div class="speed-item" style="margin-top: -3px; margin-bottom: -3px">
            <div style="font-weight: 600; font-size: 3.5em">{{ gear }}</div>
          </div>
          <div class="speed-item" style="margin-bottom: -8px">
            <div style="font-size: 1.6em">{{ speed }}</div>
          </div>
          <div class="speed-item" style="margin-bottom: -2px">
            <div style="font-size: 1em">mph</div>
          </div>
        </div>
        <div class="input-container steering-container">
          <div class="speed-item steering-telemetry">
            <img
              :src="steeringWheelImage"
              alt="steering-wheel"
              width="78"
              height="78"
              :style="{
                transform: `rotate(${steeringAngle})`
              }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'

import steeringWheelImage from '@renderer/assets/steering-wheel-colored.png'

import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale
} from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale)

const pedalInputs = ref<
  Array<{ brakeInputValue: number; throttleInputValue: number; clutchInputValue: number }>
>(Array(150).fill({ brake: 0.0, throttle: 0.0 }))

const currentPedalInputs = computed(() => {
  const lastInput = pedalInputs.value[pedalInputs.value.length - 1]
  return {
    brake: Math.round(lastInput?.brakeInputValue * 100) || 0,
    throttle: Math.round(lastInput?.throttleInputValue * 100) || 0,
    clutch: Math.round(lastInput?.clutchInputValue * 100) || 0
  }
})

const steeringAngle = ref('0rad')
const gear = ref('N')
const speed = ref(0)
const clutchColor = '#145efc'

const chartData = computed(() => {
  const last150Inputs = pedalInputs.value.slice(-150)
  return {
    labels: last150Inputs.map((_, index) => index),
    datasets: [
      {
        label: 'Brake Input',
        borderColor: 'red',
        borderWidth: 2.0,
        data: last150Inputs.map((input) => input.brakeInputValue),
        fill: false,
        cubicInterpolationMode: 'monotone' as const
      },
      {
        label: 'Throttle Input',
        borderColor: '#06ba12',
        borderWidth: 2.0,
        data: last150Inputs.map((input) => input.throttleInputValue),
        fill: false,
        cubicInterpolationMode: 'monotone' as const
      },
      {
        label: 'Clutch Input',
        borderColor: clutchColor,
        borderWidth: 2.0,
        data: last150Inputs.map((input) => input.clutchInputValue),
        fill: false,
        cubicInterpolationMode: 'monotone' as const
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

const P2PStatus = ref(false)
const P2PCount = ref(0)
const P2PMaxCooldown = 100
const P2PCooldown = ref(0)

const carScreenName = ref('')

const isDraggable = ref(false)

const p2pClass = computed(() => {
  return {
    'p2p-background-wrapper': true,
    'p2p-enabled': P2PStatus.value,
    'p2p-enabled-low-charge': P2PStatus.value && P2PCount.value < 20,
    'p2p-disabled-available': !P2PStatus.value && P2PCooldown.value === 0,
    'p2p-disable-cooling-down': !P2PStatus.value && P2PCooldown.value > 0,
    'p2p-depleted': P2PCount.value === 0
  }
})

const P2PStatusText = computed(() => {
  if (P2PCount.value <= 0) {
    return 'DEPLETED'
  } else if (P2PStatus.value) {
    return 'ENABLED'
  } else {
    return 'DISABLED'
  }
})

const showCooldownTimer = computed(() => {
  return sessionTypeIsRace && P2PCount.value > 0
})

const maskStyle = computed(() => {
  // Calculate percentage of cooldown remaining
  const percentage = P2PCooldown.value / P2PMaxCooldown
  // Convert to degrees (0-360)
  const degrees = 360 * percentage

  return {
    background: `conic-gradient(white ${degrees}deg, transparent ${degrees}deg)`,
    width: `20px`,
    height: `20px`
  }
})

const carHasP2P = computed(() => {
  if (carScreenName.value === '') {
    return false
  }
  const carsWithP2P = ['Super Formula SF23 - Honda', 'Super Formula SF23 - Toyota']
  return carsWithP2P.includes(carScreenName.value)
})

const sessionType = ref('')
const sessionTypeIsRace = computed(() => sessionType.value.toLowerCase() === 'race')

onMounted(() => {
  let intervalId: number
  // process the incoming telemetry data being sent from the main process
  window.electronAPITelemetry.onSdkTelemetryUpdate((telemetry: Telemetry) => {
    // add the new telemetry data to the pedalInputs array, and remove the oldest data
    pedalInputs.value.push({
      brakeInputValue: telemetry.BrakeInputValue,
      throttleInputValue: telemetry.ThrottleInputValue,
      clutchInputValue: telemetry.ClutchInputValue
    })
    pedalInputs.value.shift()

    // not sure why the steering angle is negative, but it is
    steeringAngle.value = `${telemetry.SteeringInputValue * -1}rad`

    // gear value is a positive integer when in gear, 0 when in neutral, and negative when in reverse
    if (telemetry.GearValue > 0) {
      gear.value = telemetry.GearValue.toString()
    } else if (telemetry.GearValue === 0) {
      gear.value = 'N'
    } else {
      gear.value = 'R'
    }

    // Convert m/s to mph
    speed.value = Math.floor(telemetry.SpeedValue * 2.23694)

    // if the P2P was just turned on, start the 100s cooldown timer
    if (
      sessionType.value.toLowerCase() === 'race' &&
      telemetry.P2PStatus === false &&
      P2PStatus.value === true
    ) {
      window.clearInterval(intervalId)
      P2PCooldown.value = P2PMaxCooldown
      intervalId = window.setInterval(() => {
        P2PCooldown.value--
        if (P2PCooldown.value <= 0) {
          clearInterval(intervalId)
        }
      }, 1000)
    }
    P2PStatus.value = telemetry.P2PStatus
    P2PCount.value = telemetry.P2PCount
  })

  window.electronAPITelemetry.firstSessionInfo((sessionInfo: any) => {
    carScreenName.value = sessionInfo.driverCarName
  })

  window.electronAPITelemetry.sessionInfoUpdate((sessionInfo: SessionInfo) => {
    sessionType.value = sessionInfo.sessionType
    carScreenName.value = sessionInfo.carScreenName
  })

  window.electronAPITelemetry.windowsDraggable((value: boolean) => {
    isDraggable.value = value
  })
})
</script>

<style lang="scss" scoped>
$overlay-height: 169px;

.overlay-wrapper {
  height: $overlay-height;
  display: flex;
  flex-direction: column;
}

.telemetry-overlay {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: black;
  border-top-right-radius: 67px;
  border-bottom-right-radius: 67px;

  font-family: 'Open Sans', sans-serif;
  font-weight: 400;
  font-style: normal;
}

.draggable {
  user-select: none;
  -webkit-user-select: none;
  -webkit-app-region: drag;
}

.telemetry-row {
  display: flex;
  justify-content: space-between;
  margin: 5px;
  height: 130px;
}

.input-graph-container {
  width: 300px;
  background-color: #404040;
}

.pedal-input {
  width: 22px;

  position: relative;
  overflow: hidden;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
  row-gap: 5px;
}

.input-bar-label {
  height: 10%;
  // background-color: #404040;
  font-size: 0.8em;
  color: white;
  text-align: center;
}

.input-bar-container {
  flex-grow: 1;
  background-color: #404040;

  position: relative;
  overflow: hidden;
}

.speed-container {
  width: 80px;
  display: flex;
  flex-direction: column;
  justify-content: start;
  padding: 5px 0px;
  color: white;
  background-color: #404040;
}

.speed-item {
  display: flex;
  justify-content: center;
}

.steering-container {
  width: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 5px 0px;
  color: white;
  background-color: #404040;
  border-top-right-radius: 50%;
  border-bottom-right-radius: 50%;
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

.p2p-background-wrapper {
  height: 99px;
  width: calc(100% - 16px);
  overflow: hidden;
  position: absolute;
  z-index: -1;
  border-top-right-radius: 50px;
  // border-bottom-right-radius: 67px;
}

.p2p-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  box-sizing: border-box;
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 8px;
  padding-bottom: 6px;

  color: white;
  font-size: 0.8rem;
}

.p2p-col {
  width: 33.33%;

  display: flex;
  justify-content: center;
}

.p2p-enabled {
  background-color: rgb(4, 90, 4);
}

.p2p-enabled-low-charge {
  background-color: red;
}

.p2p-disable-cooling-down {
  background-color: purple;
}

.p2p-disabled-available {
  background-color: rgb(32, 110, 255);
}

.p2p-depleted {
  background-color: black;
}

.cooldown-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cooldown-circle {
  border-radius: 50%;
  // background-color: #ffffff;
  width: 20px;
  height: 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cooldown-mask {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
}

.cooldown-counter {
  position: relative;
  color: white;
  font-weight: bold;
  font-size: 12px;
  z-index: 2;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}
</style>
