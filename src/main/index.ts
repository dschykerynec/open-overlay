import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  UtilityProcess,
  utilityProcess,
  MessageChannelMain,
  Tray,
  Menu
} from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log'
import { basicMessage } from '../types/types'
import { UserPreferences } from '../types/userPreferences'

import { resolve, join } from 'path'

import racingCarIcon from '../../resources/racing-car.png?asset'
import helmetIcon from '../../resources/helmet_256x256.ico?asset'

import fs from 'fs'

const locked = app.requestSingleInstanceLock()
if (!locked) {
  log.info('app already running. quitting')
  app.quit()
}

let userPreferences: UserPreferences

let telemetryWindow: BrowserWindow | null
let mainMenuWindow: BrowserWindow | null
const allWindows: BrowserWindow[] = []
const overlayWindows: BrowserWindow[] = []

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

function getUserPreferences(): void {
  const userDataPath = app.getPath('userData')
  const userPreferencesPath = join(userDataPath, 'userPreferences.json')
  try {
    const rawData = fs.readFileSync(userPreferencesPath, 'utf8')
    const preferences: UserPreferences = JSON.parse(rawData)
    userPreferences = preferences
  } catch (error) {
    log.info('No user preferences found. Creating default preferences')

    const defaultPreferences: UserPreferences = new UserPreferences()
    userPreferences = defaultPreferences

    fs.writeFile(
      userPreferencesPath,
      JSON.stringify(defaultPreferences, null, 2),
      'utf8',
      (err) => {
        if (err) {
          console.error('Error writing preferences file:', err)
          return
        }
        console.log(`Default user preferences saved to ${userPreferencesPath}`)
      }
    )
  }
}
getUserPreferences()

function updateUserPreferences(fieldName: string, fieldValue: any): void {
  const userDataPath = app.getPath('userData')
  const userPreferencesPath = join(userDataPath, 'userPreferences.json')

  const preferences: UserPreferences = JSON.parse(fs.readFileSync(userPreferencesPath, 'utf8'))
  preferences[fieldName] = fieldValue

  fs.writeFile(userPreferencesPath, JSON.stringify(preferences, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Error writing preferences file:', err)
      return
    }
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
        showAllOverlays()
      } else if (data.value === false) {
        log.info('is-on-track FALSE close all windows')
        hideAllOverlays()
      }
    } else if (data.name === 'game-closed') {
      log.info('game-closed CLOSE ALL WINDOWS')
      hideAllOverlays()
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
  const windowPosition: number[] = userPreferences.telemetryOverlayPosition
  telemetryWindow = new BrowserWindow({
    title: 'telemetryOverlay',
    width: 365,
    height: 225,
    x: windowPosition[0],
    // I test dev on my secondary 1440p monitor so this ensures the window is on the correct monitor
    // x: is.dev ? 1096 + 2560 : 1096,
    y: windowPosition[1],
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
      preload: join(__dirname, '../preload/telemetry.js'),
      sandbox: false
    }
  })
  telemetryWindow.setIgnoreMouseEvents(true)
  allWindows.push(telemetryWindow)
  overlayWindows.push(telemetryWindow)

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

function setUpMainMenuWindow() {
  const windowPosition: number[] = userPreferences.mainMenuPosition
  mainMenuWindow = new BrowserWindow({
    title: 'mainMenu',
    width: 1100,
    height: 800,
    x: windowPosition[0],
    y: windowPosition[1],
    show: false,
    autoHideMenuBar: true,
    frame: true,
    icon: racingCarIcon,
    ...(process.platform === 'linux' ? { icon: racingCarIcon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/twoWayIPC.js'),
      sandbox: false
    }
  })
  allWindows.push(mainMenuWindow)

  mainMenuWindow.on('ready-to-show', () => {
    // mainMenuWindow?.show()
  })

  mainMenuWindow.on('close', () => {
    log.info('main menu closed')
    mainMenuWindow = null
  })

  mainMenuWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainMenuWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/html/mainMenu.html`)
  } else {
    mainMenuWindow.loadFile(join(__dirname, '../renderer/html/mainMenu.html'))
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
  allWindows.forEach((window) => {
    if (!window.isDestroyed()) {
      window.close()
    }
  })
}

function hideAllOverlays(): void {
  overlayWindows.forEach((overlayWindow) => {
    if (!overlayWindow.isDestroyed()) {
      overlayWindow.hide()
    }
  })
}

function showAllOverlays(): void {
  overlayWindows.forEach((overlayWindow) => {
    if (!overlayWindow.isDestroyed()) {
      overlayWindow.show()
    }
  })
}

function handleMessageFromRenderer(_event, message: basicMessage) {
  if (message.name === 'windows-draggable') {
    log.info('windows-draggable message received with value: ' + message.value)
    if (message.value === true) {
      showAllOverlays()
      overlayWindows.forEach((window) => {
        window.setIgnoreMouseEvents(false)
        window.webContents.send('windows-draggable', true)
      })
    } else {
      overlayWindows.forEach((window) => {
        window.setIgnoreMouseEvents(true)
        window.webContents.send('windows-draggable', false)
        updateUserPreferences(`${window.title}Position`, [
          window.getPosition()[0],
          window.getPosition()[1]
        ])
      })
    }
  }
}

let tray

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  ipcMain.on('message', handleMessageFromRenderer)

  tray = new Tray(helmetIcon)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Main Menu',
      click: function () {
        if (mainMenuWindow === null) {
          log.info('if')
          setUpMainMenuWindow()
        } else {
          log.info('else')
          mainMenuWindow?.show()
        }
      }
    },
    {
      label: 'Show Overlays',
      click: function () {
        showAllOverlays()
      }
    },
    {
      label: 'Hide Overlays',
      click: function () {
        hideAllOverlays()
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
  tray.setContextMenu(contextMenu)

  setupSdkUtility()
  setUpOverlays()
  setUpMainMenuWindow()

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
