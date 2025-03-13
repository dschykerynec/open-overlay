import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  UtilityProcess,
  utilityProcess,
  MessageChannelMain,
  Tray,
  Menu,
  nativeImage
} from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log'

import { resolve, join } from 'path'

import racingCarIcon from '../../resources/racing-car.png?asset'
import helmetIcon from '../../resources/helmet_256x256.ico?asset'

let telemetryWindow: BrowserWindow | null
const windows: BrowserWindow[] = []

let sdkUtilityProcess: UtilityProcess

function setupLogging(): void {
  log.initialize()
  const timestamp = new Date().getTime()
  log.transports.file.fileName = `main-${timestamp}.log`

  log.info(`logger initialized. logging to file ${log.transports.file.fileName}`)
}
setupLogging()

log.info('app version: ' + app.getVersion())
log.info('isDev: ' + is.dev)

function handleSquirrelEvents(): boolean {
  log.info('handleSquirrelEvents')

  let options = process.argv.slice(1)
  log.info('command line options: ')
  log.info(options)

  if (!(options && options.length >= 1)) {
    log.info('no options. checking for app update')
    tryUpdateApp()
    return true
  }

  let m = options[0].match(/--squirrel-([a-z]+)/)
  if (!(m && m[1])) {
    log.info('running app normally. will check for app update')
    tryUpdateApp()
    return true
  }
  if (m[1] === 'firstrun') {
    log.info('running app normally')
    return true
  }

  log.info('squirrelCommand: ' + m[1])

  if (m[1] === 'install') {
    log.info('installing app for the first time')
    return false
  } else if (m[1] === 'firstrun') {
    log.info('first runtime running the app. nothing special to do')
    return true
  } else if (m[1] === 'updated') {
    log.info('updated runtime running the app. closing app')
    return false
  } else if (m[1] === 'obsolete') {
    log.info('obsolete version. closing app')
    return false
  } else if (m[1] === 'uninstall') {
    log.info('uninstalling app.')

    // todo: uninstall stuff

    return false
  }

  return true
}
const shouldRunApp = handleSquirrelEvents()
if (!shouldRunApp) {
  app.quit()
  process.exit(0)
}

function tryUpdateApp(): void {
  const { updateElectronApp, UpdateSourceType } = require('update-electron-app')
  // const updateInterval = '24 hours'

  updateElectronApp({
    // updateInterval: updateInterval,
    logger: require('electron-log')
  })
}

console.log('\n')

function setupSdkUtility(): void {
  const { port1, port2 } = new MessageChannelMain()
  sdkUtilityProcess = utilityProcess.fork(resolve(__dirname, 'sdkUtility.js'))
  sdkUtilityProcess.postMessage({ message: 'hello' }, [port1])

  sdkUtilityProcess.on('spawn', function () {
    log.info('sdkUtilityProcesss successfully spawned')
  })

  port2.on('message', function (message) {
    const data = message.data as TelemetryValue
    if (data.name === 'TelemetryDictionary') {
      telemetryWindow?.webContents?.send('sdk-telemetry-update', data.value)
    } else if (data.name === 'is-on-track') {
      if (data.value === true) {
        log.info('is-on-track TRUE open all windows')
        showAllWindows()
      } else if (data.value === false) {
        log.info('is-on-track FALSE close all windows')
        hideAllWindows()
      }
    } else if (data.name === 'game-closed') {
      log.info('game-closed CLOSE ALL WINDOWS')
      hideAllWindows()
    } else if (data.name === 'sdk-web-socket-connected') {
      log.info('sdk-web-socket-connected')
    } else if (data.name === 'is') {
    }
  })
  port2.start()

  sdkUtilityProcess.on('exit', function (code) {
    log.info('sdkUtilityProcesss exited with code ' + code)
    closeAllWindows()
  })
}

function setUpTelemetryWindow() {
  telemetryWindow = new BrowserWindow({
    width: 365,
    height: 225,
    // I test dev on my secondary 1440p monitor so this ensures the window is on the correct monitor
    x: 1096,
    // x: is.dev ? 1096 + 2560 : 1096,
    y: 773,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    // frame: true,
    transparent: true,
    opacity: 0.9,
    alwaysOnTop: true,
    // focusable: false,
    icon: racingCarIcon,
    ...(process.platform === 'linux' ? { icon: racingCarIcon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  // telemetryWindow.setIgnoreMouseEvents(true)
  windows.push(telemetryWindow)

  telemetryWindow.on('ready-to-show', () => {
    telemetryWindow?.setAlwaysOnTop(true, 'screen-saver')
  })

  telemetryWindow.on('close', () => {
    log.info('telemetry closed')
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

function setUpOverlays(): void {
  setUpTelemetryWindow()
}

ipcMain.on('close-program', (_event, _title) => {
  log.info('CLOSE PROGRAM IPC MAIN EVENT')
  app.quit()
})

function closeAllWindows(): void {
  windows.forEach((window) => {
    if (!window.isDestroyed()) {
      window.close()
    }
  })
}

function hideAllWindows(): void {
  windows.forEach((window) => {
    if (!window.isDestroyed()) {
      window.hide()
    }
  })
}

function showAllWindows(): void {
  windows.forEach((window) => {
    if (!window.isDestroyed()) {
      window.show()
    }
  })
}

let tray

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  tray = new Tray(helmetIcon)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Windows',
      click: function () {
        telemetryWindow?.show()
      }
    },
    {
      label: 'Hide Windows',
      click: function () {
        telemetryWindow?.hide()
      }
    },
    {
      label: 'Quit App',
      click: function () {
        app.quit()
      }
    }
  ])
  tray.setToolTip('Open Overlay')
  tray.setTitle('This is my title')
  tray.setContextMenu(contextMenu)

  setupSdkUtility()
  setUpOverlays()

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
      log.info('nothing to do here since windows only open when connection is established')
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    log.info('window-all-closed')
  }
})

app.on('before-quit', () => {
  log.info('BEGINNING OF BEFORE QUIT')

  if (sdkUtilityProcess.pid !== undefined) {
    log.info('killing sdkUtilityProcess process')
    sdkUtilityProcess.kill()
  } else {
    log.info('sdkUtilityProcess already exited')
  }

  log.info('END OF BEFORE QUIT')
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
