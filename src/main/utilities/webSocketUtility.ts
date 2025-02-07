import { WebSocket } from 'ws'

import { TelemetryValue } from '../../preload/index.d'

import log from 'electron-log'

const url = 'ws://localhost:7125/sdk'
let ws: WebSocket

let hasBeenConnected = false

function connectToSDKServer() {
    log.info('time to connect to sdk server')
    ws = new WebSocket(url)
    ws.on('open', () => {
        log.info('connected to sdk server')
        ws.send('connected')
        process.send!({ name: 'sdk-web-socket-connected', value: true })

        hasBeenConnected = true
    })

    ws.on('message', function message(data) {
        const message: TelemetryValue = JSON.parse(data.toString('utf-8'))
        if (message.name === 'TelemetryDictionary') {
            process.send!(message)
        }
        else if (message.name === 'is-on-track') {
            log.info('utility file() is-on-track', message.value)
            process.send!({ name: 'is-on-track', value: message.value })
        }
        else {
            log.info('unknown message', message)
        }
    })

    ws.on('error', () => {
        log.info('error connecting to sdk server')
        log.info('retrying in 5 seconds')
        setTimeout(() => {
            connectToSDKServer()
        }, 5000)
    })

    ws.on('close', function close() {
        log.info('disconnected')
        ws.send!('close')
        ws.close()

        // close the process if it has been connected before, this is the case where the server
        // has been closed by the user
        if (hasBeenConnected) {
            process.exit(0)
        }
    })
}

connectToSDKServer()

log.info(`Hello from ${process.argv[2]}!`)

process.on('message', function (message: any) {
    log.info(`Message from main: ${message}`)
})
