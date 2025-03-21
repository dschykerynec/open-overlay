import { ElectronAPI } from '@electron-toolkit/preload'

export type ExtendedElectronAPI = ElectronAPI & {
  onSdkTelemetryUpdate: (callback: (lapTime: Telemetry) => void) => void
  sessionInfoUpdate: (callback: (sessionInfo: SessionInfo) => void) => void
  closeProgram: () => void
  sendMessage: (msg: basicMessage) => void
  windowsDraggable: (callback: (value: boolean) => void) => void
}

declare global {
  interface Window {
    electronAPI: ExtendedElectronAPI
    api: unknown
  }

  interface Telemetry {
    ThrottleInputValue: number
    BrakeInputValue: number
    ClutchInputValue: number
    SteeringInputValue: number
    SteeringInputUnit: string
    SpeedValue: number
    SpeedUnit: string
    GearValue: number
    P2PStatus: boolean
    P2PCount: number
  }

  interface BasicMessage {
    name: string
    value: any
  }

  interface SessionInfo {
    sessionType: string
    driverCarName: string
  }
}
