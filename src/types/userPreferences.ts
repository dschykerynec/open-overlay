export class UserPreferences {
  mainMenuPosition: [number, number]
  telemetryOverlayPosition: Record<string, [number, number]>
  toggleDraggableWindowsKeybind: string

  constructor() {
    this.mainMenuPosition = [0, 0]
    this.telemetryOverlayPosition = {}
    this.toggleDraggableWindowsKeybind = 'Control+Alt+Shift+M'
  }
}
