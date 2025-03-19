export class UserPreferences {
  mainMenuPosition: number[]
  telemetryOverlayPosition: number[]
  toggleDraggableWindowsKeybind: string

  constructor() {
    this.mainMenuPosition = [0, 0]
    this.telemetryOverlayPosition = [0, 0]
    this.toggleDraggableWindowsKeybind = 'Control+Alt+Shift+M'
  }
}
