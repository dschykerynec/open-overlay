import { MessagePortMain } from 'electron'

import log from 'electron-log'

import { TelemetryValue } from '../../preload/index.d'

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