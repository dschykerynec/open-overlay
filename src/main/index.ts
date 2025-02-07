import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { fork, ChildProcess } from 'child_process'
import { resolve } from 'path'

let lapTimesWindow: BrowserWindow | null
let telemetryWindow: BrowserWindow | null
let relativeWindow: BrowserWindow | null
let standingsWindow: BrowserWindow | null
const windows: BrowserWindow[] = []

let webSocketChild: ChildProcess

function setupWebSocketUtility(): void {
    webSocketChild = fork(resolve(__dirname, 'webSocketUtility.js'), ['child'])

    webSocketChild.on('message', function (message: TelemetryValue) {
        if (message.name === 'LastLapTime') {
            lapTimesWindow?.webContents?.send('sdk-telemetry-update', message)
        }
        else if (message.name === 'TelemetryDictionary') {
            telemetryWindow?.webContents?.send('sdk-telemetry-update', message.value)
        }
        else if (message.name === 'is-on-track') {
            if (message.value === true) {
                console.log('is-on-track TRUE open all windows')
                setUpOverlays()
            }
            else if (message.value === false) {
                console.log('is-on-track FALSE close all windows')
                closeAllWindows()
            }
        }
        else if (message.name === 'game-closed') {
            console.log('game-closed CLOSE ALL WINDOWS')
            closeAllWindows()
        }
        else if (message.name === 'sdk-web-socket-connected') {
            console.log('sdk-web-socket-connected')
        }
        else if (message.name === 'is') {

        }
    })
    webSocketChild.on('close', function (code) {
        console.log('child process exited with code ' + code)
        closeAllWindows()
    })
    setTimeout(() => {
        webSocketChild.send('ping')
    }, 2_500)
}

function setUpLapTimesWindow() {
    lapTimesWindow = new BrowserWindow({
        width: 300,
        height: 700,
        x: 0,
        y: 0,
        show: false,
        autoHideMenuBar: true,
        frame: true,
        opacity: 0.25,
        alwaysOnTop: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })
    // lapTimesWindow.setIgnoreMouseEvents(true)
    windows.push(lapTimesWindow)

    lapTimesWindow.on('ready-to-show', () => {
        lapTimesWindow?.show()
    })

    lapTimesWindow.on('close', () => {
        console.log('lapTimesWindow closed')
        lapTimesWindow = null
    })

    lapTimesWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        lapTimesWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/html/lapTimes.html`)

    } else {
        lapTimesWindow.loadFile(join(__dirname, '../renderer/html/lapTimes.html'))
    }
}

function setUpTelemetryWindow() {
    telemetryWindow = new BrowserWindow({
        width: 380,
        height: 225,
        // height: 325,
        x: 1096,
        y: 773,
        show: false,
        autoHideMenuBar: true,
        frame: false,
        // frame: true,
        transparent: true,
        opacity: 0.75,
        alwaysOnTop: true,
        // focusable: false,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })
    // telemetryWindow.setIgnoreMouseEvents(true)
    windows.push(telemetryWindow)

    telemetryWindow.on('ready-to-show', () => {
        telemetryWindow?.show()
    })

    telemetryWindow.on('close', () => {
        console.log('telemetry closed')
        telemetryWindow = null
    })

    telemetryWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        telemetryWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/html/telemetry.html`)

    } else {
        telemetryWindow.loadFile(join(__dirname, '../renderer/html/telemetry.html'))
    }
}

function setUpRelativeWindow() {
    relativeWindow = new BrowserWindow({
        width: 500,
        height: 400,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })
    windows.push(relativeWindow)

    relativeWindow.on('ready-to-show', () => {
        relativeWindow?.show()
    })

    relativeWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        relativeWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/html/relative.html`)
    } else {
        console.log('else')
        relativeWindow.loadFile(join(__dirname, '../renderer/html/relative.html'))
    }
}

function setUpStandingsWindow() {
    standingsWindow = new BrowserWindow({
        width: 500,
        height: 400,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })
    windows.push(standingsWindow)

    standingsWindow.on('ready-to-show', () => {
        standingsWindow?.show()
    })

    standingsWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        standingsWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/html/standings.html`)
    } else {
        console.log('else')
        standingsWindow.loadFile(join(__dirname, '../renderer/html/standings.html'))
    }
}

function setUpOverlays(): void {
    setUpTelemetryWindow()
    telemetryWindow?.setAlwaysOnTop(true, 'screen-saver')
    // setUpLapTimesWindow()
    // setUpRelativeWindow()
    // setUpStandingsWindow()
}

ipcMain.on('close-program', (_event, _title) => {
    console.log('CLOSE PROGRAM IPC MAIN EVENT')
    app.quit()
})

function closeAllWindows(): void {
    windows.forEach((window) => {
        if (!window.isDestroyed()) {
            window.close()
        }
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    setupWebSocketUtility()

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            console.log('nothing to do here since windows only open when connection is established')
        }
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        console.log('window-all-closed')
    }
})

app.on('before-quit', () => {
    console.log('BEGINNING OF BEFORE QUIT')

    console.log('killing child process')
    webSocketChild.kill()

    console.log('END OF BEFORE QUIT')
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
