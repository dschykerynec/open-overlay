import { MessagePortMain } from 'electron'

import log from 'electron-log'

let mainPort: MessagePortMain
let isOnTrack: Boolean = false
let driverCarIdx: number = -1
let carScreenName: string = ''
let isFirstSessionInfo: Boolean = true

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
  mainPort.postMessage({ name: 'is-on-track', value: false })
})

iracing.on('Telemetry', (telemetry) => {
  if (driverCarIdx === -1) {
    return
  }
  if (isOnTrack && !telemetry.values.IsOnTrack) {
    log.info('User just left track')
    isOnTrack = false
    mainPort.postMessage({ name: 'is-on-track', value: false })
  } else if (!isOnTrack && telemetry.values.IsOnTrack) {
    log.info('User just entered track')
    isOnTrack = true
    mainPort.postMessage({ name: 'is-on-track', value: true })
  }
  const telemetryValues: BasicMessage = {
    name: 'TelemetryDictionary',
    value: {
      BrakeInputValue: telemetry.values.BrakeRaw,
      ThrottleInputValue: telemetry.values.ThrottleRaw,
      ClutchInputValue: 1 - telemetry.values.ClutchRaw,
      SteeringInputValue: telemetry.values.SteeringWheelAngle,
      GearValue: telemetry.values.Gear,
      SpeedValue: telemetry.values.Speed,
      P2PStatus: telemetry.values.CarIdxP2P_Status[driverCarIdx],
      P2PCount: telemetry.values.CarIdxP2P_Count[driverCarIdx]
    }
  }
  mainPort.postMessage(telemetryValues)
})

iracing.on('SessionInfo', function (evt) {
  driverCarIdx = evt.data.DriverInfo.DriverCarIdx
  carScreenName = evt.data.DriverInfo.Drivers[driverCarIdx].CarScreenName

  let currentSessionNum = evt.data.SessionInfo.CurrentSessionNum
  let session = evt.data.SessionInfo.Sessions[currentSessionNum]

  const sessionInfo: SessionInfo = {
    sessionType: session.SessionType,
    carScreenName: carScreenName
  }
  mainPort.postMessage({ name: 'session-info-update', value: sessionInfo })

  if (isFirstSessionInfo) {
    isFirstSessionInfo = false
    mainPort.postMessage({ name: 'first-session-info', value: evt })
  }
})
