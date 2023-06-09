import { Container, Sprite, type Texture, Graphics } from 'pixi.js'
import { type IPlayerOptions, Player } from './Player'
import { StatusBar } from './StatusBar'
import { StartModal } from './StartModal'
import { InputHandler } from './InputHandler'
import { CollisionBlock } from './CollisionBlock'
import { type IMapSettings, MapSettings } from './MapSettings'
import { logCameraboxBounds, logLayout, logViewportBounds } from './logger'

export interface IGameOptions {
  viewWidth: number
  viewHeight: number
  levelSettings: IMapSettings
  textures: {
    levelBackgroundTexture: Texture
    warriorTextures: IPlayerOptions['textures']
  }
}

interface IBoundsData {
  top: number
  right: number
  bottom: number
  left: number
}

export class Game extends Container {
  public gameEnded = false
  public time = 0
  public maxXPivot = 0
  public maxYPivot = 0

  static options = {
    maxTime: 25000,
    scale: 4,
    camerabox: {
      offset: {
        x: -42,
        y: -34
      },
      initWidth: 100,
      initHeight: 100
    }
  }

  public viewWidth: number
  public viewHeight: number
  public player!: Player
  public inputHandler!: InputHandler
  public background!: Sprite
  public statusBar!: StatusBar
  public startModal!: StartModal
  public camerabox = new Graphics()
  public floorCollisionBlocks = new Container<CollisionBlock>()
  public platformCollisionBlocks = new Container<CollisionBlock>()
  constructor (options: IGameOptions) {
    super()

    this.viewWidth = options.viewWidth
    this.viewHeight = options.viewHeight
    this.setup(options)

    this.addEventLesteners()

    this.initLevel(options)
  }

  setup ({
    viewWidth,
    viewHeight,
    textures: {
      levelBackgroundTexture,
      warriorTextures
    }
  }: IGameOptions): void {
    const background = new Sprite(levelBackgroundTexture)
    this.addChild(background)
    this.background = background

    this.statusBar = new StatusBar()
    this.addChild(this.statusBar)

    this.background.addChild(this.floorCollisionBlocks)
    this.background.addChild(this.platformCollisionBlocks)

    this.player = new Player({ game: this, textures: warriorTextures })
    this.background.addChild(this.player)

    this.camerabox.beginFill(0xffff00)
    this.camerabox.drawRect(0, 0, Game.options.camerabox.initWidth, Game.options.camerabox.initHeight)
    this.camerabox.endFill()
    this.camerabox.alpha = logCameraboxBounds.enabled ? 0.5 : 0
    this.background.addChild(this.camerabox)

    this.inputHandler = new InputHandler({ eventTarget: this.background, relativeToTarget: this.player })

    this.startModal = new StartModal({ viewWidth, viewHeight })
    this.startModal.visible = false
    this.addChild(this.startModal)

    this.background.scale.set(Game.options.scale)
  }

  getCameraboxBounds (): IBoundsData {
    const { x, y, width, height } = this.camerabox
    const bounds: IBoundsData = {
      top: y,
      right: x + width,
      bottom: y + height,
      left: x
    }
    return bounds
  }

  updateCamerabox (): void {
    this.player.updateHitbox()
    const { position } = this.player.hitbox
    const { offset: { x, y } } = Game.options.camerabox
    this.camerabox.position = {
      x: position.x + x,
      y: position.y + y
    }
  }

  getViewportBounds (scale: number): IBoundsData {
    const { viewWidth, viewHeight } = this
    const { background: { pivot: { x, y } } } = this
    const bounds = {
      top: y,
      right: x + viewWidth * scale,
      bottom: y + viewHeight * scale,
      left: x
    }
    return bounds
  }

  addEventLesteners (): void {
    this.startModal.on('click', this.startGame)
  }

  startGame = (): void => {
    this.startModal.visible = false
    this.gameEnded = false
    this.time = 0
    this.player.restart()
    this.inputHandler.restart()
  }

  endGame (success = false): void {
    this.gameEnded = true
    this.player.stop()
    this.startModal.visible = true
    this.startModal.reasonText.text = success ? 'Win!!' : 'Time out!'
  }

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {
    this.viewWidth = viewWidth
    this.viewHeight = viewHeight
    const { width, height, scale } = this.background
    if (width > viewWidth) {
      this.maxXPivot = (width - viewWidth) / scale.x
    } else {
      this.maxXPivot = 0
    }
    if (height > viewHeight) {
      this.maxYPivot = (height - viewHeight) / scale.y
    } else {
      this.maxYPivot = 0
    }
    logLayout(`x=${this.x} y=${this.y} w=${width} h=${height}`)
    this.statusBar.position.set(viewWidth / 2 - this.statusBar.width / 2, 0)
    this.startModal.position.set(viewWidth / 2 - this.startModal.width / 2, viewHeight / 2 - this.startModal.height / 2)
  }

  handleUpdate (deltaMS: number): void {
    if (this.gameEnded) {
      return
    }
    this.time += deltaMS
    this.statusBar.updateTime(this.time)
    if (this.time > Game.options.maxTime) {
      this.endGame()
      return
    }
    this.player.handleUpdate(deltaMS)
    this.handleCamera()
  }

  handleCamera (): void {
    this.updateCamerabox()
    const cameraboxBounds = this.getCameraboxBounds()
    const viewportBounds = this.getViewportBounds(1 / Game.options.scale)
    logViewportBounds(`top=${viewportBounds.top} right=${viewportBounds.right} bottom=${viewportBounds.bottom} left=${viewportBounds.left}`)
    const { pivot } = this.background
    if (cameraboxBounds.top < viewportBounds.top) {
      pivot.y -= viewportBounds.top - cameraboxBounds.top
    } else if (cameraboxBounds.bottom > viewportBounds.bottom) {
      pivot.y += cameraboxBounds.bottom - viewportBounds.bottom
    }
    if (cameraboxBounds.left < viewportBounds.left) {
      pivot.x -= viewportBounds.left - cameraboxBounds.left
    } else if (cameraboxBounds.right > viewportBounds.right) {
      pivot.x += cameraboxBounds.right - viewportBounds.right
    }
    if (pivot.x < 0) {
      pivot.x = 0
    } else if (pivot.x > this.maxXPivot) {
      pivot.x = this.maxXPivot
    }
    if (pivot.y < 0) {
      pivot.y = 0
    } else if (pivot.y > this.maxYPivot) {
      pivot.y = this.maxYPivot
    }
  }

  initLevel ({ levelSettings }: IGameOptions): void {
    const cell = 16
    const floorCollisionPoints = MapSettings.mapTileToPositions({
      mapSettings: levelSettings,
      layerName: 'FloorCollisions',
      tileIds: [202],
      tilesPerRow: 36,
      cell
    })

    floorCollisionPoints.forEach(cp => {
      this.floorCollisionBlocks.addChild(new CollisionBlock({
        initX: cp.x,
        initY: cp.y,
        initWidth: cell,
        initHeight: cell
      }))
    })

    const platformCollisionPoints = MapSettings.mapTileToPositions({
      mapSettings: levelSettings,
      layerName: 'PlatformCollisions',
      tileIds: [202],
      tilesPerRow: 36,
      cell
    })

    platformCollisionPoints.forEach(cp => {
      this.platformCollisionBlocks.addChild(new CollisionBlock({
        initX: cp.x,
        initY: cp.y,
        initWidth: cell,
        initHeight: cell / 2
      }))
    })

    this.player.restart()
  }
}
