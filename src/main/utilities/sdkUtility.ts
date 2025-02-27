import { MessagePortMain } from 'electron'

import log from 'electron-log'
import { WebSocket } from 'ws'

import { TelemetryValue } from '../../preload/index.d'

let mainPort: MessagePortMain

const url = 'ws://localhost:7125/sdk'
let ws: WebSocket

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

function connectToSDKServer() {
  log.info('connecting to iRacing SDKWrapper Service')
    ws = new WebSocket(url)
    ws.on('open', () => {
        log.info('connected to iRacing SDKWrapper Service')
        ws.send('connected')
        mainPort.postMessage({ name: 'sdk-web-socket-connected', value: true })
    })

    ws.on('message', function message(data) {
        const message: TelemetryValue = JSON.parse(data.toString('utf-8'))
        if (message.name === 'TelemetryDictionary') {
            mainPort.postMessage(message)
        }
        else if (message.name === 'is-on-track') {
            mainPort.postMessage({ name: 'is-on-track', value: message.value })
        }
        else {
            log.warn('unknown message')
            log.warn(message)
        }
    })

    ws.on('error', () => {
        // log.info('error connecting to sdk server')
        // log.info('retrying in 5 seconds')
        setTimeout(() => {
            connectToSDKServer()
        }, 5000)
    })

    ws.on('close', function close() {
        // log.info('disconnected')
        ws.send!('close')
        ws.close()
    })
}

connectToSDKServer()