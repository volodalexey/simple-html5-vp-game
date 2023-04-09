import { Graphics } from 'pixi.js'
import { logCollisionBlock } from './logger'

interface ICollisionBlockOptions {
  initX: number
  initY: number
  initWidth: number
  initHeight: number
}

export class CollisionBlock extends Graphics {
  constructor ({ initX, initY, initWidth, initHeight }: ICollisionBlockOptions) {
    super()
    this.beginFill(0xff0000)
    this.drawRect(0, 0, initWidth, initHeight)
    this.endFill()
    this.alpha = logCollisionBlock.enabled ? 0.5 : 0
    this.position.set(initX, initY)
  }

  getRectBounds (): {
    top: number
    right: number
    bottom: number
    left: number
  } {
    return {
      top: this.y,
      right: this.x + this.width,
      bottom: this.y + this.height,
      left: this.x
    }
  }
}
