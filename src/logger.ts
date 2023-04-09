import debug, { type Debugger } from 'debug'

function CustomLogger (logger: Debugger): {
  (formatter: any, ...args: any[]): void
  enabled: boolean
  ifChanged: (formatter: any, ...args: any[]) => void
} {
  let value = ''
  const patched = (formatter: any, ...args: any[]): void => {
    logger(formatter, ...args)
  }
  patched.enabled = logger.enabled
  patched.ifChanged = (...args: any[]): void => {
    const newLogValue = args.map(String).join(' ')
    if (newLogValue !== value) {
      logger(newLogValue)
      value = newLogValue
    }
  }
  return patched
}

export const logApp = debug('vp-app')
export const logLayout = debug('vp-layout')
export const logPointerEvent = debug('vp-pointer-event')
export const logKeydown = debug('vp-keydown')
export const logKeyup = debug('vp-keyup')
export const logInputDirection = debug('vp-input-direction')
export const logPlayerBounds = debug('vp-player-bounds')
export const logPlayerState = debug('vp-player-state')
export const logCollisionBlock = debug('vp-collision-block')
export const logCameraboxBounds = CustomLogger(debug('vp-camerabox-bounds'))
export const logViewportBounds = CustomLogger(debug('vp-viewport-bounds'))
