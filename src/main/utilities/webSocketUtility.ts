import log from 'electron-log'


import { WebSocket } from 'ws'

import { TelemetryValue } from '../../preload/index.d'

const url = 'ws://localhost:7125/sdk'
let ws: WebSocket

function connectToSDKServer() {
    ws = new WebSocket(url)
    ws.on('open', () => {
        log.info('connected to iRacing SDKWrapper Service')
        ws.send('connected')
        process.send!({ name: 'sdk-web-socket-connected', value: true })
    })

    ws.on('message', function message(data) {
        const message: TelemetryValue = JSON.parse(data.toString('utf-8'))
        if (message.name === 'TelemetryDictionary') {
            process.send!(message)
        }
        else if (message.name === 'is-on-track') {
            process.send!({ name: 'is-on-track', value: message.value })
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

log.info(`Hello from ${process.argv[2]}!`)

process.on('message', function (message: any) {
    log.info(`Message from main: ${message}`)
})
