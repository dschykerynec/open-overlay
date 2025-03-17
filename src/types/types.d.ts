import { ElectronAPI } from '@electron-toolkit/preload'

export type ExtendedElectronAPI = ElectronAPI & {
  onSdkTelemetryUpdate: (callback: (lapTime: telemetryValue) => void) => void
  closeProgram: () => void
  sendMessage: (msg: basicMessage) => void
  windowsDraggable: (callback: (value: boolean) => void) => void
}

declare global {
  interface Window {
    electronAPI: ExtendedElectronAPI
    api: unknown
  }

  interface TelemetryValue {
    name: string
    value: unknown
  }
}

export interface TelemetryValue {
  name: string
  value: unknown
}

export interface Telemetry {
  ThrottleInputValue: number
  BrakeInputValue: number
  ClutchInputValue: number
  SteeringInputValue: number
  SteeringInputUnit: string
  SpeedValue: number
  SpeedUnit: string
  GearValue: number
}

export interface basicMessage {
  name: string
  value: any
}
