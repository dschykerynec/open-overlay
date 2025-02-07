import { WebSocket } from 'ws'

import { TelemetryValue } from '../../preload/index.d'

const url = 'ws://localhost:7125/sdk'
let ws: WebSocket

let hasBeenConnected = false

function connectToSDKServer() {
    console.log('time to connect to sdk server')
    ws = new WebSocket(url)
    ws.on('open', () => {
        console.log('connected to sdk server')
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
            console.log('utility file() is-on-track', message.value)
            process.send!({ name: 'is-on-track', value: message.value })
        }
        else {
            console.log('unknown message', message)
        }
    })

    ws.on('error', () => {
        console.log('error connecting to sdk server')
        console.log('retrying in 5 seconds')
        setTimeout(() => {
            connectToSDKServer()
        }, 5000)
    })

    ws.on('close', function close() {
        console.log('disconnected')
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

console.log(`Hello from ${process.argv[2]}!`)

process.on('message', function (message: any) {
    console.log(`Message from main: ${message}`)
})
