import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { callback } from 'chart.js/dist/helpers/helpers.core'

// Custom APIs for renderer
const api = {
  onSdkTelemetryUpdate: (callback) =>
    ipcRenderer.on('sdk-telemetry-update', (_event, value) => callback(value))
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electronAPI', {
      onSdkTelemetryUpdate: (callback) => {
        ipcRenderer.on('sdk-telemetry-update', (_event, value) => callback(value))
      },
      sessionInfoUpdate: (callback) => {
        ipcRenderer.on('session-info-update', (_event, value) => callback(value))
      },
      closeProgram: () => ipcRenderer.send('close-program'),
      windowsDraggable: (callback) => {
        ipcRenderer.on('windows-draggable', (_event, value) => callback(value))
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
