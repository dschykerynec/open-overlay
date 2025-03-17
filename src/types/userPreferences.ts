export class UserPreferences {
  mainMenuPosition: number[]
  telemetryOverlayPosition: number[]

  constructor() {
    this.mainMenuPosition = [0, 0]
    this.telemetryOverlayPosition = [0, 0]
  }
}
