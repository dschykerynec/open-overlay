import { MessagePortMain } from 'electron'

import log from 'electron-log'

import { TelemetryValue } from '../../preload/index.d'
import { s } from 'vite/dist/node/types.d-aGj9QkWt'

let mainPort: MessagePortMain

process.parentPort.once('message', (e) => {
  mainPort = e.ports[0]

  // Set up message handler for incoming messages from main
  mainPort.on('message', (message) => {
    log.info('Received message from main:', message)
    // Handle incoming messages
  })

  mainPort.start()

  mainPort.postMessage({
    speed: 120.5,
    gear: 3,
    rpm: 8500,
    throttle: 0.5,
    brake: 0.0,
    // Any other data you want to send
  })
})

const irsdk = require('iracing-sdk-js')
irsdk.init({ telemetryUpdateInterval: 50 })
const iracing = irsdk.getInstance()

log.info('irsdk initialized')

iracing.on('Connected', () => {
  log.info('Connected to iRacing')
})

iracing.on('Disconnected', () => {
  log.info('Disconnected from iRacing')
})

iracing.on('Telemetry', (telemetry) => {
  const telemetryValues: TelemetryValue = {
    name: 'TelemetryDictionary',
    value: {
      BrakeInputValue: telemetry.values.BrakeRaw,
      ThrottleInputValue: telemetry.values.ThrottleRaw,
      SteeringInputValue: telemetry.values.SteeringWheelAngle,
      GearValue: telemetry.values.Gear,
      SpeedValue: telemetry.values.Speed,
    }
  }
  mainPort.postMessage(telemetryValues)
})