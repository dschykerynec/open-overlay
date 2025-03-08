import { MessagePortMain } from 'electron'

import log from 'electron-log'

let mainPort: MessagePortMain
let isOnTrack: Boolean = false

process.parentPort.once('message', (e) => {
  mainPort = e.ports[0]

  // Set up message handler for incoming messages from main
  mainPort.on('message', (message) => {
    log.info('Received message from main:', message)
    // Todo: handle incoming messages
  })

  mainPort.start()
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
  if (isOnTrack && !telemetry.values.IsOnTrack) {
    log.info('User just left track')
    isOnTrack = false
    mainPort.postMessage({ name: 'is-on-track', value: false })
  } else if (!isOnTrack && telemetry.values.IsOnTrack) {
    log.info('User just entered track')
    isOnTrack = true
    mainPort.postMessage({ name: 'is-on-track', value: true })
  }
  const telemetryValues: TelemetryValue = {
    name: 'TelemetryDictionary',
    value: {
      BrakeInputValue: telemetry.values.BrakeRaw,
      ThrottleInputValue: telemetry.values.ThrottleRaw,
      ClutchInputValue: 1 - telemetry.values.ClutchRaw,
      SteeringInputValue: telemetry.values.SteeringWheelAngle,
      GearValue: telemetry.values.Gear,
      SpeedValue: telemetry.values.Speed
    }
  }
  mainPort.postMessage(telemetryValues)
})
